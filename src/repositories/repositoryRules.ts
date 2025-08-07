export const addRule = async (type: string, value: string, mode: string, client:any) => {
    const sql = `
        INSERT INTO rules (type, value, mode)
        VALUES ($1, $2, $3)
        ON CONFLICT (value) DO NOTHING
        RETURNING *;
    `;
    const result = await client.query(sql, [type, value, mode]);
    return result.rows[0];
};

export const deleteRule = async (type: string, value: string, mode: string, client: any) => {
    const sql = `
        DELETE FROM rules
        WHERE type = $1 AND value = $2 AND mode = $3
        RETURNING *;
    `;
    const result = await client.query(sql, [type, value, mode]);
    return result.rowCount > 0;
};


export const getAllRules = async (pool) => {
    const sql = `
        SELECT id, type, mode, value
        FROM rules
    `;
    const result = await pool.query(sql);
    return result.rows;
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


