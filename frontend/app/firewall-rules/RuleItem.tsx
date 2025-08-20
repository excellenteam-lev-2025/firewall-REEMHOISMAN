// components/RuleItem.tsx
"use client";
import { Rule } from "@/api/types";

interface RuleItemProps {
    rule: Rule;
    onToggle: (rule: Rule) => void;
    onDelete: (rule: Rule) => void;
}

const RuleItem = ({ rule, onToggle, onDelete }: RuleItemProps) => {
    return (
        <div className="group flex items-center justify-between p-4 bg-white/80 rounded-lg border border-zinc-200/50 shadow-sm hover:shadow-md hover:bg-white transition-all duration-200">
            <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Status indicator */}
                <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    rule.active ? 'bg-green-500' : 'bg-gray-400'
                }`}></div>

                {/* Rule content */}
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                    <span className="font-mono text-sm text-zinc-800 truncate">
                        {rule.value}
                    </span>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            rule.mode === 'blacklist'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                        }`}>
                            {rule.mode === 'blacklist' ? '🚫 Block' : '✅ Allow'}
                        </span>
                        <span className="text-xs text-zinc-500 capitalize">
                            {rule.type}
                        </span>
                    </div>
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-200">
                <button
                    onClick={() => onToggle(rule)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors duration-200 ${
                        rule.active
                            ? 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                    title={rule.active ? 'Deactivate rule' : 'Activate rule'}
                >
                    {rule.active ? 'Disable' : 'Enable'}
                </button>

                <button
                    onClick={() => onDelete(rule)}
                    className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md text-xs font-medium hover:bg-red-200 transition-colors duration-200"
                    title="Delete rule"
                >
                    Delete
                </button>
            </div>
        </div>
    );
};

export default RuleItem;