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
        try {
            await dispatcher.sendRule(req.body, 'add');
            console.info('[Controller] Rules added to firewall');
        } catch (err: any) {
            console.warn(`[Controller] Failed to send rules to firewall (kernel module may not be running): ${err.message}`);
        }
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
        try {
            await dispatcher.sendRule(req.body, "delete");
            console.log('[Controller] delete sent to firewall');
        } catch (err: any) {
            console.warn(`[Controller] Failed to send delete to firewall: ${err.message}`);
        }
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
        const body = req.body as {
            ips?: { ids: number[]; mode: 'blacklist'|'whitelist'; active: boolean };
            ports?: { ids: number[]; mode: 'blacklist'|'whitelist'; active: boolean };
        };

        const sections = (['ips', 'ports'] as const)
            .map(k => ({ key: k, section: body[k] }))
            .filter(x => x.section && Array.isArray(x.section!.ids) && x.section!.ids.length > 0) as
            Array<{ key: 'ips'|'ports'; section: { ids: number[]; mode: 'blacklist'|'whitelist'; active: boolean } }>;

        if (sections.length === 0) return res.status(200).json({ updated: [], status: 'success' });

        const db = Database.getInstance().getDb();
        const updated: any[] = [];
        type BucketKey = `${'ip'|'port'}|${'blacklist'|'whitelist'}|${'add'|'delete'}`;
        const buckets = new Map<BucketKey, Set<string|number>>();

        const ensure = (t: 'ip'|'port', m: 'blacklist'|'whitelist', a: 'add'|'delete') => {
            const k = `${t}|${m}|${a}` as BucketKey;
            if (!buckets.has(k)) buckets.set(k, new Set());
            return buckets.get(k)!;
        };

        await db.transaction(async (trx) => {
            for (const { key, section } of sections) {
                const rows = await repo.toggleRules(trx, section as Data);
                if (rows?.length) {
                    updated.push(...rows);
                    const type = key === 'ips' ? 'ip' : 'port';
                    const action = section.active ? 'add' : 'delete';
                    const bucket = ensure(type, section.mode, action);
                    for (const r of rows) if (r?.value !== undefined && r?.active === section.active) bucket.add(r.value);
                }
            }
        });

        for (const [k, set] of buckets.entries()) {
            const [type, mode, action] = k.split('|') as ['ip'|'port','blacklist'|'whitelist','add'|'delete'];
            const values = Array.from(set);
            if (values.length) {
                try {
                    await dispatcher.sendRule({ type, mode, values }, action);
                } catch (err: any) {
                    console.warn(`[Controller] Failed to send toggle to firewall: ${err.message}`);
                }
            }
        }

        return res.status(200).json({ updated, status: 'success' });
    } catch (err) {
        return next(err);
    }
};



