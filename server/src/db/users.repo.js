const { pool } = require("./client");

async function upsertUserFromClerk({ clerkId, email, name }) {
  const result = await pool.query(
    `
      insert into users (clerk_id, email, name)
      values ($1, $2, $3)
      on conflict (clerk_id)
      do update set
        email = excluded.email,
        name = excluded.name,
        updated_at = now()
      returning id, clerk_id as "clerkId", email, name, created_at as "createdAt", updated_at as "updatedAt";
    `,
    [clerkId, email, name]
  );

  return result.rows[0];
}

module.exports = {
  upsertUserFromClerk,
};