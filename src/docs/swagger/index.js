// src/docs/swagger/index.js
import { userPaths, userSchemas } from "./users.docs.js";

export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "KwaysMail API",
    version: "1.0.0",
    description: "API documentation for KwaysMail",
  },
  servers: [{ url: "http://localhost:5000", description: "Local server" }],
  paths: {
    ...userPaths,
    // future modules can be merged here
  },
  components: {
    schemas: {
      ...userSchemas,
    },
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  security: [{ bearerAuth: [] }],
};
