// src/config/env.ts
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    NODE_ENV: z.enum(["dev", "prod", "test"]).default("dev"),
    PORT: z.coerce.number().min(1).max(65535).default(3000),
    DB_HOST: z.string().default("localhost"),
    DB_PORT: z.coerce.number().min(1).max(65535).default(5432),
    DB_USER: z.string().min(1),
    DB_PASSWORD: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_CONNECTION_INTERVAL: z.coerce.number().positive().default(3000),
    LOG_LEVEL: z.string().default("debug"),
    LOG_DIR: z.string().default("logs"),
    LOG_FILE: z.string().default("app.log"),
}).transform((env) => ({
    ...env,
    DB_NAME: `${env.DB_NAME}_${env.NODE_ENV === 'test' ? 'dev' : env.NODE_ENV}`,
    DB_URI: `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD)}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}_${env.NODE_ENV === 'test' ? 'dev' : env.NODE_ENV}`
}));

const result = envSchema.safeParse(process.env);
if (!result.success) {
    console.error('❌ Invalid environment variables:');
    result.error.issues.forEach(issue => {
        console.error(`- ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
}

export const ENV = result.data;

export const ERRORS = {
    MISSING_VALS_OR_MODE_ERR: 'missing "values" / "mode"',
    MISSING_TYPE: 'missing "url" / "ip" / "port"',
    MODE_NAME_ERR: 'mode can be "blacklist" / "whitelist"',
    VALS_ERR: 'expected an array of valid',
};
