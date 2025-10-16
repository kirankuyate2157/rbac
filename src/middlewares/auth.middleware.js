// ============================================================================
// 🔐 AUTH MIDDLEWARE
// ----------------------------------------------------------------------------
// Responsible for validating JWTs, attaching user & tenant info to request,
// verifying token version (revocation check), and handling all auth cases.
// ============================================================================

import { verifyAccessToken } from "../utils/auth.js";
import prisma from "../config/db.js";

/**
 * Middleware to authenticate requests using JWT (Bearer token).
 * Supports automatic user and tenant resolution.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // --------------------------- Missing Token ------------------------------
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        status: "error",
        errors: [
          {
            code: "unauthorized",
            message: "Missing or invalid Authorization header",
          },
        ],
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    if (!decoded?.userId || !decoded?.tenantId) {
      return res.status(401).json({
        status: "error",
        errors: [
          { code: "invalid_payload", message: "Malformed token payload" },
        ],
      });
    }

    // --------------------------- Fetch User --------------------------------
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        status: true,
        tokenVersion: true,
        tenantId: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        status: "error",
        errors: [{ code: "invalid_user", message: "User not found" }],
      });
    }

    // --------------------------- Check Active Status ------------------------
    if (user.status !== "active") {
      return res.status(403).json({
        status: "error",
        errors: [{ code: "inactive_user", message: "User is not active" }],
      });
    }

    // --------------------------- Check Token Version ------------------------
    if (
      decoded.tokenVersion !== undefined &&
      decoded.tokenVersion !== user.tokenVersion
    ) {
      return res.status(401).json({
        status: "error",
        errors: [
          { code: "token_revoked", message: "Token revoked or outdated" },
        ],
      });
    }

    // --------------------------- Attach Context -----------------------------
    req.user = {
      id: user.id,
      tenantId: user.tenantId || decoded.tenantId,
      role: user.role || decoded.role,
    };

    req.auth = decoded; // raw decoded payload if needed

    next();
  } catch (err) {
    console.error("[authMiddleware] Token verification failed:", err.message);

    return res.status(401).json({
      status: "error",
      errors: [
        {
          code: "invalid_token",
          message:
            err.name === "TokenExpiredError"
              ? "Access token expired"
              : "Invalid or malformed token",
          detail:
            process.env.NODE_ENV === "development" ? err.message : undefined,
        },
      ],
    });
  }
}
