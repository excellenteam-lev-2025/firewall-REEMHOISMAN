// components/FirewallRules.tsx
import RulesAddition from "./RulesAddition";
import ExistingRules from "./ExistingRules";

const FirewallRules = () => (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-4">
        <div className="rounded-2xl bg-white/95 p-8 shadow-xl border border-zinc-200/50 backdrop-blur-sm">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-zinc-950">Firewall Rules</h2>
                    <p className="text-zinc-600 mt-1">Manage your network security rules and configurations</p>
                </div>
            </div>

            <div className="space-y-8">
                <RulesAddition />
                <ExistingRules />
            </div>
        </div>
    </div>
);

export default FirewallRules;