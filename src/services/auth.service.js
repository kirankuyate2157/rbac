// src/services/auth.service.js
import { authRepository } from "../repositories/auth.repository.js";
import { hashPassword, verifyPassword, signAccessToken, signRefreshToken } from "../utils/auth.js";
import { prisma } from "../prisma.js";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";

export const authService = {
    async registerTenant(data, req) {
        const { company_name, domain, plan_type, admin } = data;

        const existing = await authRepository.findUserByEmail(admin.email);
        if (existing) throw { status: 409, message: "Email already registered" };

        const tenantId = uuidv4();
        const passwordHash = hashPassword(admin.password);

        const { tenant, user } = await prisma.$transaction(async (tx) => {
            const tenant = await authRepository.createTenant(tx, tenantId, company_name, domain, plan_type);
            const user = await authRepository.createUser(tx, admin.email, admin.full_name, passwordHash);
            await authRepository.mapUserToTenant(tx, tenant.id, user.id);
            await authRepository.createDefaultPolicy(tx, tenant.id);
            await authRepository.createDefaultRoles(tx, tenant.id);
            return { tenant, user };
        });

        // Tokens
        const accessToken = signAccessToken({ userId: user.id, tenantId, tokenVersion: 0 });
        const refreshToken = signRefreshToken({ userId: user.id, tenantId, tokenVersion: 0 });

        // Audit + background welcome email
        prisma.auditLog.create({
            data: { actorUserId: user.id, tenantId, action: "tenant.create", route: "/auth/register" }
        }).catch(console.error);

        await prisma.emailOutbox.create({
            data: {
                id: uuidv4(),
                tenantId,
                to: user.email,
                subject: "Welcome to Kways!",
                body: "Your tenant has been created successfully."
            }
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
        const tenantId = mapping?.tenantId ?? null;

        const tokens = {
            access_token: signAccessToken({ userId: user.id, tenantId, tokenVersion: user.tokenVersion }),
            refresh_token: signRefreshToken({ userId: user.id, tenantId, tokenVersion: user.tokenVersion })
        };

        await authRepository.createSession(user.id, tenantId, req);
        prisma.auditLog.create({ data: { actorUserId: user.id, tenantId, action: "auth.login", route: "/auth/login" } }).catch(console.error);

        return {
            user: { id: user.id, email: user.email, full_name: user.fullName },
            tokens
        };
    },

    async refreshToken({ refresh_token }) {
        try {
            const payload = jwt.verify(refresh_token, process.env.REFRESH_SECRET);
            const user = await authRepository.findUserById(payload.userId);
            if (!user) throw new Error("Invalid refresh token");
            if (payload.tokenVersion !== user.tokenVersion) throw new Error("Token revoked");

            const newAccess = signAccessToken({ userId: user.id, tenantId: payload.tenantId, tokenVersion: user.tokenVersion });
            const newRefresh = signRefreshToken({ userId: user.id, tenantId: payload.tenantId, tokenVersion: user.tokenVersion });

            return { access_token: newAccess, refresh_token: newRefresh };
        } catch (err) {
            throw { status: 401, message: "Invalid or expired refresh token" };
        }
    },
     logout: async ({ userId, sessionId }) => {
    await authRepository.revokeSession(sessionId, userId);
    await authRepository.logEvent({ sessionId, userId, event: "logout" });
  },

  logoutAllDevices: async ({ userId }) => {
    await authRepository.revokeAllSessions(userId);
    await authRepository.logGlobalEvent(userId, "logout_all");
  },
};