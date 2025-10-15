// src/middlewares/role.middleware.js

// ============================================================================
// 🔒 requirePermission(permissionKey)
// ----------------------------------------------------------------------------
// Ensures the current user has the required permission for the current tenant.
//
// Works with:
//   - JWT-authenticated users (req.user / req.auth)
//   - Prisma-based role & permission mappings
//   - Multi-tenant structure (userOrgMap -> role -> permissions)
//
// Usage:
//   router.post('/api/tenant/:tenantId/resource', authMiddleware, requirePermission('RESOURCE_CREATE'), controllerFn)
// ============================================================================

import prisma from "../config/db.js";

/**
 * Express middleware factory to enforce permission-based access.
 * @param {string} permissionKey - The required permission key for the route.
 * @returns {Function} Express middleware function.
 */
export function permit(permissionKey) {
  if (!permissionKey || typeof permissionKey !== "string") {
    throw new Error("Permission key must be a non-empty string.");
  }

  return async function (req, res, next) {
    try {
      // --------------------------- Auth Validation ---------------------------
      const authUser = req.user || (req.auth && { id: req.auth.userId, tenantId: req.auth.tenantId });
      if (!authUser) {
        return res.status(401).json({
          status: "error",
          errors: [{ code: "unauthorized", message: "Missing or invalid authentication" }],
        });
      }

      const tenantId = req.params.tenantId || authUser.tenantId;
      if (!tenantId) {
        return res.status(400).json({
          status: "error",
          errors: [{ code: "missing_tenant", message: "Tenant ID not provided" }],
        });
      }

      // --------------------------- Quick Shortcuts ---------------------------
      // Owner/admin bypass (global roles)
      if (["owner", "admin"].includes(authUser.role)) return next();

      // --------------------------- Tenant Mapping ----------------------------
      const userTenantMap = await prisma.userOrgMap.findFirst({
        where: { user_id: authUser.id, tenant_id: tenantId },
        include: {
          role: {
            include: { permissions: true },
          },
        },
      });

      if (!userTenantMap) {
        return res.status(403).json({
          status: "error",
          errors: [{ code: "no_tenant_mapping", message: "User not associated with this tenant" }],
        });
      }

      const role = userTenantMap.role;
      if (!role) {
        return res.status(403).json({
          status: "error",
          errors: [{ code: "role_not_found", message: "Role not found for user" }],
        });
      }

      // --------------------------- Permission Validation ---------------------
      const userPermissions = (role.permissions || []).map((p) => p.key || p.permission_key);
      const hasPermission = userPermissions.includes(permissionKey);

      if (!hasPermission) {
        return res.status(403).json({
          status: "error",
          errors: [
            {
              code: "permission_denied",
              message: `You lack permission: ${permissionKey}`,
              role: role.name,
            },
          ],
        });
      }

      // --------------------------- Pass Control ------------------------------
      next();
    } catch (err) {
      console.error("[requirePermission] Error verifying permission:", err);
      return res.status(500).json({
        status: "error",
        errors: [{ code: "server_error", message: "Internal server error", detail: err.message }],
      });
    }
  };
}
