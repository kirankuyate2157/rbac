// src/config/logger.js
import winston from "winston";
import path from "path";
import fs from "fs";
import "winston-daily-rotate-file";
import dotenv from "dotenv";

dotenv.config();

const NODE_ENV = process.env.NODE_ENV || "development";
const LOG_LEVEL = process.env.LOG_LEVEL || "debug";
const LOG_DIR = process.env.LOG_DIR || path.join(__dirname, "../../logs");
const LOG_RETENTION_DAYS = process.env.LOG_RETENTION_DAYS || "14d";
const LOG_MAX_SIZE = process.env.LOG_MAX_SIZE || "20m";

// --- Ensure log directory exists for production ---
if (NODE_ENV === "production" && !fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// --- Log format ---
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf((info) => {
    const message =
      typeof info.message === "object"
        ? JSON.stringify(info.message, null, 2)
        : info.message;
    return `[${info.timestamp}] [${info.level.toUpperCase()}]: ${message}${info.stack ? "\n" + info.stack : ""
      }`;
  })
);

// --- Daily Rotate Transport for production ---
const dailyRotateTransport = (filename, level) =>
  new winston.transports.DailyRotateFile({
    filename: path.join(LOG_DIR, filename),
    datePattern: "YYYY-MM-DD",
    zippedArchive: true,
    maxSize: LOG_MAX_SIZE,
    maxFiles: LOG_RETENTION_DAYS,
    level,
  });

// --- Create Winston logger ---
const transports = [];

if (NODE_ENV === "development") {
  // Dev: console only
  transports.push(new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), logFormat) }));
} else {
  // Production: console + file rotation
  transports.push(
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), logFormat) }),
    dailyRotateTransport("error-%DATE%.log", "error"),
    dailyRotateTransport("combined-%DATE%.log", "debug")
  );
}

const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  transports,
  exceptionHandlers:
    NODE_ENV === "production"
      ? [
        dailyRotateTransport("exceptions-%DATE%.log", "error"),
        new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), logFormat) }),
      ]
      : undefined,
  rejectionHandlers:
    NODE_ENV === "production"
      ? [
        dailyRotateTransport("rejections-%DATE%.log", "error"),
        new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), logFormat) }),
      ]
      : undefined,
  exitOnError: false,
});

// --- Helper methods ---
export const log = {
  debug: (...args) =>
    logger.debug(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ")),
  info: (...args) =>
    logger.info(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ")),
  warn: (...args) =>
    logger.warn(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ")),
  error: (...args) =>
    logger.error(args.map((arg) => (typeof arg === "object" ? JSON.stringify(arg, null, 2) : arg)).join(" ")),
  raw: (...args) => logger.error(...args), 
};

export default log;
