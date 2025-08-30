import * as repo from '../repositories/repositoryRules';
import Database from '../config/Database';
import {NextFunction, Request, Response} from "express";
import {Data} from "../types/interfaces/RequestBody";
import {HttpError} from "../utils/errors";
import { RuleType } from "../types/common";
import PolicyDispatcher from '../config/PolicyDispatcher';

const dispatcher = PolicyDispatcher.getInstance();

export const addRules = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const db = Database.getInstance().getDb();
        await db.transaction(async (trx) => {
            await repo.addRules(trx, req.body);
        });
        await dispatcher.sendRule(req.body, 'add');
        console.info('[Controller] Rules added to firewall');
        res.status(201).json({ ...req.body, status: 'success' });

    } catch (err) {
        next(err);
    }
};


export const deleteRule = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const db = Database.getInstance().getDb();
        await db.transaction(async (trx) => {
            const deleted = await repo.deleteRule(trx, req.body);
            if (deleted.length === 0) {
                throw new HttpError(404, 'cannot find one of the rules');
            }
        });
        dispatcher.sendRule(req.body, "delete");
        console.log('[Controller] delete sent to firewall');
        res.status(200).json({ ...req.body, status: 'success' });
    } catch (err) {
        next(err);
    }
};

export const getAllRules = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const typeParam = req.query.type as string;
        const rows = await repo.getAllRules(typeParam);

        const data = {
            ips: { blacklist: [], whitelist: [] },
            urls: { blacklist: [], whitelist: [] },
            ports: { blacklist: [], whitelist: [] }
        };

        for (const row of rows) {
            const ruleType: RuleType = row.type as RuleType;
            if (ruleType === 'ip') {
                data.ips[row.mode].push({ id: row.id, value: row.value, active: row.active});
            } else if (ruleType === 'url') {
                data.urls[row.mode].push({ id: row.id, value: row.value, active: row.active});
            } else if (ruleType === 'port') {
                data.ports[row.mode].push({ id: row.id, value: row.value, active: row.active});
            }
        }

        if (typeParam === 'ips') {
            res.status(200).json({ ips: data.ips });
        } else if (typeParam === 'urls') {
            res.status(200).json({ urls: data.urls });
        } else if (typeParam === 'ports') {
            res.status(200).json({ ports: data.ports });
        } else {
            res.status(200).json(data);
        }
    } catch (err) {
        next(err);
    }
};


export const toggleRuleStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const updated:any = []
        const db = Database.getInstance().getDb();
        await db.transaction(async (trx) => {

        for (const payload of Object.values(req.body) as Partial<Data>[]) {

            if (!payload || Object.keys(payload).length === 0) continue;

            const rows = await repo.toggleRules(trx, payload as Data);
            if (rows.length !== payload.ids?.length) {
                throw new HttpError(404, "One or more rules not found");
            }
            updated.push(...rows);
        }
        });
        await dispatcher.sendRule({ rules: updated }, "update");
        console.log('[Controller] Toggle sent to firewall');
        console.info(`Rules updated: ${JSON.stringify(updated)}`);
        return res.status(200).json({ updated });

    } catch (err) {
        return next(err);
    }
};



