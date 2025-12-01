import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_ENV_MODE: z.enum(["dev", "prod", "test"]).default("dev"),

  NEXT_PUBLIC_API_URL: z.string().url().default("http://backend:4000"),

  INTERNAL_API_URL: z.string().url().default("http://backend:4000"),

  NEXT_PUBLIC_CLIENT_PORT: z.coerce.number().min(1).max(65535).default(3000),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  if (typeof window === "undefined") {
    console.error("Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  } else {
    console.warn("Invalid environment variables:", result.error.issues);
  }
}

const base = result.data!;

export const ENV = {
  ...base,
  ENV_MODE: base.NEXT_PUBLIC_ENV_MODE,
  SERVER_BASE_URL: base.INTERNAL_API_URL,
} as const;

// שני בסיסי API
export const API_URL =
  typeof window === "undefined" ? base.INTERNAL_API_URL : base.NEXT_PUBLIC_API_URL;

export default ENV;
