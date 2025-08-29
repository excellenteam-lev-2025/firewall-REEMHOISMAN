import { withData } from './testSetup.js';
import request from 'supertest';
import app from '../app.js';

describe('PUT Toggle Endpoint', () => {
    
    beforeEach(() => {
        withData([
            { id: 1, value: '192.168.1.1', type: 'ip', mode: 'blacklist', active: true },
            { id: 2, value: '8080', type: 'port', mode: 'whitelist', active: true },
            { id: 3, value: 'https://example.com', type: 'url', mode: 'blacklist', active: true }
        ]);
    });

    test('Toggle IP rule to inactive', async () => {
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: { ids: [1], mode: 'blacklist', active: false },
                ports: {},
                urls: {}
            })
            .expect(200);
    });

    test('Toggle IP rule to active', async () => {
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: { ids: [1], mode: 'blacklist', active: true },
                ports: {},
                urls: {}
            })
            .expect(200);
    });

    test('Toggle port rule to inactive', async () => {
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: {},
                ports: { ids: [2], mode: 'whitelist', active: false },
                urls: {}
            })
            .expect(200);
    });

    test('Toggle URL rule to inactive', async () => {
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: {},
                ports: {},
                urls: { ids: [3], mode: 'blacklist', active: false }
            })
            .expect(200);
    });

    test('Toggle multiple rules at once', async () => {
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: { ids: [1], mode: 'blacklist', active: false },
                ports: { ids: [2], mode: 'whitelist', active: false },
                urls: { ids: [3], mode: 'blacklist', active: false }
            })
            .expect(200);
    });

    test('Toggle with empty payload', async () => {
        await request(app)
            .put('/api/firewall/rules')
            .send({ 
                ips: {},
                ports: {},
                urls: {}
            })
            .expect(200);
    });
});
