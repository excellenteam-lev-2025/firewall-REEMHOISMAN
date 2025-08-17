import { mockSuccess } from './testSetup.js';
import request from 'supertest';
import { rules } from '../types/models/rules.js';
import app from '../app.js';

// test suite for delete endpoints
describe('DELETE Endpoints', () => {
    
    beforeEach(() => {
        mockSuccess();
    });

    test('Delete IP rule', async () => {
        const ip = '10.0.0.100';
        
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(201);

        await request(app)
            .delete('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(200);
    });

    test('Delete multiple IP rules', async () => {
        const ips = ['192.168.1.10', '192.168.1.20'];
        
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ips, mode: 'whitelist', type: 'ip' })
            .expect(201);

        await request(app)
            .delete('/api/firewall/ip')
            .send({ values: ips, mode: 'whitelist', type: 'ip' })
            .expect(200);
    });

    test('Delete port rule', async () => {
        const port = 3000;
        
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [port], mode: 'blacklist', type: 'port' })
            .expect(201);

        await request(app)
            .delete('/api/firewall/port')
            .send({ values: [port], mode: 'blacklist', type: 'port' })
            .expect(200);
    });

    test('Delete multiple port rules', async () => {
        const ports = [8000, 8080, 9000];
        
        await request(app)
            .post('/api/firewall/port')
            .send({ values: ports, mode: 'whitelist', type: 'port' })
            .expect(201);

        await request(app)
            .delete('/api/firewall/port')
            .send({ values: ports, mode: 'whitelist', type: 'port' })
            .expect(200);
    });

    test('Delete URL rule', async () => {
        const url = 'https://blocked-site.com';
        
        await request(app)
            .post('/api/firewall/url')
            .send({ values: [url], mode: 'blacklist', type: 'url' })
            .expect(201);

        await request(app)
            .delete('/api/firewall/url')
            .send({ values: [url], mode: 'blacklist', type: 'url' })
            .expect(200);
    });

    test('Delete multiple URL rules', async () => {
        const urls = ['https://spam.com', 'http://malware.net'];
        
        await request(app)
            .post('/api/firewall/url')
            .send({ values: urls, mode: 'blacklist', type: 'url' })
            .expect(201);

        await request(app)
            .delete('/api/firewall/url')
            .send({ values: urls, mode: 'blacklist', type: 'url' })
            .expect(200);
    });
});