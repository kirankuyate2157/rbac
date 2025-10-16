// src/docs/swagger/index.js
import { userPaths, userSchemas } from "./users.docs.js";
import { authPaths, authSchemas } from "./auth.docs.js";
import { sessionPaths, sessionSchemas } from "./session.docs.js";
export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "RBAC API",
    version: "1.0.0",
    description: "API documentation for RBAC",
  },
  servers: [{ url: "http://localhost:5000", description: "Local server" }],
  paths: {
    // ...userPaths,
    ...authPaths,
    ...sessionPaths
    // future modules can be merged here
  },
  components: {
    schemas: {
      // ...userSchemas,
      ...authSchemas,
      ...sessionSchemas,
    },
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
};
