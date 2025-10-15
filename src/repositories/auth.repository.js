// src/repositories/auth.repository.js
import { prisma } from "../prisma.js";
import { v4 as uuidv4 } from "uuid";

export const authRepository = {
    findUserByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    findUserById: (id) => prisma.user.findUnique({ where: { id } }),

    createTenant: (tx, id, name, domain, planType) =>
        tx.tenant.create({ data: { id, name, domain, planType } }),

    createUser: (tx, email, fullName, passwordHash) =>
        tx.user.create({ data: { id: uuidv4(), email, fullName, passwordHash, status: "active", tokenVersion: 0 } }),

    mapUserToTenant: (tx, tenantId, userId) =>
        tx.userOrgMap.create({ data: { id: uuidv4(), tenantId, userId, roleInOrg: "owner" } }),

    createDefaultPolicy: (tx, tenantId) =>
        tx.tenantPolicy.create({ data: { tenantId, allowCustomSmtp: false, maxMailboxes: 0, storageLimitMb: 1024 } }),

    createDefaultRoles: async (tx, tenantId) => {
        const role = await tx.role.create({ data: { id: uuidv4(), tenantId, name: "admin", description: "Tenant admin" } });
        await tx.rolePermission.createMany({
            data: [
                { id: uuidv4(), roleId: role.id, key: "user:create" },
                { id: uuidv4(), roleId: role.id, key: "user:update" }
            ]
        });
    },

    getUserTenant: (userId) =>
        prisma.userOrgMap.findFirst({ where: { userId }, select: { tenantId: true } }),

    createSession: (userId, tenantId, req) =>
        prisma.session.create({
            data: {
                id: uuidv4(),
                userId,
                tenantId,
                ipAddress: req.ip,
                deviceInfo: req.headers["user-agent"],
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            }
        }),

    logSessionAttempt: (userId, emailAttempt, success, reason) =>
        prisma.sessionLog.create({
            data: { id: uuidv4(), userId, emailAttempt, success, reason }
        }),
    revokeSession: async (sessionId, userId) => {
        return prisma.session.updateMany({
            where: { id: sessionId, userId, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });
    },

    revokeAllSessions: async (userId) => {
        return prisma.session.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });
    },

    logEvent: async ({ sessionId, userId, event }) => {
        return prisma.sessionLog.create({
            data: { sessionId, userId, event, createdAt: new Date() },
        });
    },

    logGlobalEvent: async (userId, event) => {
        return prisma.sessionLog.create({ data: { userId, event, createdAt: new Date() } });
    },
};
