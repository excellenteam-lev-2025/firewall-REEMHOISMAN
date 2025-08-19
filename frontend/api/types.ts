export type Rule = {
    id: number;
    type: "ip" | "port" | "url";
    value: string;
    mode: "blacklist" | "whitelist";
    active: boolean;
};

export type ApiRulesResponse = {
    ips: {
        blacklist: Array<{ id: number; value: string }>;
        whitelist: Array<{ id: number; value: string }>;
    };
    urls: {
        blacklist: Array<{ id: number; value: string }>;
        whitelist: Array<{ id: number; value: string }>;
    };
    ports: {
        blacklist: Array<{ id: number; value: number }>;
        whitelist: Array<{ id: number; value: number }>;
    };
};

export type RuleType = "ip" | "port" | "url";
export type RuleMode = "blacklist" | "whitelist";
