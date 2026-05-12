const { logger } = require("../config/logger");
const {
  extractTokenFromHeader,
  getClerkIdentity,
  verifyClerkToken,
} = require("../lib/clerk");

async function requireAuth(req, res, next) {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        error: {
          message: "Missing Bearer token",
          code: "UNAUTHORIZED",
        },
      });
    }

    const payload = await verifyClerkToken(token);
    req.auth = getClerkIdentity(payload);

    return next();
  } catch (error) {
    logger.warn("auth.failed", {
      error: error.message,
      path: req.originalUrl,
    });

    return res.status(401).json({
      error: {
        message: "Invalid or expired Clerk session token",
        code: "UNAUTHORIZED",
      },
    });
  }
}

module.exports = {
  requireAuth,
};