// // src/docs/swagger/users.docs.js

// export const userSchemas = {
//   CreateUserDto: {
//     type: "object",
//     required: ["name", "email", "password_hash"],
//     properties: {
//       name: { type: "string", example: "John Doe" },
//       email: { type: "string", example: "test@example.com" },
//       password_hash: { type: "string", example: "secret123" },
//       role: { type: "string", example: "user" },
//       tenantId: { type: "string", example: "tenant123" },
//     },
//   },
//   UpdateUserDto: {
//     type: "object",
//     properties: {
//       name: { type: "string" },
//       email: { type: "string" },
//       password_hash: { type: "string" },
//       role: { type: "string" },
//       isActive: { type: "boolean" },
//     },
//   },
// };

// export const userPaths = {
//   "/api/users/register": {
//     post: {
//       tags: ["Users"],
//       summary: "Register a new user",
//       requestBody: {
//         required: true,
//         content: {
//           "application/json": {
//             schema: { $ref: "#/components/schemas/CreateUserDto" },
//           },
//         },
//       },
//       responses: {
//         201: { description: "User created successfully" },
//         400: { description: "Bad request" },
//       },
//     },
//   },
//   "/api/users/login": {
//     post: {
//       tags: ["Users"],
//       summary: "Login a user",
//       requestBody: {
//         required: true,
//         content: {
//           "application/json": {
//             schema: {
//               type: "object",
//               properties: {
//                 email: { type: "string", example: "test@example.com" },
//                 password_hash: { type: "string", example: "secret123" },
//               },
//               required: ["email", "password_hash"],
//             },
//           },
//         },
//       },
//       responses: {
//         200: { description: "Login successful" },
//         401: { description: "Invalid credentials" },
//       },
//     },
//   },
//   "/api/users": {
//     get: {
//       tags: ["Users"],
//       summary: "Get list of users",
//       security: [{ bearerAuth: [] }],
//       parameters: [
//         { name: "tenantId", in: "query", schema: { type: "string" } },
//         { name: "skip", in: "query", schema: { type: "integer", default: 0 } },
//         { name: "take", in: "query", schema: { type: "integer", default: 50 } },
//       ],
//       responses: {
//         200: { description: "List of users" },
//         401: { description: "Unauthorized" },
//       },
//     },
//   },
//   "/api/users/{id}": {
//     get: {
//       tags: ["Users"],
//       summary: "Get a single user by ID",
//       security: [{ bearerAuth: [] }],
//       parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
//       responses: {
//         200: { description: "User object" },
//         404: { description: "User not found" },
//       },
//     },
//     put: {
//       tags: ["Users"],
//       summary: "Update a user by ID",
//       security: [{ bearerAuth: [] }],
//       parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
//       requestBody: {
//         required: true,
//         content: {
//           "application/json": {
//             schema: { $ref: "#/components/schemas/UpdateUserDto" },
//           },
//         },
//       },
//       responses: {
//         200: { description: "User updated" },
//         404: { description: "User not found" },
//       },
//     },
//     delete: {
//       tags: ["Users"],
//       summary: "Delete a user by ID",
//       security: [{ bearerAuth: [] }],
//       parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
//       responses: {
//         204: { description: "User deleted" },
//         404: { description: "User not found" },
//       },
//     },
//   },
// };


export const userSchemas = {
  CreateUserDto: {
    type: "object",
    required: ["email", "password_hash", "full_name"],
    properties: {
      full_name: { type: "string", example: "John Doe" },
      email: { type: "string", format: "email", example: "john@example.com" },
      password: { type: "string", example: "Secret123!" },
      role: { type: "string", enum: ["user", "member", "admin", "owner"], example: "user" },
      tenantId: { type: "string", example: "tenant123" },
    },
  },
  UpdateUserDto: {
    type: "object",
    properties: {
      full_name: { type: "string" },
      email: { type: "string", format: "email" },
      password: { type: "string" },
      role: { type: "string", enum: ["user", "member", "admin", "owner"] },
      status: { type: "string", enum: ["active", "inactive"] },
    },
  },
  LoginDto: {
    type: "object",
    required: ["email", "password_hash"],
    properties: {
      email: { type: "string", format: "email", example: "john@example.com" },
      password: { type: "string", example: "Secret123!" },
    },
  },
  UserResponse: {
    type: "object",
    properties: {
      id: { type: "string" },
      full_name: { type: "string" },
      email: { type: "string", format: "email" },
      role: { type: "string" },
      tenantId: { type: "string" },
      status: { type: "string" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
};

export const userPaths = {
  "/api/users/register": {
    post: {
      tags: ["Users"],
      summary: "Register a new user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/CreateUserDto" },
          },
        },
      },
      responses: {
        201: { description: "User created successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        400: { description: "User already exists or invalid input" },
      },
    },
  },
  "/api/users/login": {
    post: {
      tags: ["Users"],
      summary: "Login a user",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/LoginDto" },
          },
        },
      },
      responses: {
        200: {
          description: "Login successful",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  token: { type: "string" },
                  user: { $ref: "#/components/schemas/UserResponse" },
                },
              },
            },
          },
        },
        401: { description: "Invalid credentials" },
      },
    },
  },
  "/api/users/me": {
    get: {
      tags: ["Users"],
      summary: "Get authenticated user info",
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: "Authenticated user", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        401: { description: "Unauthenticated" },
      },
    },
  },
  "/api/users": {
    get: {
      tags: ["Users"],
      summary: "Get list of users",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "tenantId", in: "query", schema: { type: "string" }, description: "Filter by tenant" },
        { name: "skip", in: "query", schema: { type: "integer", default: 0 } },
        { name: "take", in: "query", schema: { type: "integer", default: 50 } },
      ],
      responses: {
        200: { description: "List of users", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/UserResponse" } } } } },
        401: { description: "Unauthorized" },
      },
    },
  },
  "/api/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get a single user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        200: { description: "User object", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        404: { description: "User not found" },
      },
    },
    put: {
      tags: ["Users"],
      summary: "Update a user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateUserDto" } } } },
      responses: {
        200: { description: "User updated", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
        404: { description: "User not found" },
      },
    },
    delete: {
      tags: ["Users"],
      summary: "Delete a user by ID",
      security: [{ bearerAuth: [] }],
      parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      responses: {
        204: { description: "User deleted" },
        404: { description: "User not found" },
      },
    },
  },
};

