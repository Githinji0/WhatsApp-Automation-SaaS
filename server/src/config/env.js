const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config({ override: true });

function emptyStringToUndefined(value) {
  return value === "" ? undefined : value;
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  SUPABASE_DB_URL: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  CLERK_ISSUER_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  CLERK_JWKS_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  WHATSAPP_PROVIDER: z.preprocess(emptyStringToUndefined, z.enum(["meta", "webjs", "mock"]).optional()),
  WHATSAPP_API_VERSION: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  WHATSAPP_ACCESS_TOKEN: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  WHATSAPP_PHONE_NUMBER_ID: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  WHATSAPP_WEBJS_SESSION_NAME: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  OPENROUTER_API_KEY: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  OPENROUTER_MODEL: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  OPENROUTER_SITE_URL: z.preprocess(emptyStringToUndefined, z.string().url().optional()),
  OPENROUTER_APP_NAME: z.preprocess(emptyStringToUndefined, z.string().min(1).optional()),
  DB_SSL: z.enum(["true", "false"]).default("true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issueText = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${issueText}`);
}

const env = {
  ...parsed.data,
  DATABASE_URL: parsed.data.SUPABASE_DB_URL || parsed.data.DATABASE_URL,
};

if (!env.DATABASE_URL) {
  throw new Error(
    "Invalid environment configuration: provide DATABASE_URL or SUPABASE_DB_URL"
  );
}

if (!env.CLERK_JWKS_URL) {
  env.CLERK_JWKS_URL = env.CLERK_ISSUER_URL
    ? `${env.CLERK_ISSUER_URL.replace(/\/$/, "")}/.well-known/jwks.json`
    : undefined;
}

module.exports = {
  env,
};
