import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import app from '../app.js';

/**
 * this test is the "happy flow"
 * being generated after all the other tests
 */
describe('System Test - Happy Flow', () => {
    
    // No beforeAll - don't delete existing data

    test('Complete firewall workflow', async () => {
        // get all rules req
        await request(app).get('/api/firewall/rules').expect(200); 

        // add new rules 'port' and 'ip' req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['10.10.10.10'], mode: 'blacklist', type: 'ip' })
            .expect(201);

        await request(app)
            .post('/api/firewall/port')
            .send({ values: [9090], mode: 'whitelist', type: 'port' })
            .expect(201);

        // get updated rules req
        let res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body).toHaveProperty('ips');
        expect(res.body).toHaveProperty('ports');
        expect(res.body).toHaveProperty('urls');

        // toggle the active status of the last rule req
        const newIpRule = res.body.ips.blacklist.find(rule => rule.value === '10.10.10.10');
        if (newIpRule) {
            await request(app)
                .put('/api/firewall/rules')
                .send({
                    ips: { ids: [newIpRule.id], mode: 'blacklist', active: false },
                    ports: {},
                    urls: {}
                })
                .expect(200);
        }

        // delete the port req
        await request(app)
            .delete('/api/firewall/port')
            .send({ values: [9090], mode: 'whitelist', type: 'port' })
            .expect(200);

    });
});
