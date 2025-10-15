// src/middlewares/error.middleware.js
import { log } from "../config/logger.js";

export const errorHandler = (err, req, res, next) => {
  log.raw(err?.message ?? err);
  const status = err?.statusCode ?? err?.status ?? 500;


  res.status(status).json({
    error: err.message || "Internal Server Error",
  });

};
