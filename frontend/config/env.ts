import { z } from "zod";

const envSchema = z.object({
    ENV_MODE: z.enum(["dev", "prod", "test"]).default("dev"),
    SERVER_PORT: z.coerce.number().min(1).max(65535).default(4000),
    CLIENT_PORT: z.coerce.number().min(1).max(65535).default(3000),
}).transform(env => ({
    ...env,
    SERVER_BASE_URL: `http://backend:${env.SERVER_PORT}`,
    CLIENT_BASE_URL: `http://localhost:${env.CLIENT_PORT}`,
}));

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

export const ENV = result.data;