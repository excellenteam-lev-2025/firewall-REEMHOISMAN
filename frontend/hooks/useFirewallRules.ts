// hooks/useFirewallRules.ts
import { useState } from 'react';
import { Rule } from '@/api/types';

export const useFirewallRules = (initialRules: Rule[]) => {
    const [rules, setRules] = useState<Rule[]>(initialRules || []);

    const toggleRule = async (rule: Rule) => {
        const newActiveState = !rule.active;

        // Optimistic update
        setRules(prev => prev.map(r =>
            r.id === rule.id ? { ...r, active: newActiveState } : r
        ));

        const requestBody = {
            ips: rule.type === 'ip' ? { ids: [rule.id], mode: rule.mode, active: newActiveState } : {},
            urls: rule.type === 'url' ? { ids: [rule.id], mode: rule.mode, active: newActiveState } : {},
            ports: rule.type === 'port' ? { ids: [rule.id], mode: rule.mode, active: newActiveState } : {}
        };

        try {
            const response = await fetch(`/api/firewall/rules`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                // Revert on failure
                setRules(prev => prev.map(r =>
                    r.id === rule.id ? { ...r, active: !newActiveState } : r
                ));
                return false;
            }
            return true;
        } catch (err) {
            // Revert on error
            setRules(prev => prev.map(r =>
                r.id === rule.id ? { ...r, active: !newActiveState } : r
            ));
            return false;
        }
    };

    const deleteRule = async (rule: Rule) => {
        try {
            const response = await fetch(`/api/firewall/${rule.type}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    values: [rule.value],
                    mode: rule.mode
                })
            });

            if (response.ok) {
                setRules(prev => prev.filter(r => r.id !== rule.id));
                return true;
            }
            return false;
        } catch (err) {
            console.error('Failed to delete rule:', err);
            return false;
        }
    };

    const addRule = async (type: 'ip' | 'url' | 'port', value: string, mode: 'blacklist' | 'whitelist') => {
        try {
            const response = await fetch(`/api/firewall/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    values: [type === 'port' ? Number(value) : value],
                    mode
                })
            });

            return response.ok;
        } catch (err) {
            console.error('Failed to add rule:', err);
            return false;
        }
    };

    return {
        rules,
        toggleRule,
        deleteRule,
        addRule
    };
};