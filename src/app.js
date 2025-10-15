// src/app.js
import express from "express";
import cors from "cors";
import userRoutes from "./routes/user.routes.js";
import { apiRateLimiter } from "./middlewares/rateLimit.middleware.js";
import { errorHandler } from "./middlewares/error.middleware.js";
import { swaggerDocument } from "./docs/swagger/index.js";
import  swaggerUi  from 'swagger-ui-express';


const app = express();

// Middleware setup
app.use(cors());
app.use(express.json());
app.use(apiRateLimiter);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


// Register routes
app.use("/api/users", userRoutes);

// Root endpoint
app.get("/", (req, res) => res.send("KwaysMail Backend"));

// Error handler (must be last)
app.use(errorHandler);

export default app;
