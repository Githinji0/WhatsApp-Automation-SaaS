const { Pool } = require("pg");

const { env } = require("../config/env");

const useSsl = env.DB_SSL === "true";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
});

module.exports = {
  pool,
};
