import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import { eq } from 'drizzle-orm';
import app from '../app.js';

describe('POST Endpoints', () => {

    // ✅ Successful input - IP
    test('Add valid IP to blacklist', async () => {
        const res = await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['9.9.9.9'], mode: 'blacklist', type: 'ip' })
            .expect(201);

        expect(res.body.status).toBe('success');
        const found = await db.select().from(rules).where(eq(rules.value, '9.9.9.9'));
        expect(found.length).toBe(1);
    });

    // ✅ Successful input - Port
    test('Add valid port to whitelist', async () => {
        const res = await request(app)
            .post('/api/firewall/port')
            .send({ values: [8081], mode: 'whitelist', type: 'port' })
            .expect(201);

        expect(res.body.status).toBe('success');
        const found = await db.select().from(rules).where(eq(rules.value, '8081'));
        expect(found.length).toBe(1);
    });

    // ✅ Successful input - URL
    test('Add valid URL to blacklist', async () => {
        const url = 'https://my-test-url.com';
        const res = await request(app)
            .post('/api/firewall/url')
            .send({ values: [url], mode: 'blacklist', type: 'url' })
            .expect(201);

        expect(res.body.status).toBe('success');
        const found = await db.select().from(rules).where(eq(rules.value, url));
        expect(found.length).toBe(1);
    });

    // ⚠️ Edge case - invalid IP
    test('Reject invalid IP address', async () => {
        const res = await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['999.999.999.999'], mode: 'blacklist', type: 'ip' })
            .expect(400);

        expect(res.body.error).toMatch(/invalid/i);
    });

    // ⚠️ Edge case - port out of range
    test('Reject port out of range', async () => {
        const res = await request(app)
            .post('/api/firewall/port')
            .send({ values: [70000], mode: 'blacklist', type: 'port' })
            .expect(400);

        expect(res.body.error).toMatch(/invalid/i);
    });

    // 🛑 Duplicate check
    test('Do not insert duplicate rule', async () => {
        const value = '1.1.1.1';
        const existing = await db.select().from(rules).where(eq(rules.value, value));

        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [value], mode: existing[0].mode, type: 'ip' })
            .expect(201);

        const after = await db.select().from(rules).where(eq(rules.value, value));
        expect(after.length).toBe(existing.length); // no new row added
    });
});
