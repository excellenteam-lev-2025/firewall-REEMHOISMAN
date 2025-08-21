// components/RuleItem.tsx
"use client";
import { Rule } from "@/api/types";

interface RuleItemProps {
    rule: Rule;
    onToggle: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
}

const RuleItem = ({ rule, onToggle, onDelete }: RuleItemProps) => {
    const statusColor = rule.active ? 'bg-green-500' : 'bg-gray-400';
    const modeColor = rule.mode === 'blacklist' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';
    const modeIcon = rule.mode === 'blacklist' ? '🚫' : '✅';

    return (
        <div className="bg-white p-3 rounded-lg border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-3 h-3 rounded-full ${statusColor}`}></div>
                    <div className="min-w-0 flex-1">
                        <div className="font-mono text-sm truncate">{rule.value}</div>
                        <div className="flex gap-2 mt-1">
                            <span className={`px-2 py-1 rounded text-xs ${modeColor}`}>
                                {modeIcon} {rule.mode}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                {rule.type}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2 ml-3">
                    <button
                        onClick={() => onToggle(rule)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            rule.active
                                ? 'bg-gray-200 hover:bg-gray-300'
                                : 'bg-green-200 hover:bg-green-300'
                        }`}
                    >
                        {rule.active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                        onClick={() => onDelete(rule)}
                        className="px-3 py-1 bg-red-200 hover:bg-red-300 rounded text-xs font-medium transition-colors"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RuleItem;