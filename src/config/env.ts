// src/config/env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const baseSchema = z.object({
    NODE_ENV: z.enum(["dev", "prod", "test"]).default("dev"),
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
    DB_NAME: z.string().min(1, 'db_name is required'),
    DB_CONNECTION_INTERVAL: z.string().refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n > 0;
    }, 'db_connection_interval must be a positive integer (ms)'),
    LOG_LEVEL: z.string().optional(),
    LOG_DIR: z.string().optional(),
    LOG_FILE: z.string().optional(),
}).transform((env) => {
    const fullDbName = `${env.DB_NAME}_${env.NODE_ENV}`;
    const dbUri = `postgresql://${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASSWORD)}@${env.DB_HOST}:${env.DB_PORT}/${fullDbName}`;

    return {
        ...env,
        DB_NAME: fullDbName,
        DB_URI: dbUri
    };
}).refine((env) => {
    return /^postgresql:\/\/.+:.+@.+:\d+\/.+$/.test(env.DB_URI);
}, { message: 'DB_URI is not a valid PostgresSQL connection string' });

const parsed = baseSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error('-', issue.path.join('.'), ':', issue.message);
    }
    process.exit(1);
}

export const ENV = parsed.data;

export const LOG_CONFIG = {
    NODE_ENV: ENV.NODE_ENV,
    LOG_LEVEL: ENV.LOG_LEVEL ?? (ENV.NODE_ENV === "prod" ? "info" : "debug"),
    LOG_DIR: ENV.LOG_DIR ?? "logs",
    LOG_FILE: ENV.LOG_FILE ?? "app.log",
} as const;

export const ERRORS = {
    MISSING_VALS_OR_MODE_ERR: 'missing "values" / "mode"',
    MISSING_TYPE: 'missing "url" / "ip" / "port"',
    MODE_NAME_ERR: 'mode can be "blacklist" / "whitelist"',
    VALS_ERR: 'expected an array of valid',
};
