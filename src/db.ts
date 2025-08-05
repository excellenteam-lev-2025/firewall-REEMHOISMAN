import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || "5432"),
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

export const query = (text: string, params: any[]) => pool.query(text, params);

