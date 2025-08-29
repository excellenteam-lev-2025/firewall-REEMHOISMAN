import { mockSuccess, mockConflict } from './testSetup.js';
import request from 'supertest';
import app from '../app.js';

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

        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(201);

        mockConflict();
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [ip], mode: 'blacklist', type: 'ip' })
            .expect(409);
    });

    test('Reject port out of range - zero', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [0], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Reject non-integer port', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [8080.5], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Reject string port', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: ['8080'], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Reject empty URL', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: [''], mode: 'blacklist', type: 'url' })
            .expect(400);
    });

    test('Reject whitespace URL', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['   '], mode: 'blacklist', type: 'url' })
            .expect(400);
    });

    test('Reject mixed valid/invalid IPs', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['10.0.0.1', '999.999.999.999'], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Reject mixed valid/invalid ports', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [80, -1], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Reject mixed valid/invalid URLs', async () => {
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['https://ok.com', 'not-a-url'], mode: 'blacklist', type: 'url' })
            .expect(400);
    });

    test('Reject empty values array', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: [], mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Reject non-array values', async () => {
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: '1.1.1.1', mode: 'blacklist', type: 'ip' })
            .expect(400);
    });

    test('Prevent duplicate port rule', async () => {
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [8081], mode: 'blacklist', type: 'port' })
            .expect(201);

        mockConflict();
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [8081], mode: 'blacklist', type: 'port' })
            .expect(409);
    });

    test('Prevent duplicate URL rule', async () => {
        const u = 'https://duplicate.example';
        await request(app)
            .post('/api/firewall/url')
            .send({ values: [u], mode: 'blacklist', type: 'url' })
            .expect(201);

        mockConflict();
        await request(app)
            .post('/api/firewall/url')
            .send({ values: [u], mode: 'blacklist', type: 'url' })
            .expect(409);
    });
});
