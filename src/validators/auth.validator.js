// validators/auth.validator.js
import { z } from "zod";

export const registerSchema = z.object({
  company_name: z.string().min(2),
  domain: z.string().optional(),
  plan_type: z.string().optional(),
  admin: z.object({
    full_name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
  }),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refresh_token: z.string(),
});

// validators/tenantSchemas.ts
export const tenantPatchSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  status: z.enum(["active", "suspended", "deleted"]).optional(),
});

// validators/policySchemas.ts
export const tenantPolicyPatchSchema = z.object({
  allow_custom_smtp: z.boolean().optional(),
  max_mailboxes: z.number().int().min(0).optional(),
  storage_limit_mb: z.number().int().min(0).optional(),
  allow_external_providers: z.boolean().optional(),
  allow_auto_sync: z.boolean().optional(),
});

// validators/userSchemas.ts
export const createUserSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  role: z.string().optional(),
  send_invite: z.boolean().optional().default(true),
});

export const updateUserSchema = z.object({
  full_name: z.string().optional(),
  role: z.string().optional(),
  status: z.enum(["active", "invited", "suspended", "deleted"]).optional(),
  password: z.string().min(8).optional(),
});

// validators/roleSchemas.ts
export const createRoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});
