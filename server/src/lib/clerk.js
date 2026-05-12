const { createRemoteJWKSet, jwtVerify } = require("jose");

const { env } = require("../config/env");

function getClerkJwks() {
  if (!env.CLERK_JWKS_URL) {
    throw new Error(
      "Missing Clerk auth config: set CLERK_JWKS_URL or CLERK_ISSUER_URL"
    );
  }

  return createRemoteJWKSet(new URL(env.CLERK_JWKS_URL));
}

function extractTokenFromHeader(authorizationHeader) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

async function verifyClerkToken(token) {
  const verificationOptions = {};

  if (env.CLERK_ISSUER_URL) {
    verificationOptions.issuer = env.CLERK_ISSUER_URL;
  }

  const { payload } = await jwtVerify(token, getClerkJwks(), verificationOptions);

  return payload;
}

function getClerkIdentity(payload) {
  const clerkId = payload.sub;
  const email =
    payload.email ||
    payload.primary_email_address ||
    payload.primaryEmailAddress ||
    null;
  const firstName = payload.first_name || payload.firstName || "";
  const lastName = payload.last_name || payload.lastName || "";
  const name =
    payload.full_name || payload.fullName || [firstName, lastName].filter(Boolean).join(" ") || null;

  if (!clerkId) {
    throw new Error("Clerk token is missing the `sub` claim");
  }

  return {
    clerkId,
    email,
    name,
    sessionId: payload.sid || payload.session_id || null,
    claims: payload,
  };
}

module.exports = {
  extractTokenFromHeader,
  verifyClerkToken,
  getClerkIdentity,
};