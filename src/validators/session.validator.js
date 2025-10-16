import { z } from "zod";

// Device info for session creation
export const deviceSchema = z.object({
  id: z.string().uuid().optional(),
  type: z.string().optional(),
  name: z.string().optional(),
  os: z.string().nullable().optional(),
  browser: z.string().nullable().optional(),
  location: z.object({
    lat: z.number(),
    lng: z.number(),
  }).nullable().optional(),
  app_version: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  vendor: z.string().nullable().optional(),
  screen_resolution: z.string().nullable().optional(),
});

// Create session (optional, usually after login/register)
export const createSessionSchema = z.object({
  user: z.object({
    id: z.string().uuid(),
    email: z.string().email(),
  }),
  tenant_id: z.string().uuid(),
  device: deviceSchema.optional(),
});

// Refresh session
export const refreshSessionSchema = z.object({
  session_id: z.string().uuid(),
});

// Revoke single session
export const revokeSessionSchema = z.object({
  session_id: z.string().uuid(),
});

// Revoke all sessions for a user (admin)
export const revokeAllSessionsSchema = z.object({
  user_id: z.string().uuid(),
});
