import { pool } from '../db.js';

export const addIp = async (value: string, mode: string) => {
    const sql = `
        INSERT INTO ip (value, mode)
        VALUES ($1, $2)
        ON CONFLICT (value) DO NOTHING
        RETURNING *;
    `;
    const result = await pool.query(sql, [value, mode]);
    return result.rows[0];
};
