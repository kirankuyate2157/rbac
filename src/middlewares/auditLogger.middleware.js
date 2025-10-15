import prisma from "../config/db.js";

/**
 * 🔍 Unified Audit Logger Middleware
 *
 * Logs important API actions with user, tenant, route, and metadata.
 *
 * Usage example:
 * app.post("/users", auditLogger({
 *   module: "user_mgmt",
 *   action: "CREATE",
 *   target_type: "User"
 * }), createUserHandler);
 *
 * Or call writeAudit() manually for non-route events.
 *
 * @param {object} options
 * @param {string} options.module - Functional area e.g. "chat", "knowledge_base", "user_mgmt"
 * @param {string} options.action - CRUD or event action e.g. "CREATE", "UPDATE", "DELETE", "LOGIN"
 * @param {string} [options.target_type] - Affected entity e.g. "User", "Message"
 * @returns Express middleware
 */
export const auditLogger = (options) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    const { module, action, target_type } = options;

    // Intercept response
    const originalSend = res.send.bind(res);
    res.send = async (body) => {
      try {
        const actorUserId = req.auth?.userId ?? null;
        const tenantId = req.tenantId ?? req.auth?.tenantId ?? null;
        const actorRole = req.auth?.role ?? "system";

        // Optional: parse body safely for logs
        let responseData = null;
        try {
          responseData = typeof body === "string" ? JSON.parse(body) : body;
        } catch {
          responseData = body;
        }

        const entry = {
          tenant_id: tenantId,
          user_id: actorUserId,
          actor_role: actorRole,
          module,
          action,
          target_type,
          status: res.statusCode >= 400 ? "FAILED" : "SUCCESS",
          ip_address:
            req.ip ||
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress,
          user_agent: req.headers["user-agent"] || null,
          description: `${action} on ${module}${
            target_type ? ` (${target_type})` : ""
          }`,
          metadata: {
            route: req.originalUrl,
            method: req.method,
            durationMs: Date.now() - startTime,
            request: {
              params: req.params,
              query: req.query,
              body: req.body,
            },
            response: {
              statusCode: res.statusCode,
              body: responseData,
            },
          },
        };

        // Fire-and-forget to avoid blocking response
        prisma.auditLogs
          .create({ data: entry })
          .catch((err) => console.error("[AuditLogger] Failed to log:", err));
      } catch (err) {
        console.error("[AuditLogger] Unexpected error:", err);
      }

      return originalSend(body);
    };

    next();
  };
};

/**
 * Write an audit log manually from anywhere in the backend
 * @param {object} data
 * @param {string} data.tenantId
 * @param {string} data.userId
 * @param {string} data.module - e.g. "chat"
 * @param {string} data.action - e.g. "UPDATE"
 * @param {string} [data.target_type]
 * @param {string} [data.target_id]
 * @param {string} [data.actor_role]
 * @param {string} [data.status]
 * @param {string} [data.ip_address]
 * @param {string} [data.user_agent]
 * @param {string} [data.description]
 * @param {object} [data.metadata]
 */
export const writeAudit = async (data) => {
  try {
    const entry = {
      tenant_id: data.tenantId ?? null,
      user_id: data.userId ?? null,
      module: data.module ?? "system",
      action: data.action,
      target_type: data.target_type ?? null,
      target_id: data.target_id ?? null,
      actor_role: data.actor_role ?? "system",
      status: data.status ?? "SUCCESS",
      ip_address: data.ip_address ?? null,
      user_agent: data.user_agent ?? null,
      description: data.description ?? `${data.action} on ${data.module}`,
      metadata: data.metadata ?? {},
    };

    await prisma.auditLogs.create({ data: entry });
  } catch (err) {
    console.error("[writeAudit] Failed to write audit log:", err);
  }
};
