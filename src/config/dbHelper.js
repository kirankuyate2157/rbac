// src/config/dbHelper.js
import { PrismaClient } from "@prisma/client";
import db from "./db.js";

class DBHelper {
  constructor(client) {
    this.client = client;
  }

  /** -----------------------
   * ORM Operations (Prisma native)
   * ----------------------- */
  model(modelName) {
    // Access Prisma model dynamically
    return this.client[modelName];
  }

  /** -----------------------
   * Single raw query
   * ----------------------- */
  async rawQuery(query, params = []) {
    return this.client.$transaction(async (tx) => {
      try {
        const result = await tx.$queryRaw(query, ...params);
        return result;
      } catch (err) {
        console.error("rawQuery error:", err);
        throw err; // rollback automatically
      }
    });
  }

  /** -----------------------
   * Multi-statement transaction
   * ----------------------- */
  async runTransaction(queries = []) {
    return this.client.$transaction(async (tx) => {
      const results = [];
      try {
        for (const q of queries) {
          const res = await tx.$queryRaw(q.query, ...(q.params || []));
          results.push(res);
        }
        return results;
      } catch (err) {
        console.error("Transaction failed, rolling back:", err);
        throw err;
      }
    });
  }

  /** -----------------------
   * Cursor / batch queries
   * ----------------------- */
  async rawQueryWithCursor(query, params = [], batchSize = 100) {
    const results = [];
    let offset = 0;
    let batch = [];

    do {
      const batchQuery = `${query} LIMIT ${batchSize} OFFSET ${offset}`;
      batch = await this.client.$queryRaw(batchQuery, ...params);
      results.push(...batch);
      offset += batchSize;
    } while (batch.length === batchSize);

    return results;
  }

  /** -----------------------
   * Advanced transaction wrapper
   * Accepts async function with Prisma client (ORM + raw)
   * ----------------------- */
  async transaction(fn) {
    return this.client.$transaction(async (tx) => {
      try {
        const result = await fn(tx); // user defines operations
        return result;
      } catch (err) {
        console.error("Transaction wrapper error:", err);
        throw err; // rollback
      }
    });
  }
}

// Export instance
export const dbHelper = new DBHelper(db);
export default dbHelper;
