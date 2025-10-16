// src/middlewares/session.middleware.js
import { SessionService } from "../services/session.service.js";
import { log } from "../config/logger.js";

import cookie from "cookie";
import { signAccessToken, signRefreshToken } from "../utils/auth.js";

export const sessionMiddleware = () => {
  return async (req, res, next) => {
    console.log("\n🟢 [SessionMiddleware] started for:", req.method, req.originalUrl);

    const originalSend = res.send.bind(res);
    const originalJson = res.json.bind(res);

    // 🔍 Detect when middleware starts
    console.log("🟡 [SessionMiddleware] → overriding res.send & res.json");

    const processResponse = async (body) => {
      console.log("🟣 [SessionMiddleware] processResponse() called with:", body);

      try {
        let responseData;
        try {
          responseData = typeof body === "string" ? JSON.parse(body) : body;
        } catch {
          responseData = body;
        }

        console.log("🟤 Parsed response body:", responseData);

        const { user, tenant_id } = responseData || {};
        if (user && tenant_id) {
          console.log("🟢 Detected user + tenant_id → creating session...");

          const device = {
            id: req.headers["x-device-id"],
            type: req.headers["x-device-type"] || "web",
            name:
              req.headers["x-device-name"] ||
              req.userAgent ||
              "Unknown Device",
            os: req.headers["x-device-os"],
            browser: req.headers["user-agent"],
            location: req.headers["x-device-location"]
              ? JSON.parse(req.headers["x-device-location"])
              : null,
          };

          const session = await SessionService.createSession({
            user,
            tenant_id,
            device,
            req,
          });

          const accessToken = signAccessToken({
            user_id: user.id,
            tenant_id,
            session_id: session.id,
            token_version: session.token_version,
          });
          const refreshToken = signRefreshToken({
            user_id: user.id,
            tenant_id,
            session_id: session.id,
            token_version: session.token_version,
          });

          await SessionService.updateRefreshToken(session.id, refreshToken);

          console.log("✅ Session created →", session.id);

          res.cookie("access_token", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 7,
            sameSite: "lax",
          });

          res.cookie("refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 1000 * 60 * 60 * 24 * 30,
            sameSite: "lax",
          });

          responseData.session_id = session.id;
          responseData.access_token = accessToken;
          responseData.refresh_token = refreshToken;
        } else {
          console.log("⚪ No user/tenant_id found in response → skipping session.");
        }

        console.log("🔵 Final response body after session attach:", responseData);
        return responseData;
      } catch (err) {
        console.error("❌ [SessionMiddleware] Error:", err);
        return body;
      }
    };

    // 🔧 Override both send & json
    res.send = async (body) => {
      console.log("🟠 [SessionMiddleware] res.send() triggered with body:", body);
      const modified = await processResponse(body);
      return originalSend(modified);
    };

    res.json = async (body) => {
      console.log("🔴 [SessionMiddleware] res.json() triggered with body:", body);
      const modified = await processResponse(body);
      return originalJson(modified);
    };

    next();
  };
};


// export const sessionMiddleware = () => {
//   return async (req, res, next) => {
//     const originalSend = res.send.bind(res);
//     const originalJson = res.json.bind(res);
//     console.log("middlerware: started : ",)
//     const processResponse = async (body) => {
//       try {
//         let responseData;
//         try {
//           responseData = typeof body === "string" ? JSON.parse(body) : body;
//         } catch {
//           responseData = body;
//         }

//         console.log("res data ", responseData)
//         const { user, tenant_id } = responseData || {};

//         if (user && tenant_id) {
//           const device = {
//             id: req.headers["x-device-id"],
//             type: req.headers["x-device-type"] || "web",
//             name: req.headers["x-device-name"] || req.userAgent || "Unknown Device",
//             os: req.headers["x-device-os"],
//             browser: req.headers["user-agent"],
//             location: req.headers["x-device-location"]
//               ? JSON.parse(req.headers["x-device-location"])
//               : null,
//           };

