"use client";
import React, { useState } from "react";
import { addRule } from "@/api/rules";
import { useRouter } from "next/navigation";
import { useToast, Toast } from "@/app/Toast";
import { RuleMode, RuleType } from "@/api/types";

const examples = { ip: "192.168.1.1", url: "example.com", port: "8080" };

interface RulesAdditionProps {
    onRuleAdded?: () => void;
}

const RulesAddition: React.FC<RulesAdditionProps> = ({ onRuleAdded }) => {
    const [value, setValue] = useState("");
    const [type, setType] = useState<RuleType>("ip");
    const [mode, setMode] = useState<RuleMode>("blacklist");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();
    const { showToast, toast, hideToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!value || isSubmitting) return;
        
        console.log('=== FORM SUBMIT STARTED ===');
        setIsSubmitting(true);
        
        console.log('Calling addRule with:', { type, value, mode });
        const result = await addRule(type, value, mode);
        console.log('addRule result:', result);
        
        if (result.success) {
            console.log('SUCCESS: Rule added');
            setValue("");
            showToast('Rule added successfully', 'success');
            if (onRuleAdded) {
                onRuleAdded();
            }
        } else {
            console.log('ERROR: Rule add failed:', result.error);
            showToast(result.error || 'Failed to add rule', 'error');
        }
        setIsSubmitting(false);
        console.log('=== FORM SUBMIT ENDED ===');
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg p-6 shadow-md border space-y-4"
        >
            <h3 className="text-xl font-semibold flex items-center gap-2 mb-2">
                <span className="w-6 h-6 bg-blue-500 rounded text-white text-center text-sm">+</span>
                Add New Rule
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-2">Type</label>
                    <select
                        value={type}
                        onChange={e => setType(e.target.value as typeof type)}
                        className="w-full p-3 border rounded-lg"
                    >
                        <option value="ip">IP Address</option>
                        <option value="url">URL</option>
                        <option value="port">Port</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-2">Mode</label>
                    <select
                        value={mode}
                        onChange={e => setMode(e.target.value as typeof mode)}
                        className="w-full p-3 border rounded-lg"
                    >
                        <option value="blacklist">Blacklist (Block)</option>
                        <option value="whitelist">Whitelist (Allow)</option>
                    </select>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium mb-2">Value</label>
                <input
                    type="text"
                    placeholder={`Enter ${type} (e.g., ${examples[type]})`}
                    value={value}
                    onChange={e => setValue(e.target.value.trim())}
                    className="w-full p-3 border rounded-lg"
                    disabled={isSubmitting}
                />
            </div>
            <button
                type="submit"
                disabled={!value || isSubmitting}
                className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
            >
                {isSubmitting ? "Adding..." : "Add Rule"}
            </button>
            {toast && (
                <Toast 
                    message={toast.message} 
                    type={toast.type} 
                    onClose={hideToast} 
                />
            )}
        </form>
    );
};

export default RulesAddition;
