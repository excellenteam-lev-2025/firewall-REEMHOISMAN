import {rules} from "../types/models/rules.js";
import {db} from "../db.js";
import {AddOrDeleteBody} from "../types/interfaces/RequestBody.js";
import {and, eq} from "drizzle-orm";

export const addRule = async (toAdd: AddOrDeleteBody) => {
    await db.transaction(async (trx) => {
        await trx.insert(rules).values(
            toAdd.values.map((v) => ({type: toAdd.type, value: v, mode: toAdd.mode})),
        );
    });
};

export const deleteRule = async (toDelete: AddOrDeleteBody) => {

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
    const sql = `
        SELECT id, type, mode, value
        FROM rules
    `;
    const result = await db.select().from(rules);
    return result.;
};

export const toggleRule = async (client, id, type, mode, active) => {
    const sql = `
        UPDATE rules
        SET active = $1
        WHERE id = $2 AND type = $3 AND mode = $4
        RETURNING id, value, active
    `;
    const params = [active, id, type, mode];
    const { rows } = await client.query(sql, params);
    return rows[0];
};


