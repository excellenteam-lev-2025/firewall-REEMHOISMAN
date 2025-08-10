import { Pool } from 'pg';
import {ENV} from './config/env.js'
import fs from 'fs';

export const pool = new Pool({
    user: ENV.DB_USER,
    host: ENV.DB_HOST,
    database: ENV.DB_NAME,
    password: ENV.DB_PASSWORD,
    port: parseInt(ENV.DB_PORT || "5432"),
});

export async function initializeDatabase() {
    try {
        const schemaSql = fs.readFileSync('init.sql', 'utf8');
        await pool.query(schemaSql);
        console.log('Database schema initialized successfully.');
    } catch (err) {
        console.error('Error initializing database schema:', err);
    }
}


