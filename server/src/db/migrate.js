const fs = require("node:fs");
const path = require("node:path");

const { logger } = require("../config/logger");
const { pool } = require("./client");

const migrationsDir = path.resolve(__dirname, "migrations");

async function ensureMigrationTable(client) {
  await client.query(`
    create table if not exists schema_migrations (
      id serial primary key,
      filename text unique not null,
      applied_at timestamptz not null default now()
    );
  `);
}

async function run() {
  const client = await pool.connect();

  try {
    await client.query("begin");
    await ensureMigrationTable(client);

    const files = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const file of files) {
      const existsResult = await client.query(
        "select 1 from schema_migrations where filename = $1 limit 1",
        [file]
      );

      if (existsResult.rowCount > 0) {
        logger.info("db.migration.skipped", { file });
        continue;
      }

      const fullPath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(fullPath, "utf-8");

      logger.info("db.migration.applying", { file });
      await client.query(sql);
      await client.query(
        "insert into schema_migrations(filename) values ($1)",
        [file]
      );
      logger.info("db.migration.applied", { file });
    }

    await client.query("commit");
    logger.info("db.migration.complete");
  } catch (error) {
    await client.query("rollback");
    logger.error("db.migration.failed", { error: error.message });
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exit(1);
});
