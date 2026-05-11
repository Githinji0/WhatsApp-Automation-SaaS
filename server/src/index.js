const http = require("node:http");

const app = require("./app");
const { env } = require("./config/env");
const { logger } = require("./config/logger");
const { pool } = require("./db/client");

const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info("server.started", {
    port: env.PORT,
    nodeEnv: env.NODE_ENV,
  });
});

function shutdown(signal) {
  logger.info("server.shutdown.start", { signal });

  server.close(async (serverCloseErr) => {
    if (serverCloseErr) {
      logger.error("server.shutdown.server_close_failed", {
        error: serverCloseErr.message,
      });
      process.exit(1);
      return;
    }

    try {
      await pool.end();
      logger.info("server.shutdown.complete", { signal });
      process.exit(0);
    } catch (dbErr) {
      logger.error("server.shutdown.db_close_failed", {
        error: dbErr.message,
      });
      process.exit(1);
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
