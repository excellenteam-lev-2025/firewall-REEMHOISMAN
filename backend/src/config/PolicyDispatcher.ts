// PolicyDispatcher.ts
import net from 'net';
import { getAllRules } from '../repositories/repositoryRules';

interface FirewallRule {
    action?: string;
    type?: string;
    mode?: string;
    values?: any[];
    cmd?: string;
    rule_type?: string;
    [key: string]: any;
}

class PolicyDispatcher {
    private static instance: PolicyDispatcher;
    private readonly host: string;
    private readonly port: number;
    private readonly timeout: number;
    private isConnected: boolean = false;

    private constructor() {
        this.host = process.env.VM_IP?.trim() || '127.0.0.1';
        this.port = parseInt(process.env.VM_PORT || '9999', 10);
        this.timeout = parseInt(process.env.VM_TIMEOUT || '5000', 10);
    }

    public static getInstance(): PolicyDispatcher {
        if (!PolicyDispatcher.instance) {
            PolicyDispatcher.instance = new PolicyDispatcher();
        }
        return PolicyDispatcher.instance;
    }

    public async testConnection(): Promise<void> {
        const maxAttempts = 3;
        const interval = 2000;

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                await this.sendRaw({ action: 'ping' });
                console.info(`[PolicyDispatcher] Connection to ${this.host}:${this.port} verified`);
                this.isConnected = true;
                return;
            } catch (err) {
                if (attempt === maxAttempts) {
                    console.error('[PolicyDispatcher] Failed to connect to VM after retries:', (err as Error).message);
                    throw err;
                }
                console.warn(`[PolicyDispatcher] Connection test failed (${attempt}/${maxAttempts}). Retrying in ${interval}ms...`);
                await new Promise(res => setTimeout(res, interval));
            }
        }
    }

    private async sendRaw(data: FirewallRule): Promise<any> {
        return new Promise((resolve, reject) => {
            const socket = net.createConnection({ host: this.host, port: this.port });
            let buffer = '';
            let done = false;

            const timer = setTimeout(() => {
            if (!done) {
                done = true;
                try { socket.destroy(); } catch {}
                reject(new Error(`Connection timeout to ${this.host}:${this.port}`));
            }
            }, this.timeout);

            socket.on('connect', () => {
            const json = JSON.stringify(data);
                console.log(`[PolicyDispatcher] Sending: ${json}`);
                socket.write(json);
                socket.end();                 // << חשוב: מסמן שסיימנו לשלוח
            });

            socket.on('data', (chunk) => {
                buffer += chunk.toString('utf8'); // פשוט צוברים
            });

            socket.on('end', () => {            // נחכה לסיום הזרם מה-C
                if (done) return;
                done = true;
                clearTimeout(timer);
                try {
                    resolve(buffer.trim() ? JSON.parse(buffer) : { status: 'ok' });
                } catch {
                    resolve({ status: 'ok', message: buffer.trim() });
                }
            });

            socket.on('error', (err) => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                this.isConnected = false;
                reject(err);
            });
        });
    }

    public async sendRule(data: any, action: string): Promise<any> {
        const payload: FirewallRule = { ...data, action };

        switch (action) {
            case 'add':
            case 'delete':
                if (data.type && data.mode && data.values) {
                    return this.sendRaw({
                        action,
                        type: data.type,
                        mode: data.mode,
                        values: data.values
                    });
                }
                break;

            case 'update':
                if (data.rules || data.updated) {
                    const rules = data.updated || data.rules;
                    const promises = [];
                    
                    for (const rule of rules) {
                        // Only process active rules as 'add', inactive as 'delete'
                        const ruleAction = rule.active ? 'add' : 'delete';
                        promises.push(this.sendRaw({
                            action: ruleAction,
                            type: rule.type,
                            mode: rule.mode || 'blacklist',
                            values: [rule.value]
                        }));
                    }
                    
                    return Promise.all(promises);
                }
                break;

            case 'clear':
                return this.sendRaw({
                    action: 'clear',
                    cmd: 'C',
                    rule_type: 'A'
                });

            default:
                return this.sendRaw(payload);
        }

        return this.sendRaw(payload);
    }

    public async syncRules(): Promise<void> {
    const [ips, ports] = await Promise.all([
        getAllRules("ips").then(rs =>
        rs.filter(r => r.mode === "blacklist" && r.active).map(r => r.value)
        ),
        getAllRules("ports").then(rs =>
        rs.filter(r => r.mode === "blacklist" && r.active).map(r => r.value)
        ),
    ]);

    const jobs: Promise<unknown>[] = [];

    if (ips.length > 0) {
        const ipPayload = { type: "ip", mode: "blacklist", values: [...ips] };   // clone!
        jobs.push(this.sendRule(ipPayload, "add"));
    }

    if (ports.length > 0) {
        const portPayload = { type: "port", mode: "blacklist", values: [...ports] }; // clone!
        jobs.push(this.sendRule(portPayload, "add"));
    }

    await Promise.all(jobs);
    console.info("[PolicyDispatcher] syncRules completed");
    }
 

    public getStatus(): { connected: boolean; host: string; port: number } {
        return {
            connected: this.isConnected,
            host: this.host,
            port: this.port
        };
    }
}

export default PolicyDispatcher;