const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DB_SSL: z.enum(["true", "false"]).default("false"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issueText = parsed.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid environment configuration: ${issueText}`);
}

const env = parsed.data;

module.exports = {
  env,
};
