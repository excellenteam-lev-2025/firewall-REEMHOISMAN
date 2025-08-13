import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import app from '../app.js';

describe('POST Endpoints', () => {
    
    beforeEach(async () => {
        await db.delete(rules);
    });

    test('Add IP to blacklist', async () => {
        // add new rules 'ip' req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['192.168.1.1'], mode: 'blacklist', type: 'ip' })
            .expect(201);
    });

    test('Add port to whitelist', async () => {
        // add new rules 'port' req
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [8080], mode: 'whitelist', type: 'port' })
            .expect(201);
    });

    test('Add URL to blacklist', async () => {
        // add new rules 'url' req
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['https://example.com'], mode: 'blacklist', type: 'url' })
            .expect(201);
    });

    test('Add multiple IPs', async () => {
        // add multiple rules req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['10.0.0.1', '10.0.0.2'], mode: 'whitelist', type: 'ip' })
            .expect(201);
    });

    test('Reject invalid IP', async () => {
        // invalid ip req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['999.999.999.999'], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Reject port out of range', async () => {
        // port out of range req
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [70000], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Prevent duplicate rules', async () => {
        const ip = '1.1.1.1';
        
        // add rule req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(201);
        
        // duplicate rule req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(409);
    });
});
