// src/middlewares/tenant.middleware.js

/**
 * Simple tenant guard. Use when routes include tenantId path param.
 * Ensures user belongs to the same tenant.
 */
export const tenantGuard = (paramKey = "tenantId") => {
  return (req, res, next) => {
    const tenantId = req.params[paramKey] || req.query.tenantId;
    if (!tenantId) return res.status(400).json({ message: "Missing tenant id" });

    if (req.user?.tenantId !== tenantId && req.user?.role !== "owner") {
      return res.status(403).json({ message: "Forbidden - tenant mismatch" });
    }

    next();
  };
};
