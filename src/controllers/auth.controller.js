// src/controllers/auth.controller.js
import { z } from "zod";
import { authService } from "../services/auth.service.js";
import { v4 as uuidv4 } from "uuid";
import { refreshSchema, loginSchema, registerSchema } from './../validators/auth.validator.js';
import log from "../config/logger.js";
import { createSessionForResponse } from "../utils/session.util.js";

// Tenant registration
export const register = async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "error",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const data = await authService.registerTenant(parsed.data, req);

    const responseWithSession = await createSessionForResponse({
      req,
      res,
      user: data.user,
      tenant_id: data.tenant_id,
      responseBody: { status: "success", data, errors: null },
    });

    return res.status(201).json(responseWithSession);
    // return res.status(201).json({
    //   status: "success",
    //   data,
    //   errors: null
    // });

  } catch (err) {
    log.raw("Register error:", err);
    return res.status(err.status || 500).json({
      status: "error",
      errors: [{ message: err.message || "Internal error" }]
    });
  }
};

// User login
export const login = async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "error",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const data = await authService.loginUser(parsed.data, req);
    return res.status(200).json({
      status: "success",
      data,
      errors: null
    });
  } catch (err) {
    log.error("Login error:", err);
    return res.status(err.status || 500).json({
      status: "error",
      errors: [{ message: err.message || "Internal error" }]
    });
  }
};

// Refresh access token
export const refresh = async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      status: "error",
      errors: parsed.error.flatten().fieldErrors
    });
  }

  try {
    const data = await authService.refreshToken(parsed.data);
    return res.status(200).json({
      status: "success",
      data,
      errors: null
    });
  } catch (err) {
    log.error("Refresh error:", err);
    return res.status(err.status || 401).json({
      status: "error",
      errors: [{ message: err.message || "Invalid token" }]
    });
  }
};



export const logout = async (req, res) => {
  try {
    const userId = req.auth.userId;
    const sessionId = req.auth.sessionId;

    await authService.logout({ userId, sessionId });

    return res.json({ status: "success", message: "Logged out successfully" });
  } catch (err) {
    log.error("Logout error", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

export const logoutAllDevices = async (req, res) => {
  try {
    const userId = req.auth.userId;
    await authService.logoutAllDevices({ userId });

    return res.json({ status: "success", message: "Logged out from all devices" });
  } catch (err) {
    log.error("LogoutAllDevices error", err);
    return res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
