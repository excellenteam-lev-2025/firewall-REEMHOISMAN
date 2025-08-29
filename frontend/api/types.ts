export type Rule = {
    id: number;
    type: "ip" | "port" | "url";
    value: string;
    mode: "blacklist" | "whitelist";
    active: boolean;
};

export type ApiRulesResponse = {
    ips: {
        blacklist: Array<{ id: number; value: string; active: boolean }>;
        whitelist: Array<{ id: number; value: string; active: boolean }>;
    };
    urls: {
        blacklist: Array<{ id: number; value: string; active: boolean }>;
        whitelist: Array<{ id: number; value: string; active: boolean }>;
    };
    ports: {
        blacklist: Array<{ id: number; value: number; active: boolean }>;
        whitelist: Array<{ id: number; value: number; active: boolean }>;
    };
};

export type RuleType = "ip" | "port" | "url";
export type RuleMode = "blacklist" | "whitelist";

export interface RulesListProps {
    typeRules: {
        blacklist: Array<{ id: number; value: number | string; active: boolean }>;
        whitelist: Array<{ id: number; value: number | string; active: boolean }>;
    };
    type: RuleType;
}

export interface RuleItemProps {
    rule: Rule;
    onToggle: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
}
