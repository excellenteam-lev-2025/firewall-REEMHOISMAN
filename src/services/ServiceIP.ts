import { addIp } from '../repositories/repositoryIP.js';

export const addIpToList = async (req: any, res: any, next: any) => {
    console.log("hiiiiiiiiiiiiii");
    try {
        const { values, mode } = req.body;
        if (!Array.isArray(values) || !mode || !['blacklist', 'whitelist'].includes(mode)) {
            return res.status(400).json({ error: 'Invalid body' });
        }

        if (values.some(val => typeof val !== 'string')) {
            return res.status(400).json({ error: 'Invalid body' });
        }

        // מכניס כל IP בנפרד
        const inserted = [];
        for (const value of values) {
            const res = await addIp(value, mode);
            if (res) inserted.push(res); // מחזיר רק מה שבאמת נכנס
        }

        res.status(201).json({
            type: 'ip',
            mode,
            values,
            status: 'success',
            inserted
        });
    } catch (err) {
        next(err);
    }
};
