"use client";
import RuleItem from "./RuleItem";
import React from "react";
import { toggleRule, deleteRule } from "@/api/rules";
import { useRouter } from "next/navigation";
import { useToast, Toast } from "@/app/Toast";
import { Rule, RulesListProps } from "@/api/types";

interface ExtendedRulesListProps extends RulesListProps {
    onRuleChange?: () => void;
}

const RulesList: React.FC<ExtendedRulesListProps> = ({ typeRules, type, onRuleChange }) => {
    const { showToast, toast, hideToast } = useToast();

    if (!typeRules) {
        return (
            <div className="h-64 border rounded-lg bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Failed to load rules</p>
            </div>
        );
    }

    const rules: Rule[] = [
        ...typeRules.blacklist.map(rule => ({...rule, value: String(rule.value),mode: "blacklist" as const, type})),
        ...typeRules.whitelist.map(rule => ({...rule, value: String(rule.value), mode: "whitelist" as const, type}))
    ];

    const handleToggle = async (rule: Rule) => {
        const { success, error } = await toggleRule(rule);
        if (success) {
            showToast(`Rule ${rule.active ? 'disabled' : 'enabled'} successfully`, 'success');
            if (onRuleChange) {
                onRuleChange();
            }
        } else {
            console.error('Toggle rule failed:', error);
            showToast(error || 'Failed to toggle rule', 'error');
        }
    };

    const handleDelete = async (rule: Rule) => {
        const { success, error } = await deleteRule(rule);
        if (success) {
            showToast('Rule deleted successfully', 'success');
            if (onRuleChange) {
                onRuleChange();
            }
        } else {
            console.error('Delete rule failed:', error);
            showToast(error || 'Failed to delete rule', 'error');
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
        <>
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
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={hideToast} 
                />
            )}
        </>
    );
};

export default RulesList;
