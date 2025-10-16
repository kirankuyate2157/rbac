// src/routes/user.routes.js
import { Router } from "express";
import * as controller from "../controllers/user.controller.js";
import { authenticate  } from "../middlewares/auth.middleware.js";
import { permit } from "../middlewares/role.middleware.js";

const router = Router();

router.post("/register", controller.register);
router.post("/login", controller.login);

router.get("/me", authenticate , controller.me);
router.get("/", authenticate , permit("admin", "owner"), controller.list);
router.get("/:id", authenticate , permit("admin", "owner"), controller.getOne);
router.put("/:id", authenticate , permit("admin", "owner", "member"), controller.update);
router.delete("/:id", authenticate , permit("admin", "owner"), controller.remove);

export default router;
