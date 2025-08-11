import {rules} from "../types/models/rules.js";
import {db} from "../db.js";
import {Data, UpdateData, UpdateReqBody} from "../types/interfaces/RequestBody.js";
import {and, eq, inArray} from "drizzle-orm";

export const addRule = async (toAdd: Data) => {
    await db.transaction(async (trx) => {
        await trx.insert(rules).values(
            toAdd.values.map((v) => ({type: toAdd.type, value: v, mode: toAdd.mode})),
        );
    });
};

export const deleteRule = async (toDelete: Data) => {

    await db.transaction(async (trx) => {
        const rows = await Promise.all(
            toDelete.values.map(v =>
                trx
                    .delete(rules)
                    .where(and(eq(rules.type, toDelete.type), eq(rules.value, v), eq(rules.mode, toDelete.mode)))
                    .returning()
            )
        );
    })

};


export const getAllRules = async () => {
    return db.select().from(rules);
};

export const toggleRules = async (trx:any, toUpdate:Data) => {
    if (!Array.isArray(toUpdate.ids) ||!toUpdate.ids.length)  return Promise.resolve([]);
    return trx
        .update(rules)
        .set({ active : toUpdate.active })
        .where(and(eq(rules.type, toUpdate.type), eq(rules.mode, toUpdate.mode), inArray(rules.id, toUpdate.ids)))
        .returning({ id: rules.id, active: rules.active, type: rules.type, mode: rules.mode });
};


