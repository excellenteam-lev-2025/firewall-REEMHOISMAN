import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DB_URI } from './config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// db connection
export const db = drizzle(DB_URI);

export async function initDb() {
    // קובעים תמיד את הנתיב היחסי לשורש הפרויקט
    const migrationsFolder = path.join(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder });
}
