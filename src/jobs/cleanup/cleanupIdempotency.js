// jobs/cleanupIdempotency.js
import cron from "node-cron";
import { prisma } from "../prisma.js";

// Run every night at 2 AM
cron.schedule("0 2 * * *", async () => {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h
  try {
    const deleted = await prisma.idempotency.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
    console.log(`[Cleanup] Deleted ${deleted.count} old idempotency records`);
  } catch (err) {
    console.error("[Cleanup] Error cleaning idempotency table:", err);
  }
});
