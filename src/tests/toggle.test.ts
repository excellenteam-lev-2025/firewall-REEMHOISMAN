import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import { eq } from 'drizzle-orm';
import app from '../app.js';

describe('PUT Toggle Endpoint', () => {
    
    beforeEach(async () => {
        await db.delete(rules);
    });

    test('Toggle rule active state', async () => {
        const ip = '192.168.1.1';
        
        // add rule req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(201);

        // get rule id
        const ruleData = await db.select().from(rules).where(eq(rules.value, ip));
        const ruleId = ruleData[0].id;

        // toggle the active status of the rule req
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: { ids: [ruleId], mode: 'blacklist', active: false },
                ports: {},
                urls: {}
            })
            .expect(200);
    });
});
