import prisma from "../config/db";

/**
 * Idempotency middleware
 * Usage: attach to endpoints that must be idempotent (e.g., create tenant, invite user)
 * Requires header: "Idempotency-Key"
 * @param {string} keyNamespace - Optional namespace for grouping keys
 */
export const idempotency = (keyNamespace = "default") => {
  return async (req, res, next) => {
    const key = req.header("Idempotency-Key");

    if (!key) return next(); // no key, just proceed

    try {
      // check if key already exists
      const existing = await prisma.idempotency.findUnique({ where: { key } });

      if (existing) {
        if (existing.response) {
          // replay stored response
          res.setHeader("Content-Type", "application/json");
          return res.status(existing.statusCode || 200).send(existing.response);
        } else {
          // request in progress — reject
          return res.status(409).json({
            status: "error",
            errors: [
              { code: "in_progress", message: "Request already in progress" },
            ],
          });
        }
      }

      // create placeholder
      await prisma.idempotency.create({
        data: {
          key,
          namespace: keyNamespace,
          createdAt: new Date(),
        },
      });

      // attach key to request so controller can update later
      req.idempotencyKey = key;

      // 3️⃣ Wrap res.send to store final response automatically
      const originalSend = res.send.bind(res);
      res.send = async (body) => {
        try {
          const responseBody =
            typeof body === "string" ? JSON.parse(body) : body;

          const headersToStore = {};
          // store only safe headers (optional)
          ["content-type", "etag", "cache-control"].forEach((h) => {
            if (res.getHeader(h)) headersToStore[h] = res.getHeader(h);
          });

          await prisma.idempotency.update({
            where: { key },
            data: {
              response: responseBody,
              headers: JSON.stringify(headersToStore),
              statusCode: res.statusCode,
              updatedAt: new Date(),
            },
          });
        } catch (err) {
          console.error("[Idempotency Middleware] Error saving response:", err);
        } finally {
          return originalSend(body);
        }
      };

      // 4️⃣ Continue to controller
      next();
    } catch (err) {
      console.error("[Idempotency Middleware] Error:", err);
      next(err);
    }
  };
};
