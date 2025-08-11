// env.ts
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const Schema = z.object({
    PORT: z.string().refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 65535;
    }, 'PORT must be an integer between 1 and 65535'),
    DB_PORT: z.string().refine((v) => {
        const n = Number(v);
        return Number.isInteger(n) && n >= 1 && n <= 65535;
    }, 'DB_PORT must be an integer between 1 and 65535'),
    DB_HOST: z.string().min(1, 'DB_HOST is required'),
    DB_USER: z.string().min(1, 'DB_USER is required'),
    DB_PASSWORD: z.string().min(1, 'DB_PASSWORD is required'),
    DB_NAME: z.string().min(1, 'DB_NAME is required'),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    for (const issue of parsed.error.issues) {
        console.error('-', issue.path, ':', issue.message);
    }
    process.exit(1);
}


export const ENV = parsed.data;

// בנאי URI מודולרי
export function buildDbUri(e = ENV): string {
    return `postgresql://${encodeURIComponent(e.DB_USER)}:${encodeURIComponent(e.DB_PASSWORD)}@${e.DB_HOST}:${e.DB_PORT}/${encodeURIComponent(e.DB_NAME)}`;
}

// URI מוכן לשימוש
export const DB_URI = buildDbUri();
