// components/RulesAddition.tsx
"use client";
import React, { useState } from "react";
import { useFirewallRules } from "@/hooks/useFirewallRules";

const RulesAddition: React.FC = () => {
    const [value, setValue] = useState("");
    const [type, setType] = useState<"ip" | "url" | "port">("ip");
    const [mode, setMode] = useState<"blacklist" | "whitelist">("blacklist");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { addRule, error } = useFirewallRules([]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value || isSubmitting) return;

        setIsSubmitting(true);
        const success = await addRule(type, value, mode);

        if (success) {
            setValue("");
        }
        setIsSubmitting(false);
    };

    const typeIcons = {
        ip: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
        ),
        url: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        ),
        port: (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )
    };

    return (
        <div className="rounded-xl bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-200 p-6 shadow-lg border border-zinc-300/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-950 text-xl tracking-wide">Add New Rule</h3>
            </div>

            {error && (
                <div className="rounded-lg bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-red-800 font-medium">Error: {error}</p>
                        </div>
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                            {typeIcons[type]}
                            Rule Type
                        </label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as "ip" | "url" | "port")}
                            className="w-full rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 bg-white/80 border border-zinc-300/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                        >
                            <option value="ip">🌐 IP Address</option>
                            <option value="port">🔌 Port</option>
                            <option value="url">🔗 URL</option>
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${mode === 'blacklist' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            Rule Mode
                        </label>
                        <select
                            value={mode}
                            onChange={(e) => setMode(e.target.value as "blacklist" | "whitelist")}
                            className="w-full rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 bg-white/80 border border-zinc-300/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                        >
                            <option value="blacklist">🚫 Blacklist (Block)</option>
                            <option value="whitelist">✅ Whitelist (Allow)</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Value</label>
                    <input
                        type="text"
                        placeholder={`Enter ${type === 'ip' ? 'IP address (e.g., 192.168.1.1)' : type === 'url' ? 'URL (e.g., example.com)' : 'port number (e.g., 8080)'}`}
                        value={value}
                        onChange={(e) => setValue(e.target.value.trim())}
                        className="w-full rounded-lg px-4 py-3 text-sm font-medium text-zinc-700 bg-white/80 border border-zinc-300/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400/50 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
                        disabled={isSubmitting}
                    />
                </div>

                <button
                    type="submit"
                    disabled={!value || isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white bg-zinc-700 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                    {isSubmitting ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Adding...
                        </>
                    ) : (
                        <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Add Rule
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default RulesAddition;