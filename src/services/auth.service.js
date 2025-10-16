// src/services/auth.service.js
import { authRepository } from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/auth.js";
import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import log from "../config/logger.js";
import { emailService } from "./email.service.js";
import { writeAudit } from "../middlewares/auditLogger.middleware.js";
import { SessionRepository } from "../repositories/session.repository.js";

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

        // Helper to log attempts
        const logAttempt = async ({ success, reason, session_id = null }) => {
            await authRepository.logSessionAttempt({

                session_id,
                event: "login_attempt",
                details: {
                    emailAttempt: email,
                    success,
                    reason,
                    user_id: user?.id || null,
                },
                req
            });
        };

        if (!user) {
            await logAttempt({ success: false, reason: "no_user" });
            throw { status: 401, message: "Invalid credentials" };
        }
        if (!verifyPassword(password, user.password_hash)) {
            await logAttempt({ success: false, reason: "bad_password" });
            throw { status: 401, message: "Invalid credentials" };
        }

        if (user.status !== "active") {
            await logAttempt({ success: false, reason: "inactive_user_attempting_to_login" });
            throw { status: 403, message: "User inactive" };
        }

        // Get tenant mapping
        const mapping = await authRepository.getUserTenant(user.id);
        const tenant_id = mapping?.tenant_id ?? null;


        // Log successful login with session ID
        await logAttempt({ success: true, reason: "logged_successfully" });

        // Audit login
        writeAudit({
            tenantId: tenant_id,
            userId: user.id,
            module: "user_mgmt",
            action: "LOGIN",
            target_type: "User",
            description: `User "${user.email}" logged in`,
            metadata: { route: "/auth/login", ip: req.ip }
        }).catch(log.error);

        return {
            tenant_id: tenant_id,
            user: { id: user.id, full_name: user.full_name, email: user.email },
        };
    },


    async refreshToken({ refresh_token, req }) {
        try {
            const payload = verifyRefreshToken(refresh_token);

            const user = await authRepository.findUserById(payload.user_id);
            const session = await SessionRepository.findById(payload?.session_id)
            if (!user) throw new Error("Invalid refresh token");
            if (payload.token_version !== session.token_version) throw new Error("Token revoked");

            const newAccess = signAccessToken({ user_id: user.id, tenant_id: payload.tenant_id, session_id: session.session_id, token_version: session.token_version });

            await SessionRepository.logEvent({
                session_id: payload.session_id,
                event: "session.refreshed",
                details: { user_id: user.id, ip: req.ip, user_agent: req.headers["user-agent"] }
            }, req);

            return { access_token: newAccess, refresh_token };
        } catch (err) {
            console.log(err)
            throw { status: 401, message: "Invalid or expired refresh token" };
        }
    },

    logout: async ({ user_id, session_id, req = null }) => {
        await authRepository.revokeSession(session_id, user_id);
        await authRepository.logEvent({
            session_id,                // optional, can be null if session not found
            user_id,                   // optional scalar
            event: "logout",
            provider: "local",         // optional, can pass auth provider
            ip_address: req?.ip || null,
            user_agent: req?.headers["user-agent"] || null,
            details: { reason: "manual logout", user_id },
        });

    },

    logoutAllDevices: async ({ user_id }) => {
        await authRepository.revokeAllSessions(user_id);
        await authRepository.logGlobalEvent(user_id, "logout_all");
    },
};