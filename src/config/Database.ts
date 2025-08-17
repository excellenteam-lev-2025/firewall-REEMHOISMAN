// src/config/Database.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ENV } from './env.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';

/**
 * Database Singleton class
 * only one database connection pool and drizzle instance exists
 */
class Database {
    private static instance: Database;
    private readonly pool: Pool;
    private readonly db: NodePgDatabase;
    private isConnected: boolean = false;

    private constructor() {
        this.pool = new Pool({ connectionString: ENV.DB_URI });
        this.db = drizzle(this.pool);
    }

    /**
     * Gets the singleton instance of Database
     * @returns Database instance
     */
    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    /**
     * Gets the drizzle database instance
     * @returns NodePgDatabase
     */
    public getDb(): NodePgDatabase {
        return this.db;
    }


    /**
     * Gets the PostgreSsQL connection pool
     * @returns Pool
     */
    public getPool(): Pool {
        return this.pool;
    }

    /**
     * stop and wait connection to database function
     * @returns Promise<void>
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            console.info('Database already connected ✅');
            return;
        }

        const interval = Number(ENV.DB_CONNECTION_INTERVAL) || 3000;
        const maxAttempts = 5;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.pool.query('SELECT 1');
                console.info('Database connection established ✅');
                this.isConnected = true;
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
}

// Export the Database class
export default Database;