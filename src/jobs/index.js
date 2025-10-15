// src/jobs/index.js
import cron from "node-cron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { jobLogger } from "./utils/jobLogger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const jobsDir = path.join(__dirname, "cleanup");

// dynamically load all jobs from cleanup/
fs.readdirSync(jobsDir).forEach((file) => {
  if (file.endsWith(".js")) {
    import(path.join(jobsDir, file))
      .then((jobModule) => {
        const job = jobModule.default;
        if (!job?.schedule || !job?.run) {
          jobLogger.warn(`Invalid job file: ${file}`);
          return;
        }
        cron.schedule(job.schedule, async () => {
          jobLogger.info(`[JOB START] ${job.name}`);
          try {
            await job.run();
            jobLogger.info(`[JOB SUCCESS] ${job.name}`);
          } catch (err) {
            jobLogger.error(`[JOB ERROR] ${job.name}`, err);
          }
        });
        jobLogger.info(`[JOB REGISTERED] ${job.name} (${job.schedule})`);
      })
      .catch((err) => jobLogger.error(`Failed to load job: ${file}`, err));
  }
});
