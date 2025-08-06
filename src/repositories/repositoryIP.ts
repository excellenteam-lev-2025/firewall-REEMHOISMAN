export const addIp = async (value: string, mode: string, client:any) => {
    const sql = `
        INSERT INTO rules (type, value, mode)
        VALUES ('ip', $1, $2)
        ON CONFLICT (value) DO NOTHING
        RETURNING *;
    `;
    const result = await client.query(sql, [value, mode]);
    return result.rows[0];
};
