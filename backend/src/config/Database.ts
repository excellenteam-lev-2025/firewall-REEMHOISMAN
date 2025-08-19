import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV } from './env.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';


class Database {
    private static instance: Database;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;
    private isConnected: boolean = false;

    private constructor() {
        this.pool = new Pool({ connectionString: ENV.DB_URI });
        this.db = drizzle(this.pool);
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }


    public getDb(): NodePgDatabase {
        return this.db;
    }


    public getPool(): Pool {
        return this.pool;
    }


    public async connect(): Promise<void> {
        if (this.isConnected) {
            console.info('Database already connected');
            return;
        }

        const interval = Number(ENV.DB_CONNECTION_INTERVAL) || 3000;
        const maxAttempts = 5;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.pool.query('SELECT 1');
                console.info('Database connection established');
                this.isConnected = true;
                return;
            } catch (err) {
                if (attempt === maxAttempts) {
                    console.error('Failed to connect to DB after retries:', (err as Error).message);
                    throw err;
                }
                console.warn(`DB connect failed (${attempt}/${maxAttempts}). Retrying in ${interval}ms...`);
                await new Promise(res => setTimeout(res, interval));
            }
        }
    }
}

export default Database;
