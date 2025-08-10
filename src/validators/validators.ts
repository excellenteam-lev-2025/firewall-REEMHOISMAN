import { Request, Response, NextFunction } from "express";
import validator from 'validator'
import {BadRequestError} from "../utils/errors.js";

const MISSING_VALS_OR_MODE_ERR = 'missing "values" / "mode"';
const MISSING_TYPE = 'missing "url" / "ip" / "port';
const MODE_NAME_ERR = 'mode can be "blacklist" / "whitelist"';
const VALS_ERR = 'expected an array of valid';

export const isModeValid = (req: Request, res: Response, next: NextFunction) => {
    const { mode } = req.body || {};

    if (!mode) {
        return next(new BadRequestError(MISSING_VALS_OR_MODE_ERR));
    }

    if (!['blacklist', 'whitelist'].includes(mode)) {
        return next(new BadRequestError(MODE_NAME_ERR));
    }

    next();
};




export const isIpsValid = (req: Request, res: Response, next: NextFunction) => {
    const { values } = req.body;
    const regexIP = /^\d+\.\d+\.\d+\.\d+$/;

    if (!validateValuesRegex(regexIP, values)) {
        return next(new BadRequestError(VALS_ERR + ' IP addresses'));
    }

    req.body.type = 'ip';
    next();
};




export const isUrlsValid = (req: Request, res: Response, next: NextFunction) => {
    const { values } = req.body;
    const regexUrl = /^[a-zA-Z]+\.[a-zA-Z]+$/;

    if (!validateValuesRegex(regexUrl, values)) {
        return next(new BadRequestError(VALS_ERR + ' URL addresses'));
    }

    req.body.type = 'url';
    next();
}

export const isPortsValid = (req: Request, res: Response, next: NextFunction) => {
    const { values } = req.body;

    if (!Array.isArray(values) || !values.every((val: number) => typeof val === 'number' && val >= 0 && val <= 65535)) {
        return next(new BadRequestError(VALS_ERR + ' Ports'));
    }

    req.body.type = 'port';
    next();
}

const validateValuesRegex = (regex: RegExp, values: any[]) =>
     Array.isArray(values) && values.every(val => typeof val === 'string' && regex.test(val))


export const isToggleValid = (req: Request, res: Response, next: NextFunction) => {
    const {urls, ports, ips} = req.body;

    if (!urls || !ports || !ips) {
        return next(new BadRequestError(MISSING_TYPE));
    }

    for (const [type, params] of Object.entries({urls, ports, ips})) {
        if (params && Object.keys(params).length > 0) {
            if (!Array.isArray(params.ids) || !params.mode || typeof params.active !== 'boolean') {
                return next(new BadRequestError(`Invalid or missing fields for ${type}`));
            }
            if (!['blacklist', 'whitelist'].includes(params.mode)) {
                return next(new BadRequestError(`Invalid mode for ${type}`));
            }
        }
    }

    next();
}

