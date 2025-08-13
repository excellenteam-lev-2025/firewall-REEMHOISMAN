// src/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV } from './config/env.js';

export const pool = new Pool({ connectionString: ENV.DB_URI });
export const db = drizzle(pool);

export async function connectToDb() {
    const interval = Number(ENV.DB_CONNECTION_INTERVAL) || 3000;
    const maxAttempts = 5;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await pool.query('SELECT 1');
            console.info('Database connection established ✅');
            return;
        } catch (err) {
            if (attempt === maxAttempts) {
                console.error('❌ Failed to connect to DB after retries:', (err as Error).message);
                throw err;
            }
            console.warn(`DB connect failed (${attempt}/${maxAttempts}). Retrying in ${interval}ms...`);
            await new Promise(res => setTimeout(res, interval));
        }
    }
}
