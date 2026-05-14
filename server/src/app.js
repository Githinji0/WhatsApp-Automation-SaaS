const express = require("express");

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

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/ai", aiRoutes);
app.use("/whatsapp", whatsappRoutes);
app.use("/workflows", workflowsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
