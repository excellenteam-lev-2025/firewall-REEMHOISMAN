const {pool} from
exports.addIpToList = (req, res, next) => {
    const {values, mode} = req.body;
    if (!Array.isArray(values) || !mode) {
        return res.status(400).json({ error: 'Invalid body' });
    }

    // הכנסת המידע לטבלה (נניח הגדרת את הטבלה ככה: ips (id SERIAL, values VARCHAR(45)[], mode TEXT))
    const result = await pool.query(
        `INSERT INTO ips (values, mode) VALUES ($1, $2) RETURNING *`,
        [values, mode]
    );

    res.status(201).json(result.rows[0]);

}