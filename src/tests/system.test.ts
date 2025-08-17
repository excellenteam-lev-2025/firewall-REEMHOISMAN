import { withData, mockSuccess, mockConflict } from './testSetup.js';
import request from 'supertest';
import app from '../app.js';

describe('System Test - Happy Flow', () => {
    
    beforeEach(() => {
        withData([
            { id: 1, value: '192.168.1.100', type: 'ip', mode: 'blacklist', active: true },
            { id: 2, value: '443', type: 'port', mode: 'whitelist', active: true },
            { id: 3, value: 'https://trusted.com', type: 'url', mode: 'whitelist', active: true }
        ]);
    });

    test('Complete firewall management workflow', async () => {
        // get initial rules state
        let res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body).toHaveProperty('ips');
        expect(res.body).toHaveProperty('ports');
        expect(res.body).toHaveProperty('urls');

        // add new IP rules (both blacklist and whitelist)
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['10.0.0.50', '172.16.0.100'], mode: 'blacklist', type: 'ip' })
            .expect(201);

        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['192.168.1.10'], mode: 'whitelist', type: 'ip' })
            .expect(201);

        // add new port rules
        await request(app)
            .post('/api/firewall/port')
            .send({ values: [8080, 9000], mode: 'blacklist', type: 'port' })
            .expect(201);

        await request(app)
            .post('/api/firewall/port')
            .send({ values: [80], mode: 'whitelist', type: 'port' })
            .expect(201);

        // add new URL rules
        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['https://malware.com', 'http://spam.net'], mode: 'blacklist', type: 'url' })
            .expect(201);

        await request(app)
            .post('/api/firewall/url')
            .send({ values: ['https://safe-site.org'], mode: 'whitelist', type: 'url' })
            .expect(201);

        // rules endpoint still works (mocked data)
        res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body).toHaveProperty('ips');
        expect(res.body).toHaveProperty('ports');
        expect(res.body).toHaveProperty('urls');

        // toggle some rules (deactivate)
        await request(app)
            .put('/api/firewall/rules')
            .send({
                ips: { ids: [1], mode: 'blacklist', active: false },
                ports: { ids: [2], mode: 'whitelist', active: false },
                urls: { ids: [3], mode: 'whitelist', active: false }
            })
            .expect(200);

        // delete some rules
        await request(app)
            .delete('/api/firewall/ip')
            .send({ values: ['10.0.0.50'], mode: 'blacklist', type: 'ip' })
            .expect(200);

        await request(app)
            .delete('/api/firewall/port')
            .send({ values: [8080], mode: 'blacklist', type: 'port' })
            .expect(200);

        await request(app)
            .delete('/api/firewall/url')
            .send({ values: ['https://malware.com'], mode: 'blacklist', type: 'url' })
            .expect(200);

        // final verification (get rules)
        await request(app).get('/api/firewall/rules').expect(200);

        // test error cases
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['invalid.ip'], mode: 'blacklist', type: 'ip' })
            .expect(400);

        await request(app)
            .post('/api/firewall/port')
            .send({ values: [70000], mode: 'blacklist', type: 'port' })
            .expect(400);
    });

    test('Duplicate prevention workflow', async () => {
        mockSuccess();
        
        // Add a rule
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['1.1.1.1'], mode: 'blacklist', type: 'ip' })
            .expect(201);

        // Try to add the same rule again (should fail)
        mockConflict();
        await request(app)
            .post('/api/firewall/ip')
            .send({ values: ['1.1.1.1'], mode: 'blacklist', type: 'ip' })
            .expect(409);
    });
});