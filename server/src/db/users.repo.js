const { pool } = require("./client");

function getClerkEmail(clerkUser) {
  return (
    clerkUser.emailAddresses?.[0]?.emailAddress ??
    clerkUser.email ??
    clerkUser.primary_email_address ??
    clerkUser.primaryEmailAddress ??
    null
  );
}

function getClerkName(clerkUser) {
  const fallbackName = [clerkUser.firstName, clerkUser.lastName]
    .filter(Boolean)
    .join(" ");

  return clerkUser.name ?? clerkUser.full_name ?? clerkUser.fullName ?? fallbackName ?? null;
}

async function upsertUserFromClerk(clerkUser) {
  const clerkId = clerkUser.clerkId ?? clerkUser.id ?? clerkUser.sub;
  const email = getClerkEmail(clerkUser);
  const name = getClerkName(clerkUser);

  if (!clerkId) {
    throw new Error("No Clerk user ID found");
  }

  if (!email) {
    throw new Error(`No email found for Clerk user ${clerkId}`);
  }

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