//           const session = await SessionService.createSession({
//             user,
//             tenant_id,
//             device,
//             req,
//           });

//           const accessToken = signAccessToken({
//             user_id: user.id,
//             tenant_id,
//             session_id: session.id,
//             token_version: session.token_version,
//           });
//           const refreshToken = signRefreshToken({
//             user_id: user.id,
//             tenant_id,
//             session_id: session.id,
//             token_version: session.token_version,
//           });

//           await SessionService.updateRefreshToken(session.id, refreshToken);

//           res.cookie("access_token", accessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             maxAge: 1000 * 60 * 60 * 24 * 7,
//             sameSite: "lax",
//           });

//           res.cookie("refresh_token", refreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             maxAge: 1000 * 60 * 60 * 24 * 30,
//             sameSite: "lax",
//           });

//           responseData.session_id = session.id;
//           responseData.access_token = accessToken;
//           responseData.refresh_token = refreshToken;
//         }
//         console.log("fina res body : ", responseData)

//         return responseData;
//       } catch (err) {
//         log.error("Session middleware error:", err);
//         return body;
//       }
//     };
//     console.log(" overidder :: ")
//     // Override BOTH send & json
//     res.send = async (body) => {
//       console.log("sedd 1 : ", body)
//       const modified = await processResponse(body);
//       return originalSend(modified);
//     };

//     res.json = async (body) => {
//       console.log("sedn json :: ", body)
//       const modified = await processResponse(body);
//       return originalJson(modified);
//     };

//     next();
//   };
// };


// export const sessionMiddleware = () => {
//   return async (req, res, next) => {
//     const originalSend = res.send.bind(res);
//     const originalJson = res.json.bind(res);

//     let responseData;
//     log.raw("middlerware started :: ", res)
//     console.log(res)
//     res.send = async (body) => {
//       try {
//         // Parse body safely
//         try {
//           responseData = typeof body === "string" ? JSON.parse(body) : body;
//         } catch {
//           responseData = body;
//         }
//         log.raw("res body : ", responseData)
//         // Expect user & tenant_id in response
//         const { user, tenant_id } = responseData || {};

//         if (user && tenant_id) {
//           const device = {
//             id: req.headers["x-device-id"] || undefined,
//             type: req.headers["x-device-type"] || "web",
//             name: req.headers["x-device-name"] || req.userAgent || "Unknown Device",
//             os: req.headers["x-device-os"] || null,
//             browser: req.headers["user-agent"] || null,
//             location: req.headers["x-device-location"]
//               ? JSON.parse(req.headers["x-device-location"])
//               : null,
//           };

//           // Create session
//           const session = await SessionService.createSession({
//             user,
//             tenant_id,
//             device,
//             req,
//           });

//           // Sign tokens
//           const accessToken = signAccessToken({
//             user_id: user.id,
//             tenant_id,
//             session_id: session.id,
//             token_version: session.token_version,
//           });
//           const refreshToken = signRefreshToken({
//             user_id: user.id,
//             tenant_id,
//             session_id: session.id,
//             token_version: session.token_version,
//           });

//           // Update session with hashed refresh token
//           await SessionService.updateRefreshToken(session.id, refreshToken);

//           // Set cookies
//           res.cookie("access_token", accessToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//             sameSite: "lax",
//           });

//           res.cookie("refresh_token", refreshToken, {
//             httpOnly: true,
//             secure: process.env.NODE_ENV === "production",
//             maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
//             sameSite: "lax",
//           });

//           log.info(`✅ Session created for ${user.email}, session_id: ${session.id}`);

//           // Attach session info & tokens to response body
//           responseData.session_id = session.id;
//           responseData.access_token = accessToken;
//           responseData.refresh_token = refreshToken;
//         }

//         return originalSend(responseData);
//       } catch (err) {
//         log.error("❌ Session middleware error:", err);
//         return originalSend(body); // fallback
//       }
//     };

//     next();
//   };
// };
