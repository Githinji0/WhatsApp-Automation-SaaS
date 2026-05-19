const fetch = require('node-fetch');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').resolve(__dirname, '../.env') });

async function main() {
  const secret = process.env.CLERK_SECRET_KEY;
  const issuer = process.env.CLERK_ISSUER_URL;

  if (!secret) {
    console.error('Missing CLERK_SECRET_KEY in server .env');
    process.exit(1);
  }

  const timestamp = Date.now();
  const email = `test+${timestamp}@example.com`;
  const crypto = require('crypto');
  const raw = crypto.randomBytes(12).toString('base64');
  // Ensure password has at least one upper, one lower, one digit, one symbol
  const password = `Aa1!${raw}`;

  const body = {
    email_addresses: [{ email_address: email }],
    password,
    first_name: 'Test',
    last_name: 'User',
  };

  const url = 'https://api.clerk.dev/v1/users';

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const json = await res.text();
    try {
      const parsed = JSON.parse(json);
      if (!res.ok) {
        console.error('Clerk API returned error', res.status, JSON.stringify(parsed, null, 2));
        process.exitCode = 1;
        return;
      }

      console.log('Created test user:', JSON.stringify(parsed, null, 2));
      console.log('Test credentials — email:', email, 'password:', password);
    } catch (e) {
      console.error('Failed to parse Clerk response', res.status, json);
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Request failed', err.message);
    process.exitCode = 1;
  }
}

main();
