import {addRule, deleteRule, getAllRules, toggleRule} from '../repositories/repositoryRules.js';
import { pool } from '../db.js'
import {NextFunction, Request, Response} from "express";

export const addRuleService = async (req:Request, res:Response, next:NextFunction) => {
    const { values, mode, type} = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const value of values) {
            const added = await addRule(type, value, mode, client);
            if (!added) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: `Value: ${value} already exists` });
            }
        }
        await client.query('COMMIT');
        res.status(201).json({ type, mode, values, status: 'success' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};


export const deleteRuleService = async (req: Request, res: Response, next: NextFunction) => {
    const { values, mode, type } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        for (const value of values) {
            const deleted = await deleteRule(type, value, mode, client);
            if (!deleted) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: `Value "${value}" not found` });
            }
        }
        await client.query('COMMIT');
        res.status(200).json({ type, mode, values, status: 'success' });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};

export const getAllRulesService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rows = await getAllRules(pool);

        const data = {
            ips: { blacklist: [], whitelist: [] },
            urls: { blacklist: [], whitelist: [] },
            ports: { blacklist: [], whitelist: [] }
        };

        for (const row of rows) {
            if (row.type === 'ip') {
                data.ips[row.mode].push({ id: row.id, value: row.value });
            } else if (row.type === 'url') {
                data.urls[row.mode].push({ id: row.id, value: row.value });
            } else if (row.type === 'port') {
                data.ports[row.mode].push({ id: row.id, value: Number(row.value) });
            }
        }


        res.status(200).json(data);
    } catch (err) {
        next(err);
    }
};



export const toggleRuleStatusService= async (req: Request, res: Response, next: NextFunction) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const updated = [];

        for (const [typeKey, p] of Object.entries(req.body)) {
            const params = p as { ids: number[]; mode: string; active: boolean };
            if (!params || !Array.isArray(params.ids)) continue;
            const { mode, ids, active } = params;
            for (const id of ids) {
                const result = await toggleRule(client, id, typeKey.slice(0, -1), mode, active);
                if (result) updated.push(result);
            }
        }

        await client.query('COMMIT');
        res.json({ updated });
    } catch (err) {
        await client.query('ROLLBACK');
        next(err);
    } finally {
        client.release();
    }
};


