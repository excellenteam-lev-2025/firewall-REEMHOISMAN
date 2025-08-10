// env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

function validateEnv<T extends z.ZodTypeAny>(name: string, schema: T) {
    const value = process.env[name];
    const result = schema.safeParse(value);
    if (!result.success) {
        console.error(`❌ Invalid environment variable ${name}:`, result.error.message);
        process.exit(1);
    }
    return result.data as z.infer<T>;
}

export const ENV = {
    PORT: validateEnv('PORT', z.string().regex(/^\d+$/).refine(v => +v >= 1 && +v <= 65535)),
    DB_PORT: validateEnv('DB_PORT', z.string().regex(/^\d+$/).refine(v => +v >= 1 && +v <= 65535)),
    DB_HOST: validateEnv('DB_HOST', z.string().min(1)),
    DB_USER: validateEnv('DB_USER', z.string().min(1)),
    DB_PASSWORD: validateEnv('DB_PASSWORD', z.string().min(1)),
    DB_NAME: validateEnv('DB_NAME', z.string().min(1)),
};
