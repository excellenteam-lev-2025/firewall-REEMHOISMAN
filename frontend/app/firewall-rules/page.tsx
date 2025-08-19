import RulesAddition from "./RulesAddition";
import RulesList from "./RulesList";
import { fetchFirewallRules } from "@/server-api";

export default async function FirewallRules() {
    const rules = await fetchFirewallRules();
    
    return (
        <div className="mx-auto w-full max-w-4xl space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-md">
                <h2 className="text-2xl font-bold tracking-wide text-zinc-950 mb-6">Firewall Rules</h2>
                <div className="space-y-6">
                    <RulesAddition />
                    <RulesList initialRules={rules} />
                </div>
            </div>
        </div>
    );
}
