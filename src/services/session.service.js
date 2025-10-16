import { SessionRepository } from "../repositories/session.repository.js";
import { AppConfigService } from "./appConfig.service.js";
import { v4 as uuidv4 } from "uuid";
import prisma from "../config/db.js";
import { log } from "../config/logger.js";
import { AppConfigRepository } from "../repositories/appConfig.repository.js";
import { UAParser } from "ua-parser-js";
import { getDeviceMetadata } from "../utils/deviceMeta.util.js";
export const SessionService = {
    /**
     * Create a new session with policy-based limits and expiration.
     * Deactivates older sessions if max limit is reached.
     */
    async createSession({ user, tenant_id, device = {}, req }) {
        // Fetch app-wide and tenant-level session policies
        const globalLimit = await AppConfigService.get("SESSION_GLOBAL_LIMIT",) || 5;
        const tenantPolicy = await AppConfigRepository.getTenantPolicy(tenant_id);
        const maxSessions = tenantPolicy?.max_sessions || globalLimit;
        const expiryHours = tenantPolicy?.session_expiry ||
            (await AppConfigService.getInt("SESSION_EXPIRY_HOURS", 168)); // default: 7 days

        // Enforce session limits (keep only `maxSessions - 1` active)
        await SessionRepository.deactivateOldSessions(user.id, maxSessions - 1);
        const deviceMeta = getDeviceMetadata(req);

        const sessionData = {
            id: uuidv4(),
            user_id: user.id,
            tenant_id,
            device_id: device?.id || uuidv4(),
            device_type: deviceMeta.device_type || "web",
            device_name: deviceMeta.device_model || "Unknown Device",
            ip_address: req.ip || null,
            user_agent: req.headers["user-agent"] || null,
            is_active: true,
            created_at: new Date(),
            last_active_at: new Date(),
            expires_at: new Date(Date.now() + expiryHours * 60 * 60 * 1000),
            meta: deviceMeta,
        };

        // Insert into DB
        const session = await SessionRepository.create(sessionData);

        // Log event for audit/debug
        await SessionRepository.logEvent({
            session_id: session.id,
            event: "session.created",
            details: { user: user.email },
        }, req);

        log.info(`🟢 Session created for ${user.email} (${session.device_type})`);
        return session;
    },

    /**
     * Gracefully deactivate a single session.
     */
    async deactivateSession(session_id) {
        const session = await SessionRepository.deactivate(session_id);
        if (!session) throw { status: 404, message: "Session not found" };

        await SessionRepository.logEvent({
            session_id,
            event: "session.revoked",
            details: { reason: "manual logout" },
        });

        log.info(`🔴 Session ${session_id} revoked.`);
        return session;
    },

    /**
     * Refresh (extend) session expiry.
     */
    async refreshSession(session_id) {
        const session = await SessionRepository.findById(session_id);
        if (!session || !session.is_active) {
            throw { status: 401, message: "Invalid or inactive session" };
        }

        const expiryHours = await AppConfigService.getInt("SESSION_EXPIRY_HOURS", 168);
        const newExpiry = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

        const updated = await SessionRepository.update(
            { id: session_id },
            { last_active_at: new Date(), expires_at: newExpiry }
        );

        await SessionRepository.logEvent({
            session_id,
            event: "session.refreshed",
            details: { new_expiry: newExpiry },
        });

        return updated;
    },

    /**
     * Deactivate all sessions for a given user.
     */
    async deactivateAllForUser(user_id) {
        await SessionRepository.deactivateAllByUser(user_id);
        await SessionRepository.logEvent({
            session_id: null,
            event: "session.bulk_revoked",
            details: { user_id },
        });
        log.info(`🔴 All sessions deactivated for user ${user_id}`);
    },
    async updateRefreshToken(session_id, refreshToken) {
        return SessionRepository.update(
            { id: session_id },
            { refresh_token: refreshToken }
        );
    }
};
