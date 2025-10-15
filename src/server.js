// src/server.js
import app from "./app.js";
import { PORT } from "./config/env.js";
import db from "./config/db.js";
import { log } from "./config/logger.js";

async function main() {
  const port = PORT;
  app.listen(port, () => log.info(`Server running on ${port}`));
  // optional: test DB connection
  try {
    await db.$connect();
    log.info("DB connected");
  } catch (err) {
    log.error("DB connection failed", err);
    process.exit(1);
  }
}

main();
