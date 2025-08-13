import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import { eq } from 'drizzle-orm';
import app from '../app.js';

describe('DELETE /', () => {
    test('✅ Delete rule', async () => {
        const val = '11.11.11.11';
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [val], mode: 'blacklist', type: 'ip' })
            .expect(201);

        const rec = await db.select().from(rules).where(eq(rules.value, val));
        const id = rec[0].id;

        await request(app)
            .delete('/api/firewall')
            .send({ ids: [id], type: 'ip', mode: 'blacklist' })
            .expect(200);

        const after = await db.select().from(rules).where(eq(rules.id, id));
        expect(after.length).toBe(0);
    });
});
