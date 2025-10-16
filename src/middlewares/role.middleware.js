/**
 * 🔒 Permission-based access middleware
 * ----------------------------------------------------------------------------
 * Checks if the authenticated user has the required permission key for a route.
 * Supports:
 *   - Tenant-specific roles
 *   - Inherited permissions from parent roles
 *   - Superadmin global override
 *   - Optional session validation
 *
 * @param {string} permissionKey - The permission key required to access the route.
 *                                  Examples:
 *                                    "🔵admin:user:read"      → Tenant admin read users
 *                                    "🟢user:profile:read:self" → Normal user can read own profile
 *                                    "🔴superadmin:tenant:manage" → Global superadmin access
 *
 * @param {Object} [options] - Optional behavior configuration
 * @param {boolean} [options.allowSuperAdmin=true] - If true, users with role "superadmin" bypass tenant checks
 *
 * @returns {Function} Express middleware
 *
 * @example
 * // Tenant admin route
 * router.get("/tenant/:tenantId/users", permit("🔵admin:user:read"), getUsers);
 *
 * @example
 * // Normal user route
 * router.get("/profile", permit("🟢user:profile:read:self"), getProfile);
 *
 * @example
 * // Superadmin route
 * router.delete("/tenant/:tenantId", permit("🔴superadmin:tenant:manage"), deleteTenant);
 *
 * @throws {Error} If permissionKey is missing
 *
 * Behavior:
 *   1. Validates authentication (req.user or req.auth)
 *   2. Resolves tenantId (from params or auth)
 *   3. Superadmin bypass if allowed
 *   4. Loads userOrgMap for tenant
 *   5. Aggregates permissions from role + parent_role
 *   6. Checks if required permissionKey exists
 *   7. Optionally validates session (if req.session exists)
 *   8. Calls next() if all checks pass, otherwise sends 401/403 response
 */
export function permit(permissionKey, options = {}) {
  const { allowSuperAdmin = true } = options;

  if (!permissionKey) throw new Error("Permission key required");

  return async (req, res, next) => {
    try {
      const authUser = req.user || (req.auth && { id: req.auth.userId, tenantId: req.auth.tenantId, role: req.auth.role });
      if (!authUser) return res.status(401).json({ status: "error", errors: [{ code: "unauthorized", message: "Missing authentication" }] });

      const tenantId = req.params.tenantId || authUser.tenantId;
      if (!tenantId && !allowSuperAdmin) return res.status(400).json({ status: "error", errors: [{ code: "missing_tenant", message: "Tenant ID required" }] });

      // -------------------- Superadmin bypass --------------------
      if (allowSuperAdmin && authUser.role === "superadmin") return next();

      // -------------------- Tenant-specific check ----------------
      const userMap = await prisma.userOrgMap.findFirst({
        where: { user_id: authUser.id, tenant_id: tenantId },
        include: {
          role: { include: { permissions: true, parent_role: { include: { permissions: true } } } }
        }
      });

      if (!userMap) return res.status(403).json({ status: "error", errors: [{ code: "no_tenant_mapping", message: "User not in this tenant" }] });

      // -------------------- Aggregate permissions ----------------
      let permissions = (userMap.role.permissions || []).map(p => p.permission_key);
      if (userMap.role.parent_role) {
        permissions = [...permissions, ...(userMap.role.parent_role.permissions || []).map(p => p.permission_key)];
      }

      // -------------------- Check permission ---------------------
      if (!permissions.includes(permissionKey)) {
        return res.status(403).json({
          status: "error",
          errors: [{ code: "permission_denied", message: `Missing permission: ${permissionKey}`, role: userMap.role.name }]
        });
      }

      // -------------------- Optional: session check ----------------
      if (req.session) {
        if (!req.session.is_active || new Date(req.session.expires_at) < new Date()) {
          return res.status(401).json({ status: "error", errors: [{ code: "session_invalid", message: "Session inactive or expired" }] });
        }
      }

      next();
    } catch (err) {
      console.error("[permit] error:", err);
      res.status(500).json({ status: "error", errors: [{ code: "server_error", message: err.message }] });
    }
  };
}
