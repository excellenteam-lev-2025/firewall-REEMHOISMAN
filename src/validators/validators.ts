import { Request, Response, NextFunction } from "express";
import validator from 'validator'

const NOT_ARRAY_ERR = 'Invalid request body: expected "values" array';
const MISSING_BODY_PARAM_ERR = 'Invalid request body: missing "values" / "mode"';
const MODE_NAME_ERR = 'Invalid request body: mode can be "blacklist" / "whitelist"';
const VALUES_TYPES_ERR = 'Invalid request body: expected values element to be type: ';

export const isBodyValid = (req: Request, res: Response, next: NextFunction) => {
    const { values, mode } = req.body;

    if (!values || !mode)
        return res.status(400).json({ error: MISSING_BODY_PARAM_ERR });

    if (!Array.isArray(values))
        return res.status(400).json({ error: NOT_ARRAY_ERR });

    if (!['blacklist', 'whitelist'].includes(mode))
        return res.status(400).json({ error: MODE_NAME_ERR });

    const valuesType = mode === 'ip' ? 'int' : 'string';

    if (values.some(val => typeof val !== valuesType))
        return res.status(400).json({ error: VALUES_TYPES_ERR + valuesType });

    next();
};


export const isIpsValid = (req: any, res: any, next: any) => {
    const { values } = req.body;

    const isValidIP = (ip: string) => {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        return parts.every(part => {
            const num = Number(part);
            return !isNaN(num) && num >= 0 && num <= 255 && String(num) === part;
        });
    };

    if (values.some((val: string) => !isValidIP(val))) {
        return res.status(400).json({ error: 'Invalid IP address in values array' });
    }

    next();
};

