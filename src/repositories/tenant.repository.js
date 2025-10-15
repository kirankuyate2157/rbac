// src/repositories/tenant.repository.js
import { dbHelper } from "../config/dbHelper.js";

export const createTenant = async (data) => {
  return dbHelper.model("tenant").create({ data });
};

export const findTenantById = async (id) =>
  dbHelper.model("tenant").findUnique({ where: { id } });

export const listTenants = async () =>
  dbHelper.model("tenant").findMany();
