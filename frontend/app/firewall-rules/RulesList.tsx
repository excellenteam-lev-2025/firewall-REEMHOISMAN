"use client";
import RuleItem from "./RuleItem";
import React, { useState } from "react";
import { toggleRule, deleteRule } from "@/api/rules";

interface Rule {
    id: number;
    value: any;
    active: boolean;
    mode: 'blacklist' | 'whitelist';
    type: 'ip' | 'url' | 'port';
}

interface RulesListProps {
    typeRules: {
        blacklist: Array<{ id: number; value: any; active: boolean }>;
        whitelist: Array<{ id: number; value: any; active: boolean }>;
    };
    type: 'ip' | 'url' | 'port';
}

const RulesList: React.FC<RulesListProps> = ({ typeRules, type }) => {
    if (!typeRules) {
        return (
            <div className="h-64 border rounded-lg bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Failed to load rules</p>
            </div>
        );
    }

    const initialRules: Rule[] = [
    ...typeRules.blacklist.map(rule => ({
        ...rule,
        mode: "blacklist" as "blacklist",
        type,
        active: rule.active
    })),
    ...typeRules.whitelist.map(rule => ({
        ...rule,
        mode: "whitelist" as "whitelist",
        type,
        active: rule.active
    }))
];

    const [rules, setRules] = useState<Rule[]>(initialRules);

    const handleToggle = async (rule: Rule) => {
        const success = await toggleRule(rule);
        if (success) {
            setRules(rules =>
                rules.map(r =>
                    r.id === rule.id ? { ...r, active: !r.active } : r
                )
            );
        }
    };

    const handleDelete = async (rule: Rule) => {
        const success = await deleteRule(rule);
        if (success) {
            setRules(rules => rules.filter(r => r.id !== rule.id));
        }
    };

    if (rules.length === 0) {
        return (
            <div className="h-64 border rounded-lg bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-3xl mb-2">📝</div>
                    <p className="text-gray-600">No rules configured</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-64 border rounded-lg bg-gray-50 overflow-y-auto p-2 space-y-2">
            {rules.map((rule) => (
                <RuleItem
                    key={rule.id}
                    rule={rule}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                />
            ))}
        </div>
    );
};

export default RulesList;