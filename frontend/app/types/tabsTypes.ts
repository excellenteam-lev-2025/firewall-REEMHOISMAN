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
    { key: "settings",       label: "Settings",        href: "/settings" },
];
