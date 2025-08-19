"use client";
import React, { useState } from "react";
import { RuleType, RuleMode } from "@/api/types";
import { useFirewallRules } from "@/hooks/useFirewallRules";

interface RulesAdditionProps {
    onRuleAdded?: () => void;
}

const RulesAddition: React.FC<RulesAdditionProps> = ({ onRuleAdded }) => {
    const [value, setValue] = useState("");
    const [type, setType] = useState<RuleType>("ip");
    const [mode, setMode] = useState<RuleMode>("blacklist");
    
    const { addRule, loading, error } = useFirewallRules();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!value.trim()) return;
        
        const success = await addRule(type, value, mode);
        
        if (success) {
            setValue("");
            onRuleAdded?.(); // Callback to parent component if needed
        }
    };

    return (
        <form onSubmit={handleSubmit} className="rounded-lg bg-zinc-300 p-4 shadow-md space-y-4">
            <h3 className="font-bold text-zinc-950 text-lg">Add New Rule</h3>
            
            {error && (
                <div className="rounded-md bg-red-100 p-3 text-red-800">
                    Error: {error}
                </div>
            )}
            
            <div className="flex gap-3">
                <select 
                    value={type}
                    onChange={(e) => setType(e.target.value as RuleType)}
                    disabled={loading}
                    className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="ip">IP</option>
                    <option value="port">Port</option>
                    <option value="url">URL</option>
                </select>

                <select 
                    value={mode}
                    onChange={(e) => setMode(e.target.value as RuleMode)}
                    disabled={loading}
                    className="rounded-md px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="blacklist">Blacklist</option>
                    <option value="whitelist">Whitelist</option>
                </select>
            </div>

            <input 
                type="text"
                placeholder={`Enter ${type}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                disabled={loading}
                required
                className="w-full rounded-md px-3 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button 
                type="submit" 
                disabled={loading || !value.trim()}
                className="rounded-md px-4 py-2 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 hover:text-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Adding...' : 'Add Rule'}
            </button>
        </form>
    );
}

export default RulesAddition
