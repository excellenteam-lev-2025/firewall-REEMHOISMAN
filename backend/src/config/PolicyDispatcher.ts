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
        this.host = process.env.VM_IP?.trim() || '10.0.2.15';
        this.port = parseInt(process.env.VM_PORT || '9999', 10);
        this.timeout = parseInt(process.env.VM_TIMEOUT || '5000', 10);
    }

    public static getInstance(): PolicyDispatcher {
        if (!PolicyDispatcher.instance) {
            PolicyDispatcher.instance = new PolicyDispatcher();
        }
        return PolicyDispatcher.instance;
    }

    private async request(payload: any, expectJson: boolean = true): Promise<any> {
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
                const data = JSON.stringify(payload);
                console.log(`[PolicyDispatcher] Sending: ${data}`);
                socket.write(data);
                socket.end();
            });

            socket.on('data', (chunk) => {
                buffer += chunk.toString('utf8');
            });

            socket.on('end', () => {
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
        console.log(`[PolicyDispatcher] Sending: ${JSON.stringify(payload)}`);

        switch (action) {
            case 'add':
            case 'delete':
                if (data.type && data.mode && data.values) {
                    return this.request({
                        action,
                        type: data.type,
                        mode: data.mode,
                        values: data.values
                    }, true);
                }
                break;

            case 'clear':
                return this.request({
                    action: 'clear',
                    cmd: 'C',
                    rule_type: 'A'
                }, true);

            default:
                return this.request(payload, true);
        }

        return this.request(payload, true);
    }

    public async syncRules(): Promise<void> {
        try {
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
                const ipPayload = { type: "ip", mode: "blacklist", values: [...ips] };
                jobs.push(this.sendRule(ipPayload, "add").catch(err => {
                    console.warn(`[PolicyDispatcher] Failed to sync IPs: ${err.message}`);
                }));
            }

            if (ports.length > 0) {
                const portPayload = { type: "port", mode: "blacklist", values: [...ports] };
                jobs.push(this.sendRule(portPayload, "add").catch(err => {
                    console.warn(`[PolicyDispatcher] Failed to sync ports: ${err.message}`);
                }));
            }

            await Promise.all(jobs);
            console.info("[PolicyDispatcher] syncRules completed");
        } catch (err: any) {
            console.warn(`[PolicyDispatcher] syncRules failed (kernel module may not be running): ${err.message}`);
        }
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
