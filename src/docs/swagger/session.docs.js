// src/docs/swagger/session.docs.js

export const sessionPaths = {
  "/sessions/create": {
    post: {
      tags: ["Sessions"],
      summary: "Create a new session for a user",
      description: "Creates a session, attaches access & refresh tokens, and logs session creation.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateSession" },
          },
        },
      },
      responses: {
        201: {
          description: "Session created successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SessionResponse" },
            },
          },
        },
        400: { description: "Invalid request" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/sessions/refresh": {
    post: {
      tags: ["Sessions"],
      summary: "Refresh an existing session",
      description: "Extends session expiration and returns new access token.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RefreshSession" },
          },
        },
      },
      responses: {
        200: {
          description: "Session refreshed successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/SessionResponse" },
            },
          },
        },
        401: { description: "Invalid or inactive session" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/sessions/revoke": {
    post: {
      tags: ["Sessions"],
      summary: "Revoke a single session",
      description: "Revokes a session by session ID.",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/RevokeSession" },
          },
        },
      },
      responses: {
        200: { description: "Session revoked successfully" },
        404: { description: "Session not found" },
        500: { description: "Internal server error" },
      },
    },
  },

  "/sessions/revoke-all/{user_id}": {
    post: {
      tags: ["Sessions"],
      summary: "Revoke all sessions for a user",
      parameters: [
        {
          name: "user_id",
          in: "path",
          required: true,
          schema: { type: "string" },
          description: "ID of the user to revoke all sessions for",
        },
      ],
      responses: {
        200: { description: "All sessions revoked successfully" },
        404: { description: "User not found" },
        500: { description: "Internal server error" },
      },
    },
  },
};

export const sessionSchemas = {
  Device: {
    type: "object",
    properties: {
      os: { type: "string", example: "Windows 10" },
      browser: { type: "string", example: "Firefox 144.0" },
      location: { type: "string", example: null },
      app_version: { type: "string", example: null },
      device_type: { type: "string", example: "web" },
      device_model: { type: "string", example: "Unknown Device" },
      device_vendor: { type: "string", example: null },
      screen_resolution: { type: "string", example: null },
    },
  },

  CreateSession: {
    type: "object",
    required: ["user_id", "tenant_id"],
    properties: {
      user_id: { type: "string" },
      tenant_id: { type: "string" },
      device: { $ref: "#/components/schemas/Device" },
    },
  },

  RefreshSession: {
    type: "object",
    required: ["session_id"],
    properties: {
      session_id: { type: "string" },
    },
  },

  RevokeSession: {
    type: "object",
    required: ["session_id"],
    properties: {
      session_id: { type: "string" },
    },
  },

  SessionResponse: {
    type: "object",
    properties: {
      session_id: { type: "string" },
      access_token: { type: "string" },
      refresh_token: { type: "string" },
      user_id: { type: "string" },
      tenant_id: { type: "string" },
      device: { $ref: "#/components/schemas/Device" },
      created_at: { type: "string", format: "date-time" },
      expires_at: { type: "string", format: "date-time" },
    },
  },
};
