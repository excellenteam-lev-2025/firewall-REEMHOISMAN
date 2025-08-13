import { faker } from '@faker-js/faker';
import { rules } from '../types/models/rules.js';
import { connectToDb, db, pool } from '../db.js';
import '../config/Logger.js';
import { Mode, RuleType } from '../types/common.js';

const MODES: Mode[] = ['blacklist', 'whitelist'];

const genIps = (n: number) => {
    const edges = ['0.0.0.0', '255.255.255.255', '127.0.0.1', '1.1.1.1', '8.8.8.8'];
    const set = new Set(edges.slice(0, Math.min(edges.length, n)));
    while (set.size < n) set.add(faker.internet.ipv4());
    return [...set].slice(0, n);
};
const genPorts = () => [1, 22, 80, 443, 1024, 3306, 5432, 6379, 8080, 65535];
const genUrls = (n: number) => {
    const edges = [
        'http://localhost/',
        'http://example.com/',
        'https://example.org/path?x=1#y',
        'https://sub.domain.co.il/',
        'https://xn--4dbibheaa.co.il/',
    ];
    const set = new Set(edges.slice(0, Math.min(edges.length, n)));
    while (set.size < n) set.add(faker.internet.url());
    return [...set].slice(0, n);
};

const buildRowsForType = (type: RuleType, values: Array<string | number>) =>
    MODES.flatMap((mode, i) =>
        values.map((v, idx) => ({
            type,
            value: String(v),
            mode,
            active: idx % 2 === 0
        }))
    );

const seedDbMockData = async () => {
    const ips = genIps(10);
    const ports = genPorts();
    const urls = genUrls(10);
    const rows = [
        ...buildRowsForType('ip', ips),
        ...buildRowsForType('port', ports),
        ...buildRowsForType('url', urls),
    ];

    await db.transaction(async (trx) => {
        await trx
            .insert(rules)
            .values(rows)
            .onConflictDoNothing({ target: [rules.value] });
    });

    console.log('✅ Mock data populated');
};

connectToDb()
    .then(seedDbMockData)
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    });
