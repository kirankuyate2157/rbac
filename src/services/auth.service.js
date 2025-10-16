// src/services/auth.service.js
import { authRepository } from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken } from "../utils/auth.js";
import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import log from "../config/logger.js";
import { emailService } from "./email.service.js";
import { writeAudit } from "../middlewares/auditLogger.middleware.js";

export const authService = {
    async registerTenant(data, req) {
        const { company_name, domain, plan_type, admin } = data;

        const existing = await authRepository.findUserByEmail(admin.email);
        if (existing) throw { status: 409, message: "Email already registered" };
        if (domain) {
            const existingDomain = await authRepository.findTenantByDomain(domain)
            if (existingDomain) throw { status: 409, message: "Domain already registered" };
        }
        const tenant_id = uuidv4();
        const passwordHash = hashPassword(admin.password);

        const { tenant, user } = await prisma.$transaction(async (tx) => {
            const tenant = await authRepository.createTenant(tx, tenant_id, company_name, domain, plan_type);
            const user = await authRepository.createUser(tx, admin.email, admin.full_name, passwordHash);
            await authRepository.mapUserToTenant(tx, tenant.id, user.id);
            await authRepository.createDefaultPolicy(tx, tenant.id);
            await authRepository.createDefaultRoles(tx, tenant.id);
            return { tenant, user };
        });

        // Tokens
        const accessToken = signAccessToken({ user_id: user.id, tenant_id, token_version: 0 });
        const refreshToken = signRefreshToken({ user_id: user.id, tenant_id, token_version: 0 });

        // Audit + background welcome email
        writeAudit({
            tenantId: tenant.id,
            userId: user.id,
            module: "tenant_mgmt",
            action: "CREATE",
            target_type: "Tenant",
            description: `Tenant "${company_name}" created`,
            metadata: { route: "/auth/register", ip: req?.ip }
        }).catch(log.error);

        writeAudit({
            tenantId: tenant.id,
            userId: user.id,
            module: "user_mgmt",
            action: "CREATE",
            target_type: "User",
            description: `Admin user "${user.email}" created for tenant`,
            metadata: { route: "/auth/register", ip: req?.ip }
        }).catch(log.error);

        await emailService.queueEmail({
            tenant_id,
            user_id: user.id,
            to: user.email,
            subject: "Welcome to K-RBAC!",
            body: "Your tenant has been created successfully."
        });

        return {
            tenant_id: tenant.id,
            user: { id: user.id, email: user.email },
            access_token: accessToken,
            refresh_token: refreshToken
        };
    },

    async loginUser({ email, password }, req) {
        const user = await authRepository.findUserByEmail(email);
        if (!user) {
            await authRepository.logSessionAttempt(null, email, false, "no_user");
            throw { status: 401, message: "Invalid credentials" };
        }

        if (!verifyPassword(password, user.passwordHash)) {
            await authRepository.logSessionAttempt(user.id, email, false, "bad_password");
            throw { status: 401, message: "Invalid credentials" };
        }

        if (user.status !== "active") throw { status: 403, message: "User inactive" };

        const mapping = await authRepository.getUserTenant(user.id);
        const tenant_id = mapping?.tenant_id ?? null;

        const tokens = {
            access_token: signAccessToken({ user_id: user.id, tenant_id, token_version: user.token_version }),
            refresh_token: signRefreshToken({ user_id: user.id, tenant_id, token_version: user.token_version })
        };

        await authRepository.createSession(user.id, tenant_id, req);
        // 5️⃣ Audit logs (fire & forget)
        writeAudit({
            tenantId: tenant.id,
            userId: user.id,
            module: "tenant_mgmt",
            action: "CREATE",
            target_type: "Tenant",
            description: `Tenant "${company_name}" created`,
            metadata: { route: "/auth/register", ip: req.ip }
        }).catch(log.error);

        writeAudit({
            tenantId: tenant.id,
            userId: user.id,
            module: "user_mgmt",
            action: "CREATE",
            target_type: "User",
            description: `Admin user "${user.email}" created for tenant`,
            metadata: { route: "/auth/register", ip: req.ip }
        }).catch(log.error);
        return {
            user: { id: user.id, email: user.email, full_name: user.fullName },
            tokens
        };
    },


    async refreshToken({ refresh_token }) {
        try {
            const payload = jwt.verify(refresh_token, process.env.REFRESH_SECRET);
            const user = await authRepository.findUserById(payload.user_id);
            if (!user) throw new Error("Invalid refresh token");
            if (payload.token_version !== user.token_version) throw new Error("Token revoked");

            const newAccess = signAccessToken({ user_id: user.id, tenant_id: payload.tenant_id, token_version: user.token_version });
            const newRefresh = signRefreshToken({ user_id: user.id, tenant_id: payload.tenant_id, token_version: user.token_version });

            return { access_token: newAccess, refresh_token: newRefresh };
        } catch (err) {
            throw { status: 401, message: "Invalid or expired refresh token" };
        }
    },
    logout: async ({ user_id, sessionId }) => {
        await authRepository.revokeSession(sessionId, user_id);
        await authRepository.logEvent({ sessionId, user_id, event: "logout" });
    },

    logoutAllDevices: async ({ user_id }) => {
        await authRepository.revokeAllSessions(user_id);
        await authRepository.logGlobalEvent(user_id, "logout_all");
    },
};