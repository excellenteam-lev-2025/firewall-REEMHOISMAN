import { z } from "zod";
// אל תייבא dotenv כאן – Next טוען .env לבד בעת build/run
// import 'dotenv/config';

const envSchema = z.object({
  NEXT_PUBLIC_ENV_MODE: z.enum(["dev", "prod", "test"]).default("dev"),

  // מה שהדפדפן רואה (דרך פרוקסי/rewrites)
  NEXT_PUBLIC_API_URL: z.string().url().default("http://localhost:4000"),

  // מה שהשרת (SSR) רואה בתוך רשת הדוקר
  INTERNAL_API_URL: z.string().url().default("http://backend:4000"),

  NEXT_PUBLIC_CLIENT_PORT: z.coerce.number().min(1).max(65535).default(3000),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
  // בזמן build זה רץ ב-node (בלי window)
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

/**
 * שים לב לשני האליאסים למטה:
 * - ENV_MODE: כדי שקוד שקורא ENV.ENV_MODE (כמו Logger.ts) ימשיך לעבוד.
 * - SERVER_BASE_URL: אם יש מקומות ישנים שקוראים לזה במקום INTERNAL_API_URL.
 */
export const ENV = {
  ...base,
  ENV_MODE: base.NEXT_PUBLIC_ENV_MODE,           // << אליאס לשם הישן
  SERVER_BASE_URL: base.INTERNAL_API_URL,        // << אליאס לשם הישן (אם קיים שימוש)
} as const;

// שני בסיסי API
export const API_URL =
  typeof window === "undefined" ? base.INTERNAL_API_URL : base.NEXT_PUBLIC_API_URL;

export default ENV;
