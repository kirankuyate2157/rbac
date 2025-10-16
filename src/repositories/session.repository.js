import prisma from "../config/db.js";
import { log } from "../config/logger.js";

export const SessionRepository = {
    /**
     * Create a new session record
     */
    async create(data) {
        try {
            const session = await prisma.session.create({ data });
            log.debug("Session created:", session.id);
            return session;
        } catch (err) {
            log.error("Error creating session:", err);
            throw err;
        }
    },

    /**
     * Find session by ID
     */
    async findById(id) {
        try {
            return await prisma.session.findUnique({ where: { id } });
        } catch (err) {
            log.error("Error finding session by ID:", err);
            throw err;
        }
    },

    /**
     * Find all active sessions by user ID
     */
    async findByUser(user_id) {
        try {
            return await prisma.session.findMany({
                where: { user_id, is_active: true },
                orderBy: { created_at: "desc" },
            });
        } catch (err) {
            log.error("Error finding sessions by user:", err);
            throw err;
        }
    },

    /**
     * Deactivate a specific session
     */
    async deactivate(session_id) {
        try {
            return await prisma.session.update({
                where: { id: session_id },
                data: { is_active: false, revoked_at: new Date() },
            });
        } catch (err) {
            log.error("Error deactivating session:", err);
            throw err;
        }
    },

    /**
     * Find session by refresh token hash
     */
    async findByRefreshHash(refreshHash) {
        return prisma.session.findFirst({ where: { refresh_token: refreshHash } });
    },

    /**
     * Find session by ID and user
     */
    async findByIdAndUser(id, user_id) {
        return prisma.session.findFirst({ where: { id, user_id } });
    },

    /**
     * Update session
     */
    async update(where, data) {
        return prisma.session.update({ where, data });
    },

    /**
     * Update many sessions
     */
    async updateMany(where, data) {
        return prisma.session.updateMany({ where, data });
    },

    /**
     * Deactivate one session by ID
     */
    async deactivateById(id) {
        return prisma.session.update({
            where: { id },
            data: { is_active: false, revoked_at: new Date() },
        });
    },

    /**
     * Deactivate all active sessions for a user
     */
    async deactivateAllByUser(user_id) {
        return prisma.session.updateMany({
            where: { user_id, is_active: true },
            data: { is_active: false, revoked_at: new Date() },
        });
    },

    /**
     * Count all active sessions for a user
     */
    async countActiveByUser(user_id) {
        return prisma.session.count({ where: { user_id, is_active: true } });
    },

    async listSessionsForUser(user_id) {
        return SessionRepository.findAllByUser(user_id);
    }
    ,
    /**
     * Deactivate older sessions beyond the allowed limit
     */
    async deactivateOldSessions(user_id, limit) {
        const sessions = await prisma.session.findMany({
            where: { user_id, is_active: true },
            orderBy: { created_at: "asc" },
        });

        if (sessions.length > limit) {
            const oldSessions = sessions.slice(0, sessions.length - limit);
            const ids = oldSessions.map((s) => s.id);

            await prisma.session.updateMany({
                where: { id: { in: ids } },
                data: { is_active: false, revoked_at: new Date() },
            });

            log.info(
                `Deactivated ${oldSessions.length} old sessions for user: ${user_id}`
            );
        }
    },

    /**
     * Log session-related events (login, logout, token refresh, etc.)
     */
    async logEvent(data, req = null) {
        try {
            const { session_id, event, details, provider = "local" } = data;

            return await prisma.sessionLog.create({
                data: {
                    session_id,
                    event,
                    provider,
                    ip_address: req?.ip || null,
                    user_agent: req?.headers["user-agent"] || null,
                    details,
                },
            });
        } catch (err) {
            log.error("Error creating session log:", err);
            throw err;
        }
    },
};
