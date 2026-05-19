const { logger } = require("../config/logger");

function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

function errorHandler(err, req, res, next) {
  const statusCode = Number.isInteger(err.statusCode) ? err.statusCode : 500;
  const message = statusCode === 500 ? "Internal server error" : err.message;
  const code = err.code || (statusCode === 500 ? "INTERNAL_ERROR" : "REQUEST_ERROR");

  logger.error("http.error", {
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: err.message,
    stack: err.stack,
  });

  if (res.headersSent) {
    next(err);
    return;
  }

  res.status(statusCode).json({
    error: {
      message,
      code,
    },
  });
}

module.exports = {
  notFoundHandler,
  errorHandler,
};
