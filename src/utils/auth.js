// src/utils/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import prisma from "../config/db.js";


dotenv.config();

/**
 * =============================================================================
 * 🔐 AUTHENTICATION UTILITIES
 * =============================================================================
 * Handles password hashing, token signing, and verification.
 * Supports Access & Refresh tokens for multi-tenant apps.
 * =============================================================================
 */

// --------------------------- ENVIRONMENT VARIABLES ----------------------------
const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRES = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_TOKEN_EXPIRES = process.env.REFRESH_TOKEN_EXPIRES || "30d";

if (!JWT_SECRET || !REFRESH_SECRET) {
    console.warn(
        "[auth.utils.js] Missing JWT_SECRET or REFRESH_SECRET in .env — tokens will fail."
    );
}

// --------------------------- PASSWORD UTILITIES -------------------------------

/**
 * Hashes a plain text password using bcrypt.
 * @param {string} plain - The plain text password.
 * @returns {string} The hashed password.
 */
export function hashPassword(plain) {
    if (!plain) throw new Error("Password cannot be empty.");
    return bcrypt.hashSync(plain, 10);
}

/**
 * Compares a plain password with a hashed password.
 * @param {string} plain - The plain text password.
 * @param {string} hash - The hashed password.
 * @returns {boolean} True if the password matches, false otherwise.
 */
export function verifyPassword(plain, hash) {
    if (!plain || !hash) return false;
    return bcrypt.compareSync(plain, hash);
}

// --------------------------- TOKEN GENERATORS --------------------------------

/**
 * Signs an access token (short-lived).
 * @param {Object} payload - The payload to include in the token.
 * @param {string} payload.userId - The user ID.
 * @param {string} payload.tenantId - The tenant ID (for multi-tenant systems).
 * @param {number} [payload.tokenVersion] - Optional version for token invalidation.
 * @returns {string} The signed JWT access token.
 */
export function signAccessToken(payload) {
    if (!payload?.userId || !payload?.tenantId)
        throw new Error("Missing required fields in access token payload.");

    return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

/**
 * Signs a refresh token (long-lived).
 * @param {Object} payload - The payload to include in the token.
 * @param {string} payload.userId - The user ID.
 * @param {string} payload.tenantId - The tenant ID.
 * @param {number} [payload.tokenVersion] - Optional version for token invalidation.
 * @returns {string} The signed JWT refresh token.
 */
export function signRefreshToken(payload) {
    if (!payload?.userId || !payload?.tenantId)
        throw new Error("Missing required fields in refresh token payload.");

    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

// --------------------------- TOKEN VERIFICATION -------------------------------

/**
 * Verifies an access token.
 * @param {string} token - The access token string.
 * @returns {Object} Decoded token payload.
 * @throws {Error} If verification fails.
 */
export function verifyAccessToken(token) {
    if (!token) throw new Error("Access token is required.");
    return jwt.verify(token, JWT_SECRET);
}

/**
 * Verifies a refresh token.
 * @param {string} token - The refresh token string.
 * @returns {Object} Decoded token payload.
 * @throws {Error} If verification fails.
 */
export function verifyRefreshToken(token) {
    if (!token) throw new Error("Refresh token is required.");
    return jwt.verify(token, REFRESH_SECRET);
}

// --------------------------- TOKEN INVALIDATION -------------------------------

/**
 * Increments a user's token version in DB (used for invalidating refresh tokens).
 * @param {string} userId - ID of the user.
 * @returns {Promise<Object>} The updated user record.
 */
export async function invalidateUserTokens(userId) {
    if (!userId) throw new Error("User ID is required for token invalidation.");

    const updated = await prisma.user.update({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
    });

    return updated;
}

// --------------------------- TOKEN UTILITIES ----------------------------------

/**
 * Generates a new pair of access and refresh tokens for a given user.
 * @param {Object} user - The user record.
 * @param {string} user.id - The user's ID.
 * @param {string} user.tenantId - The tenant ID.
 * @param {number} [user.tokenVersion] - Optional token version.
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function generateAuthTokens(user) {
    const accessToken = signAccessToken({
        userId: user.id,
        tenantId: user.tenantId,
        tokenVersion: user.tokenVersion || 0,
    });

    const refreshToken = signRefreshToken({
        userId: user.id,
        tenantId: user.tenantId,
        tokenVersion: user.tokenVersion || 0,
    });

    return { accessToken, refreshToken };
}

/**
 * Decodes (but does not verify) a JWT for debugging/logging.
 * @param {string} token - JWT token string.
 * @returns {Object|null} Decoded payload or null.
 */
export function decodeToken(token) {
    try {
        return jwt.decode(token);
    } catch {
        return null;
    }
}
