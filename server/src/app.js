const express = require("express");

const { requestLogger } = require("./middleware/request-logger");
const {
  errorHandler,
  notFoundHandler,
} = require("./middleware/error-handler");
const healthRoutes = require("./routes/health.routes");

const app = express();

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));
app.use(requestLogger);

app.use("/health", healthRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
