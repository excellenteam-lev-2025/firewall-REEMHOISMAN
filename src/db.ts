import path from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DB_URI, ENV } from './config/env.js';
import { logger } from './config/Logger.js';

export const db = drizzle(DB_URI);

export async function initDb() {
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    const interval = Number(ENV.DB_CONNECTION_INTERVAL) || 5000;

    while (true) {
        try {
            await migrate(db, { migrationsFolder });
            logger.info('migrations complete ✅');
            break;
        } catch (err) {
            logger.error(`❌ database migration failed: ${(err as Error).message}`);
            logger.info(`Retrying in ${interval}...`);
            await new Promise((resolve) => setTimeout(resolve, interval));
        }
    }
}
