import { z } from "zod";
import 'dotenv/config';

const envSchema = z.object({
    NEXT_PUBLIC_ENV_MODE: z.enum(["dev", "prod", "test"]).default("dev"),

    // מה שהדפדפן משתמש בו (תמיד localhost עם פורט ממופה מה-compose)
    NEXT_PUBLIC_API_URL: z.url().default("http://localhost:4000"),

    // מה שה-SSR (server side) משתמש בו, בתוך Docker network
    INTERNAL_API_URL: z.url().default("http://backend:4000"),

    NEXT_PUBLIC_CLIENT_PORT: z.coerce.number().min(1).max(65535).default(3000),
});

const result = envSchema.safeParse(process.env);
if (!result.success) {
    if (typeof window === "undefined") {
        console.error("Invalid environment variables:");
        result.error.issues.forEach(issue => {
            console.error(`- ${issue.path.join(".")}: ${issue.message}`);
        });
        process.exit(1);
    } else {
        console.warn("Invalid environment variables:", result.error.issues);
    }
}

const env = result.data!;

// שני בסיסי API
export const API_URL =
    typeof window === "undefined" ? env.INTERNAL_API_URL : env.NEXT_PUBLIC_API_URL;

export const ENV = env;
