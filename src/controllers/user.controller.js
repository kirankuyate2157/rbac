// src/controllers/user.controller.js
import * as userService from "../services/user.service.js";
import { registerSchema, loginSchema, updateUserSchema } from "../validators/user.validator.js";

export const register = async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body); // validate input
    const user = await userService.registerUser(body);
    res.status(201).json(user);
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const result = await userService.authenticate({ email, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const me = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthenticated" });
    const user = await userService.getUserById(req.user.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const list = async (req, res, next) => {
  try {
    const tenantId = req.query.tenantId || req.user.tenantId; // only allowed tenant
    const skip = Number(req.query.skip ?? 0);
    const take = Math.min(Number(req.query.take ?? 50), 100); // max 100
    const users = await userService.getUsers(tenantId, skip, take);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

export const getOne = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    next(err);
  }
};

export const update = async (req, res, next) => {
  try {
    const body = updateUserSchema.parse(req.body); // validate input
    const updated = await userService.updateUserProfile(req.params.id, body);
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

export const remove = async (req, res, next) => {
  try {
    await userService.removeUser(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
