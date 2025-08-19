import { mockSuccess, withData } from './testSetup.js';
import request from 'supertest';
import app from '../app.js';

describe('GET Endpoints', () => {
    
    test('Get all rules - empty database', async () => {
        mockSuccess();
        const res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body).toHaveProperty('ips');
        expect(res.body).toHaveProperty('ports');
        expect(res.body).toHaveProperty('urls');
        expect(res.body.ips).toHaveProperty('blacklist');
        expect(res.body.ips).toHaveProperty('whitelist');
    });

    test('Get all rules - with IP data', async () => {
        withData([
            { id: 1, value: '192.168.1.1', type: 'ip', mode: 'blacklist', active: true },
            { id: 2, value: '10.0.0.1', type: 'ip', mode: 'whitelist', active: true }
        ]);
        
        const res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body.ips.blacklist).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: '192.168.1.1' })
        ]));
        expect(res.body.ips.whitelist).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: '10.0.0.1' })
        ]));
    });

    test('Get all rules - with port data', async () => {
        withData([
            { id: 1, value: '8080', type: 'port', mode: 'blacklist', active: true },
            { id: 2, value: '443', type: 'port', mode: 'whitelist', active: true }
        ]);
        
        const res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body.ports.blacklist).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: 8080 })
        ]));
        expect(res.body.ports.whitelist).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: 443 })
        ]));
    });

    test('Get all rules - with URL data', async () => {
        withData([
            { id: 1, value: 'https://malware.com', type: 'url', mode: 'blacklist', active: true },
            { id: 2, value: 'https://trusted.com', type: 'url', mode: 'whitelist', active: true }
        ]);
        
        const res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body.urls.blacklist).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: 'https://malware.com' })
        ]));
        expect(res.body.urls.whitelist).toEqual(expect.arrayContaining([
            expect.objectContaining({ value: 'https://trusted.com' })
        ]));
    });

    test('Get all rules - mixed data types', async () => {
        withData([
            { id: 1, value: '192.168.1.1', type: 'ip', mode: 'blacklist', active: true },
            { id: 2, value: '80', type: 'port', mode: 'whitelist', active: true },
            { id: 3, value: 'https://example.com', type: 'url', mode: 'blacklist', active: true }
        ]);
        
        const res = await request(app).get('/api/firewall/rules').expect(200);
        expect(res.body.ips.blacklist).toHaveLength(1);
        expect(res.body.ports.whitelist).toHaveLength(1);
        expect(res.body.urls.blacklist).toHaveLength(1);
    });
});
