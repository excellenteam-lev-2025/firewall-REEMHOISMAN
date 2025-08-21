import { Rule, ApiRulesResponse } from './types';
import {ENV} from '@/config/env'

// Simple API helper
const api = async (url: string, options: RequestInit = {}) => {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        const data = await response.json();
        return response.ok ? { ok: true, data } : { ok: false, data: null };
    } catch {
        return { ok: false, data: null };
    }
};

// Fetch all rules
export const fetchRules = async (): Promise<ApiRulesResponse | null> => {
    const result = await api(`${ENV?.SERVER_BASE_URL}/api/firewall/rules`, { cache: 'no-store' });
    console.log(result.data)
    return result.ok ? result.data : null;
};

// Toggle rule active state
export const toggleRule = async (rule: Rule): Promise<boolean> => {
    const newActiveState = !rule.active;
    const requestBody = {
        [rule.type + 's']: { ids: [rule.id], mode: rule.mode, active: newActiveState }
    };
    const result = await api('/api/firewall/rules', {
        method: 'PUT',
        body: JSON.stringify(requestBody)
    });
    return result.ok;
};

// Delete a rule
export const deleteRule = async (rule: Rule): Promise<boolean> => {
    const result = await api(`/api/firewall/${rule.type}`, {
        method: 'DELETE',
        body: JSON.stringify({
            values: [rule.value],
            mode: rule.mode
        })
    });
    return result.ok;
};

// Add a rule
export const addRule = async (
    type: 'ip' | 'url' | 'port',
    value: string,
    mode: 'blacklist' | 'whitelist'
): Promise<boolean> => {
    const result = await api(`/api/firewall/${type}`, {
        method: 'POST',
        body: JSON.stringify({
            values: [type === 'port' ? Number(value) : value],
            mode
        })
    });
    return result.ok;
};