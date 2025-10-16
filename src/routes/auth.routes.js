
// src\routes\auth.routes.ts
import express from "express";
import { register, login, refresh, logout, logoutAllDevices } from "../controllers/auth.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js"; // Middleware to verify JWT
import { sessionMiddleware } from "../middlewares/session.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", register, sessionMiddleware());
router.post("/login", login);
router.get("/refresh", refresh);

// Protected routes
router.post("/logout", authenticate, logout);
router.post("/logout-all", authenticate, logoutAllDevices);

export default router;
