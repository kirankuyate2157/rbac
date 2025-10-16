export const authSchemas = {
  Register: {
    type: "object",
    required: ["company_name", "admin"],
    properties: {
      company_name: { type: "string", example: "kk Corp" },
      domain: { type: "string", example: "kk.com" },
      plan_type: { type: "string", example: "enterprise" },
      admin: {
        type: "object",
        required: ["full_name", "email", "password"],
        properties: {
          full_name: { type: "string", example: "Karan Arajun" },
          email: { type: "string", example: "admin@kk.com" },
          password: { type: "string", example: "Password123!" },
        },
      },
    },
  },

  Login: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", example: "admin@kk.com" },
      password: { type: "string", example: "Password123!" },
    },
  },

  Refresh: {
    type: "object",
    // required: ["refresh_token"],
    // properties: {
    //   refresh_token: { type: "string", example: "eyJhbGciOiJI..." },
    // },
  },

  TokenResponse: {
    type: "object",
    properties: {
      access_token: { type: "string", example: "eyJhbGciOiJI..." },
      refresh_token: { type: "string", example: "eyJhbGciOiJI..." },
    },
  },

  UserResponse: {
    type: "object",
    properties: {
      id: { type: "string", example: "uuid-1234" },
      email: { type: "string", example: "admin@kk.com" },
      full_name: { type: "string", example: "John Doe" },
    },
  },
};

export const authPaths = {
  "/api/v1/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new tenant with admin",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Register" },
          },
        },
      },
      responses: {
        201: { description: "Tenant registered successfully" },
        400: { description: "Validation error" },
        409: { description: "Email already registered" },
      },
    },
  },

  "/api/v1/auth/login": {
    post: {
      tags: ["Auth"],
      summary: "Login user and generate tokens",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Login" },
          },
        },
      },
      responses: {
        200: {
          description: "Logged in successfully",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TokenResponse" },
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Invalid credentials" },
      },
    },
  },

  "/api/v1/auth/refresh": {
    get: {
      tags: ["Auth"],
      summary: "Refresh access token using refresh token",
      // requestBody: {
      //   required: true,
      //   content: {
      //     "application/json": {
      //       schema: { $ref: "#/components/schemas/Refresh" },
      //     },
      //   },
      // },
      responses: {
        200: {
          description: "Tokens refreshed",
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/TokenResponse" },
            },
          },
        },
        400: { description: "Validation error" },
        401: { description: "Invalid or expired refresh token" },
      },
    },
  },

  "/api/v1/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout from current device",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Logged out successfully" },
        401: { description: "Unauthorized" },
      },
    },
  },

  "/api/v1/auth/logout-all": {
    post: {
      tags: ["Auth"],
      summary: "Logout from all devices",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Logged out from all devices" },
        401: { description: "Unauthorized" },
      },
    },
  },
};
