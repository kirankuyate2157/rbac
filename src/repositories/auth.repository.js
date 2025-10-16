// src/repositories/auth.repository.js
import prisma from "../config/db.js";
import { v4 as uuidv4 } from "uuid";

export const authRepository = {
    findUserByEmail: (email) => prisma.user.findUnique({ where: { email } }),
    findUserById: (id) => prisma.user.findUnique({ where: { id } }),
    findTenantByDomain: (domain) => prisma.tenant.findUnique({ where: { domain } }),
    createTenant: (tx, id, name, domain, plan_type) =>
        tx.tenant.create({ data: { id, name, domain, plan_type, status: "active" } }),

    createUser: (tx, email, full_name, password_hash) =>
        tx.user.create({ data: { id: uuidv4(), email, full_name, password_hash, status: "active" } }),

    mapUserToTenant: (tx, tenant_id, user_id) =>
        tx.userOrgMap.create({
            data: {
                id: uuidv4(), role_in_org: "owner", user: {
                    connect: { id: user_id }
                }, tenant: {
                    connect: { id: tenant_id }
                },
            }
        }),

    createDefaultPolicy: (tx, tenant_id) =>
        tx.tenantPolicy.create({ data: { tenant_id, storage_limit_mb: 1024, allow_auto_sync: false } }),

    createDefaultRoles: async (tx, tenant_id) => {
        const role = await tx.role.create({ data: { id: uuidv4(), tenant_id, name: "admin", description: "Tenant admin" } });
        await tx.rolePermission.createMany({
            data: [
                { id: uuidv4(), role_id: role.id, permission_key: "user:create" },
                { id: uuidv4(), role_id: role.id, permission_key: "user:update" }
            ]
        });
    },

    getUserTenant: (user_id) =>
        prisma.userOrgMap.findFirst({ where: { user_id }, select: { tenant_id: true } }),

    createSession: (user_id, tenant_id, req) =>
        prisma.session.create({
            data: {
                id: uuidv4(),
                user_id,
                tenant_id,
                ip_address: req.ip,
                deviceInfo: req.headers["user-agent"],
                token_version: 0,
                expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
            }
        }),

    logSessionAttempt: async ({
        session_id = null,
        event = "generic_event",
        details = {},
        req = null
    }) => {
        try {
            const logEntry = await prisma.sessionLog.create({
                data: {
                    id: uuidv4(),
                    session_id,          // optional
                    event,
                    provider: "local",   // default, can be customized if needed
                    ip_address: req?.ip || null,
                    user_agent: req?.headers?.["user-agent"] || null,
                    details,
                },
            });
            return logEntry;
        } catch (err) {
            console.error("Error logging session attempt:", err);
            // Don't break main flow
            return null;
        }
    },

    revokeSession: async (sessionId, user_id) => {
        return prisma.session.updateMany({
            where: { id: sessionId, user_id, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });
    },

    revokeAllSessions: async (user_id) => {
        return prisma.session.updateMany({
            where: { user_id, isActive: true },
            data: { isActive: false, revokedAt: new Date() },
        });
    },

    logEvent: async ({ sessionId, user_id, event }) => {
        return prisma.sessionLog.create({
            data: { sessionId, user_id, event, createdAt: new Date() },
        });
    },

    logGlobalEvent: async (user_id, event) => {
        return prisma.sessionLog.create({ data: { user_id, event, createdAt: new Date() } });
    },
};
