// src/routes/session.routes.js
import { Router } from "express";
import {
    createSession,
    refreshSession,
    revokeSession,
    revokeAllSessionsForUser,
    listUserSessions
} from "../controllers/session.controller.js";

import { authorize } from "../middlewares/auth.middleware.js";
import { permit } from "../middlewares/role.middleware.js";

export const sessionRouter = Router();

sessionRouter.post("/create", createSession);
sessionRouter.post("/refresh", authorize(), refreshSession);
sessionRouter.post(
    "/revoke",
    authorize(),
    permit("user:session:revoke"),
    revokeSession
);

// ------------------------------
// Revoke all sessions for a specific user (Admin-only)
// ------------------------------
sessionRouter.post(
    "/revoke-all",
    authorize(),
    permit("admin:session:revoke_all"),
    revokeAllSessionsForUser
);

// ------------------------------
// List sessions for a user
// Users: only own sessions
// Admin: can view any user's sessions
// ------------------------------
sessionRouter.get(
    "/user/:user_id",
    authorize(),
    permit("user:session:read"),
    listUserSessions
);
