import {addRules, deleteRule, getAllRules, toggleRules} from '../repositories/repositoryRules.js';
import { db } from '../db.js'
import {NextFunction, Request, Response} from "express";
import {Data} from "../types/interfaces/RequestBody.js";
import {HttpError} from "../utils/errors.js";
import {logger} from "../config/Logger.js";

export const addRuleService = async (req:Request, res:Response, next:NextFunction) => {
    try {
        await db.transaction(async (trx) => {
            await addRules(trx, req.body);
        });
        res.status(201).json({ ...req.body, status: 'success' });

    } catch (err) {
        next(err);
    }
};


export const deleteRuleService = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await db.transaction(async (trx) => {
            const deleted = await deleteRule(trx, req.body);
            if (!deleted.length){
                throw new HttpError(404, 'cannot find one of the rules');
            }
        });
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
        const updated:any = []
        await db.transaction(async (trx) => {

        for (const payload of Object.values(req.body) as Partial<Data>[]) {

            if (!payload || Object.keys(payload).length === 0) continue;

            const rows = await toggleRules(trx, payload as Data);
            if (rows.length !== payload.ids?.length) {
                throw new HttpError(404, "One or more rules not found");
            }
            updated.push(...rows);
        }
        });
        logger.info(`Rules updated: ${JSON.stringify(updated)}`);
        return res.status(200).json({ updated });

    } catch (err) {
        return next(err);
    }
};



