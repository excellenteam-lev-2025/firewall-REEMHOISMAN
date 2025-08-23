import {rules} from "../types/models/rules.js";
import Database from "../config/Database.js";
import {Data} from "../types/interfaces/RequestBody.js";
import {and, eq, inArray} from "drizzle-orm";
import {HttpError} from "../utils/errors.js";

export const addRules = async (trx:any, toAdd: Data) => {
    const rows = toAdd.values.map((v) => ({
        type: toAdd.type,
        value: v,
        mode: toAdd.mode,
    }));
    const inserted = await trx
        .insert(rules)
        .values(rows)
        .onConflictDoNothing({ target: rules.value })
        .returning({ id: rules.id });

    if (inserted.length !== toAdd.values.length) {
        throw new HttpError(409, "One or more rules already exist (conflict).");
    }
};

export const deleteRule = async (trx:any, toDelete: Data) => {
    return await trx
        .delete(rules)
        .where(
            and(
                eq(rules.type, toDelete.type),
                eq(rules.mode, toDelete.mode),
                inArray(rules.value, toDelete.values)
            )
        )
        .returning({id: rules.id});
};


export const getAllRules = async (typeFilter?: string) => {
    const db = Database.getInstance().getDb();
    console.log("hiii")
    
    let dbType: string | undefined;
    if (typeFilter === 'ips') {
        dbType = 'ip';
    } else if (typeFilter === 'urls') {
        dbType = 'url';
    } else if (typeFilter === 'ports') {
        dbType = 'port';
    }
    
    if (dbType) {
        return db.select().from(rules).where(eq(rules.type, dbType));
    } else {
        return db.select().from(rules);
    }
};

export const toggleRules = async (trx:any, toUpdate:Data) => {
    return trx
        .update(rules)
        .set({ active: toUpdate.active })
        .where(
            and(
                eq(rules.mode, toUpdate.mode),
                inArray(rules.id, toUpdate.ids)
            )
        )
        .returning({ id: rules.id, value:rules.value, active: rules.active });
};
