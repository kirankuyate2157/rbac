// src/validators/user.validator.js
import { z } from "zod";

// Roles allowed
const roles = ["owner", "admin", "member"];

export const registerSchema = z.object({
    full_name: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string()
        .min(6, "password_hash must be at least 6 characters")
        .max(50, "password_hash too long")
        .regex(/[A-Z]/, "password_hash must contain at least one uppercase letter")
        .regex(/[a-z]/, "password_hash must contain at least one lowercase letter")
        .regex(/[0-9]/, "password_hash must contain at least one number")
        .regex(/[\W_]/, "password_hash must contain at least one special character"),
    role: z.enum(roles).optional(),
    tenantId: z.string().uuid().optional(),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "password_hash required"),
});

export const updateUserSchema = z.object({
    full_name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    password_hash: z.string()
        .min(6)
        .max(50)
        .regex(/[A-Z]/, "password_hash must contain at least one uppercase letter")
        .regex(/[a-z]/, "password_hash must contain at least one lowercase letter")
        .regex(/[0-9]/, "password_hash must contain at least one number")
        .regex(/[\W_]/, "password_hash must contain at least one special character")
        .optional(),
    role: z.enum(roles).optional(),
    status: z.enum(["active", "inactive"]).optional(),
});
