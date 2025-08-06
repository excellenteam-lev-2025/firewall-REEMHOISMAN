import { addIp } from '../repositories/repositoryIP.js';
import { pool } from '../db.js'
import {NextFunction, Request, Response} from "express";

export const addIpsService = async (req:Request, res:Response, next:NextFunction) => {
    const { values, mode } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const value of values) {
            const added = await addIp(value, mode, client);
            if (!added) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Value "${value}" already exists` });
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ type: 'ip', mode, values, status: 'success' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

