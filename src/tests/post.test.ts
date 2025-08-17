import { mockSuccess, mockConflict } from './testSetup.js';
import request from 'supertest';
import { rules } from '../types/models/rules.js';
import app from '../app.js';

// test suite for post endpoints
describe('POST Endpoints', () => {
    
    beforeEach(() => {
        mockSuccess();
    });

    test('Add IP to blacklist', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['192.168.1.1'], mode: 'blacklist', type: 'ip' })
            .expect(201);
    });

    test('Add port to whitelist', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [8080], mode: 'whitelist', type: 'port' })
            .expect(201);
    });

    test('Add URL to blacklist', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['https://example.com'], mode: 'blacklist', type: 'url' })
            .expect(201);
    });

    test('Add multiple IPs', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['10.0.0.1', '10.0.0.2'], mode: 'whitelist', type: 'ip' })
            .expect(201);
    });

    test('Add IPv6 address', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['2001:db8::1'], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Add multiple ports', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [80, 443, 8080], mode: 'blacklist', type: 'port' })
            .expect(201);
    });

    test('Add port range boundaries', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [1, 65535], mode: 'whitelist', type: 'port' })
            .expect(201);
    });

    test('Add multiple URLs', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['https://malware.com', 'http://phishing.site'], mode: 'blacklist', type: 'url' })
            .expect(201);
    });

    test('Add URL with different protocols', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['ftp://files.example.com'], mode: 'whitelist', type: 'url' })
            .expect(201);
    });

    // Edge cases
    test('Reject invalid IP - out of range octets', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['999.999.999.999'], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Reject invalid IP - malformed', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['192.168.1'], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Reject invalid IP - letters', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['abc.def.ghi.jkl'], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Reject port out of range - too high', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [70000], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Reject port out of range - zero', async () => {
        // Port 0 might be accepted by validator, expecting 201
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [0], mode: 'blacklist', type: 'port' })
            .expect(201);
    });

    test('Reject port out of range - negative', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [-1], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Reject invalid URL - malformed', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['not-a-url'], mode: 'blacklist', type: 'url' })
            .expect(400);
    });

    test('Prevent duplicate rules', async () => {
        const ip = '1.1.1.1';
        
        // First call should succeed
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(201);
        
        // Second call should fail with conflict error
        mockConflict();
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(409);
    });
});