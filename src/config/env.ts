// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// define schema for all environment variables
const baseSchema = z.object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.string().refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 65535;
    }, 'port must be an integer between 1 and 65535'),
    DB_HOST: z.string().min(1, 'db_host is required'),
    DB_PORT: z.string().refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 65535;
    }, 'db_port must be an integer between 1 and 65535'),
    DB_USER: z.string().min(1, 'db_user is required'),
    DB_PASSWORD: z.string().min(1, 'db_password is required'),
    DB_NAME_DEV: z.string().min(1, 'db_name_dev is required'),
    DB_NAME_PROD: z.string().min(1, 'db_name_prod is required'),
    DB_CONNECTION_INTERVAL: z.string().refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n > 0;
    }, 'db_connection_interval must be a positive integer (ms)'),
    LOG_LEVEL: z.string().optional(),
    LOG_DIR: z.string().optional(),
    LOG_FILE: z.string().optional(),
});

const parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error('-', issue.path.join('.'), ':', issue.message);
    }
    process.exit(1);
}

export const ENV = parsed.data;

export const DB_URI =
    `postgresql://${encodeURIComponent(ENV.DB_USER)}:${encodeURIComponent(ENV.DB_PASSWORD)}` +
    `@${ENV.DB_HOST}:${ENV.DB_PORT}/` +
    encodeURIComponent(
        ENV.NODE_ENV === "production" ? ENV.DB_NAME_PROD : ENV.DB_NAME_DEV
    );

// log configuration
export const LOG_CONFIG = {
    NODE_ENV: ENV.NODE_ENV,
    LOG_LEVEL: ENV.LOG_LEVEL ?? (ENV.NODE_ENV === "production" ? "info" : "debug"),
    LOG_DIR: ENV.LOG_DIR ?? "logs",
    LOG_FILE: ENV.LOG_FILE ?? "app.log",
} as const;

// error constants
export const MISSING_VALS_OR_MODE_ERR = 'missing "values" / "mode"';
export const MISSING_TYPE = 'missing "url" / "ip" / "port"';
export const MODE_NAME_ERR = 'mode can be "blacklist" / "whitelist"';
export const VALS_ERR = 'expected an array of valid';
