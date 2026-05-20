const express = require("express");
const { env } = require("./config/env");

const { requestLogger } = require("./middleware/request-logger");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error-handler");
const authRoutes = require("./routes/auth.routes");
const aiRoutes = require("./routes/ai.routes");
const healthRoutes = require("./routes/health.routes");
const workflowsRoutes = require("./routes/workflows.routes");
const whatsappRoutes = require("./routes/whatsapp.routes");

// debug routes are only enabled in development
let debugRoutes;

const { logger } = require("./config/logger");
const app = express();
const defaultAllowedOrigins = ["http://localhost:3000", "http://127.0.0.1:3000"];
const allowedOrigins = env.CORS_ALLOWED_ORIGINS
  ? env.CORS_ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : defaultAllowedOrigins;

app.disable("x-powered-by");

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");

    if (req.method === "OPTIONS") {
      return res.status(204).end();
    }

    return next();
  }

  if (req.method === "OPTIONS") {
    return res.status(403).json({
      error: {
        message: "CORS origin not allowed",
        code: "FORBIDDEN",
      },
    });
  }

  return next();
});

app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/ai", aiRoutes);
app.use("/whatsapp", whatsappRoutes);
app.use("/workflows", workflowsRoutes);

if (env.NODE_ENV === "development") {
  debugRoutes = require("./routes/debug.routes");
  app.use("/debug", debugRoutes);
  logger.info("debug.routes.enabled", { path: "/debug" });
}

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
