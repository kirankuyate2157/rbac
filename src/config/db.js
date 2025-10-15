// src/config/db.js
import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis;

// Ensure a single Prisma instance in dev & prod
const prisma = globalForPrisma.__PRISMA__ || new PrismaClient();
globalForPrisma.__PRISMA__ = prisma;

export default prisma;
