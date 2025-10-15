// src/routes/user.routes.js
import { Router } from "express";
import * as controller from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { permit } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);

router.get("/me", authMiddleware, controller.me);
router.get("/", authMiddleware, permit("admin", "owner"), controller.list);
router.get("/:id", authMiddleware, permit("admin", "owner"), controller.getOne);
router.put("/:id", authMiddleware, permit("admin", "owner", "member"), controller.update);
router.delete("/:id", authMiddleware, permit("admin", "owner"), controller.remove);

export default router;
