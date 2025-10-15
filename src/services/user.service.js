// src/services/user.service.js
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import * as userRepo from "../repositories/user.repository.js";
import * as tenantRepo from "../repositories/tenant.repository.js";
import { BCRYPT_SALT_ROUNDS } from "../config/env.js";

export async function registerUser(payload) {
  const existingUser = await userRepo.findUserByEmail(payload.email);
  if (existingUser) throw new Error("User already exists");

  let tenantId = payload.tenantId;

  // Case 1: No tenantId provided -> new tenant creation
  if (!tenantId) {
    const newTenant = await tenantRepo.createTenant({
      id: uuidv4(),
      name: `${payload.full_name}'s Tenant`,
    });
    tenantId = newTenant.id;
    payload.role = "owner"; // first user of tenant is owner
  } else {
    // Case 2: tenantId provided -> must be valid tenant
    const tenantExists = await tenantRepo.findTenantById(tenantId);
    if (!tenantExists) throw new Error("Invalid tenant ID");
    // If role is not provided, default to 'member'
    payload.role = payload.role ?? "member";
  }

  // Hash password_hash
  const hash = await bcrypt.hash(payload.password, BCRYPT_SALT_ROUNDS);

  // Create user
  const user = await userRepo.createUser({ ...payload, password_hash: hash, tenantId });
  delete user.password;
  return user;
}

export async function authenticate({ email, password }) {

  console.log(
  " details :",email,password
  )
  const user = await userRepo.findUserByEmail(email);
  if (!user || !user.password_hash) throw new Error("Invalid credentials");

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) throw new Error("Invalid credentials");

  const token = jwt.sign(
    { userId: user.id, tenantId: user.tenantId, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      tenantId: user.tenantId,
    },
  };
}

export const getUserById = (id) => userRepo.findUserById(id);

export const getUsers = (tenantId, skip = 0, take = 50) =>
  userRepo.listUsers(tenantId, skip, take);

export const updateUserProfile = async (id, payload) => {
  if (payload.password_hash) {
    payload.password_hash = await bcrypt.hash(payload.password_hash, BCRYPT_SALT_ROUNDS);
  }
  const updated = await userRepo.updateUser(id, payload);
  delete updated.password_hash;
  return updated;
};

export const removeUser = (id) => userRepo.deleteUser(id);
