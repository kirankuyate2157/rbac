// src/repositories/user.repository.js
import { dbHelper } from "../config/dbHelper.js";

// export const createUser = async (data) => dbHelper.model("user").create({ data });

export const createUser = async (data) => {
  // Map API payload to Prisma
  const prismaData = {
    full_name: data.fullName,        // API fullName -> Prisma full_name
    email: data.email,
    password_hash: data.password,    // hashed password
    role: data.role,
    tenant: { connect: { id: data.tenantId } }, // link tenant
    status: "active",
    created_at: new Date(),
    updated_at: new Date(),
  };

  return dbHelper.model("user").create({ data: prismaData });
};

export const findUserByEmail = async (email) =>
  dbHelper.model("user").findUnique({ where: { email } });

export const findUserById = async (id) =>
  dbHelper.model("user").findUnique({ where: { id } });

export const updateUser = async (id, data) =>
  dbHelper.model("user").update({ where: { id }, data });

export const deleteUser = async (id) =>
  dbHelper.model("user").delete({ where: { id } });

export const countUsers = async () => {
  return dbHelper.model("user").count();
};

export const listUsers = async (tenantId, skip = 0, take = 50) => {
  const where = tenantId ? { tenantId } : {};
  return dbHelper.model("user").findMany({
    where,
    skip,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      full_name: true,
      role: true,
      status: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
    },
  });
};
