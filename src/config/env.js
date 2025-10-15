// src/config/env.js
import dotenv from "dotenv";
dotenv.config();

const get = (k, fallback) => {
  const v = process.env[k] ?? fallback;
  if (v === undefined) throw new Error(`Missing env var ${k}`);
  return v;
};

export const PORT = Number(process.env.PORT ?? get("BACKEND_PORT", "5000"));
export const DATABASE_URL = get("DATABASE_URL");
export const JWT_SECRET = get("JWT_SECRET");
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
export const BCRYPT_SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
