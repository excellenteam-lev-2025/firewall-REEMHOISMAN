import express from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const pool = new Pool({
    user: process.env.DB_USER || 'user',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    port: parseInt(process.env.DB_PORT || '5432', 10),
});

async function initializeDatabase() {
    try {
        const schemaSql = fs.readFileSync('init.sql', 'utf8');
        await pool.query(schemaSql);
        console.log('Database schema initialized successfully.');
    } catch (err) {
        console.error('Error initializing database schema:', err);
    }
}

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello from Express + TypeScript!');
});

const PORT = process.env.PORT || 3000;

(async () => {
    await initializeDatabase();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
})();

export const query = (text: string, params: any[]) => pool.query(text, params);
