import {addRule, deleteRule, getAllRules, toggleRules} from '../repositories/repositoryRules.js';
import { db } from '../db.js'
import {NextFunction, Request, Response} from "express";
import {Data} from "../types/interfaces/RequestBody.js";

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


export const toggleRuleStatusService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await db.transaction(async (trx) => {
            const updated: any[] = [];

            for (const payload of Object.values(req.body)) {
                const rows = await toggleRules(trx, payload as Data);
                updated.push(...rows);
            }

            res.status(200).json({ updated });
        });
    } catch (err) {
        next(err);
    }
};



