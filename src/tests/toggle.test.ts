import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import { eq } from 'drizzle-orm';
import app from '../app.js';

describe('PUT /toggle', () => {
    test('✅ Toggle active state', async () => {
        const val = '10.0.0.1';
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [val], mode: 'blacklist', type: 'ip' })
            .expect(201);

        let rec = await db.select().from(rules).where(eq(rules.value, val));
        const id = rec[0].id;

        await request(app)
            .put('/api/firewall/toggle')
            .send({ ids: [id], type: 'ip', mode: 'blacklist', active: false })
            .expect(200);

        rec = await db.select().from(rules).where(eq(rules.id, id));
        expect(rec[0].active).toBe(false);
    });
});
