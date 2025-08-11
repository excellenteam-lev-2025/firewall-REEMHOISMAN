import {addRule, deleteRule, getAllRules, toggleRule} from '../repositories/repositoryRules.js';
import { db } from '../db.js'
import {NextFunction, Request, Response} from "express";
import {ConflictError} from "../utils/errors.js";



export const addRuleService = async (req:Request, res:Response, next:NextFunction) => {
    try {
        await addRule(req.body);
        res.status(201).json({ ...req.body, status: 'success' });
    } catch (err) {
        next(err);
    }
};


export const deleteRuleService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await deleteRule(req.body);
        res.status(200).json({ ...req.body, status: 'success' });
    } catch (err) {
        next(err);
    }
};

export const getAllRulesService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const rows = await getAllRules();

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


