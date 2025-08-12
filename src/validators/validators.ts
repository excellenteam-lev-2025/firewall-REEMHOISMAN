import { Request, Response, NextFunction } from "express";
import validator from 'validator';
import {HttpError} from "../utils/errors.js";
import {ERRORS} from "../config/env.js";


export const isModeValid = (req: Request, res: Response, next: NextFunction) => {
    const { mode } = req.body || {};

    if (!mode) {
        return next(new HttpError(400, ERRORS.MISSING_VALS_OR_MODE_ERR));
    }

    if (!['blacklist', 'whitelist'].includes(mode)) {
        return next(new HttpError(400, ERRORS.MODE_NAME_ERR));
    }
    next();
};


export const isIpsValid = (req: Request, res: Response, next: NextFunction) => {
    const { values } = req.body;
    if (!values.every((val:string)=>validator.isIP(val, 4))){
        return next(new HttpError(400, ERRORS.VALS_ERR + ' IP addresses'));
    }
    req.body.type = 'ip';
    next();
};


export const isUrlsValid = (req: Request, res: Response, next: NextFunction) => {
    const { values } = req.body;

    if (!values.every((val:string)=> validator.isURL(val))){
        return next(new HttpError(400, ERRORS.VALS_ERR + ' URL addresses'));
    }

    req.body.type = 'url';
    next();
}

export const isPortsValid = (req: Request, res: Response, next: NextFunction) => {
    const { values } = req.body;

    if (!Array.isArray(values) || !values.every((val: number) => typeof val === 'number' && val >= 0 && val <= 65535)) {
        return next(new HttpError(400, ERRORS.VALS_ERR + ' Ports'));
    }

    req.body.type = 'port';
    next();
}


export const isToggleValid = (req: Request, res: Response, next: NextFunction) => {
    const {urls, ports, ips} = req.body;

    if (!urls || !ports || !ips) {
        return next(new HttpError(400, ERRORS.MISSING_TYPE));
    }

    for (const [type, params] of Object.entries({urls, ports, ips})) {
        if (params && Object.keys(params).length > 0) {
            if (!Array.isArray(params.ids) || !params.mode || typeof params.active !== 'boolean') {
                return next(new HttpError(400,`Invalid or missing fields for ${type}`));
            }
            if (!['blacklist', 'whitelist'].includes(params.mode)) {
                return next(new HttpError(400, `Invalid mode for ${type}`));
            }
        }
    }

    next();
}

