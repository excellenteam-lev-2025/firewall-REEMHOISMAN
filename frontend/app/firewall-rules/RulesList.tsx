"use client";
import RuleItem from "./RuleItem";
import { Rule } from "@/api/types";
import { useFirewallRules } from "@/hooks/useFirewallRules";

interface RulesListProps {
    initialRules: Rule[];
}

export default function RulesList({ initialRules }: RulesListProps) {
    const { 
        rules, 
        deleteRule, 
        toggleRuleStatus, 
        loading, 
        error 
    } = useFirewallRules(initialRules);

    const toggleActive = async (id: number) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;
        
        const newActiveState = !rule.active;
        const success = await toggleRuleStatus(rule, newActiveState);
        
        if (!success) {
            console.error('Failed to toggle rule status');
        }
    };

    const handleDeleteRule = async (id: number) => {
        const rule = rules.find(r => r.id === id);
        if (!rule) return;
        
        const success = await deleteRule(rule);
        
        if (!success) {
            console.error('Failed to delete rule');
        }
    };

    return (
        <div className="rounded-lg bg-zinc-300 p-4 shadow-md">
            <h3 className="mb-4 font-bold text-zinc-950 text-lg">Existing Rules</h3>
            
            {error && (
                <div className="mb-4 rounded-md bg-red-100 p-3 text-red-800">
                    Error: {error}
                </div>
            )}
            
            {loading && (
                <div className="mb-4 rounded-md bg-blue-100 p-3 text-blue-800">
                    Processing...
                </div>
            )}
            
            <ul className="space-y-3">
                {rules.map((rule) => (
                    <RuleItem
                        key={rule.id}
                        rule={rule}
                        onToggleAction={toggleActive}
                        onDeleteAction={handleDeleteRule}
                    />
                ))}
            </ul>
            
            {rules.length === 0 && !loading && (
                <p className="text-center text-zinc-600 py-4">No rules configured</p>
            )}
        </div>
    );
}
