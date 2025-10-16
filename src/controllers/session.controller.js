import { SessionService } from "../services/session.service.js";
import { log } from "../config/logger.js";

/**
 * Create a new session (usually called after login/register)
 * Optionally returns JWTs or session object
 */
export const createSession = async (req, res) => {
    try {
        const { user, tenant_id } = req.body; // from login/register
        const device = req.body.device || {};

        const session = await SessionService.createSession({ user, tenant_id, device, req });

        return res.status(201).json({
            status: "success",
            data: session,
            message: "Session created successfully",
        });
    } catch (err) {
        log.error("Session creation failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};

/**
 * Refresh a session (extend expiry)
 */
export const refreshSession = async (req, res) => {
    try {
        const { session_id } = req.body;
        const session = await SessionService.refreshSession(session_id);

        return res.status(200).json({
            status: "success",
            data: session,
            message: "Session refreshed successfully",
        });
    } catch (err) {
        log.error("Session refresh failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};

/**
 * Revoke a single session (logout)
 */
export const revokeSession = async (req, res) => {
    try {
        const { session_id } = req.body;
        const session = await SessionService.deactivateSession(session_id);

        return res.status(200).json({
            status: "success",
            data: session,
            message: "Session revoked successfully",
        });
    } catch (err) {
        log.error("Session revoke failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};

/**
 * Revoke all sessions for a user (admin action or password reset)
 */
export const revokeAllSessionsForUser = async (req, res) => {
    try {
        const { user_id } = req.body;
        await SessionService.deactivateAllForUser(user_id);

        return res.status(200).json({
            status: "success",
            message: `All sessions revoked for user ${user_id}`,
        });
    } catch (err) {
        log.error("Bulk session revoke failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};

/**
 * List all active sessions for a user (optional admin or self view)
 */
export const listUserSessions = async (req, res) => {
    try {
        const { user_id } = req.params;
        const sessions = await SessionService.listSessionsForUser(user_id);

        return res.status(200).json({
            status: "success",
            data: sessions,
        });
    } catch (err) {
        log.error("Listing sessions failed:", err);
        return res.status(err.status || 500).json({
            status: "error",
            message: err.message || "Internal server error",
        });
    }
};
