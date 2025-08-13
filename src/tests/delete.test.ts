import request from 'supertest';
import { db } from '../db.js';
import { rules } from '../types/models/rules.js';
import app from '../app.js';

describe('DELETE Endpoint', () => {
    
    test('Delete rule', async () => {
        const ip = '192.168.1.1';
        
        // add rule req
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(201);

        // delete same rule req
        await request(app)
            .delete('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(200);
    });
});
