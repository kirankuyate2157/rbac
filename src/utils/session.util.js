// src/utils/session.util.js
import { SessionService } from "../services/session.service.js";
import { signAccessToken, signRefreshToken } from "./auth.js";

export const createSessionForResponse = async ({ req, res, user, tenant_id, responseBody }) => {
  if (!user || !tenant_id) return responseBody;

  const device = {
    id: req.headers["x-device-id"],
    type: req.headers["x-device-type"] || "web",
    name: req.headers["x-device-name"] || req.userAgent || "Unknown Device",
    os: req.headers["x-device-os"] || null,
    browser: req.headers["user-agent"] || null,
    location: req.headers["x-device-location"] ? JSON.parse(req.headers["x-device-location"]) : null,
  };

  const session = await SessionService.createSession({ user, tenant_id, device, req });

  const accessToken = signAccessToken({
    user_id: user.id,
    tenant_id,
    session_id: session.id,
    token_version: session.token_version,
  });

  const refreshToken = signRefreshToken({
    user_id: user.id,
    tenant_id,
    session_id: session.id,
    token_version: session.token_version,
  });

  await SessionService.updateRefreshToken(session.id, refreshToken);

  // Set cookies
  res.cookie("access_token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });

  res.cookie("refresh_token", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000,
    sameSite: "lax",
  });

  // Attach session info to response body
  return {
    ...responseBody,
    session_id: session.id,
    access_token: accessToken,
    refresh_token: refreshToken,
  };
};
