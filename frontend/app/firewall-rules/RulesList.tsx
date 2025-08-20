// components/RulesList.tsx
"use client";
import RuleItem from "./RuleItem";
import React from "react";
import { useFirewallRules } from "@/hooks/useFirewallRules";

interface RulesListProps {
    typeRules: {
        blacklist: Array<{ id: number; value: any; active?: boolean }>;
        whitelist: Array<{ id: number; value: any; active?: boolean }>;
    };
    type: 'ip' | 'url' | 'port';
}

const RulesList: React.FC<RulesListProps> = ({ typeRules, type }) => {
    if (!typeRules) {
        return (
            <div className="h-80 rounded-lg bg-blue-50/80 border border-blue-200/50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 bg-zinc-300 rounded-full flex items-center justify-center mb-3 mx-auto">
                        <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-zinc-600 font-medium">Failed to load rules</p>
                </div>
            </div>
        );
    }

    // Add mode and type properties to rules
    const blacklistRules = typeRules.blacklist.map(rule => ({
        ...rule,
        mode: 'blacklist' as const,
        type,
        active: rule.active ?? true
    }));

    const whitelistRules = typeRules.whitelist.map(rule => ({
        ...rule,
        mode: 'whitelist' as const,
        type,
        active: rule.active ?? true
    }));

    const allRules = [...blacklistRules, ...whitelistRules];
    const { rules, toggleRule, deleteRule } = useFirewallRules(allRules);

    return (
        <div className="h-80 overflow-hidden rounded-lg bg-blue-50/30 border border-blue-200/40">
            {rules.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-200/50 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-blue-600 font-medium">No rules configured</p>
                        <p className="text-blue-500/70 text-sm mt-1">Add your first rule to get started</p>
                    </div>
                </div>
            ) : (
                <div className="h-full overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-blue-300/50 scrollbar-track-transparent">
                    {rules.map((rule, index) => (
                        <div
                            key={rule.id}
                            className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
                            style={{ animationDelay: `${index * 25}ms` }}
                        >
                            <RuleItem
                                rule={rule}
                                onToggle={toggleRule}
                                onDelete={deleteRule}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RulesList;