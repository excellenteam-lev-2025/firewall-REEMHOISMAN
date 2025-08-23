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


export type TabKey =
    | "overview"
    | "kernelModules"
    | "firewallRules"
    | "apiInterface"
    | "logsAndTesting"
    | "settings";

export const TABS: { key: TabKey; label: string; href: string }[] = [
    { key: "overview",       label: "Overview",        href: "/" },
    { key: "kernelModules",  label: "Kernel Modules",  href: "/kernel-modules" },
    { key: "firewallRules",  label: "Firewall Rules",  href: "/firewall-rules" },
    { key: "apiInterface",   label: "API Interface",   href: "/api-interface" },
    { key: "logsAndTesting", label: "Logs & Testing",  href: "/logs-and-testing" },
];
