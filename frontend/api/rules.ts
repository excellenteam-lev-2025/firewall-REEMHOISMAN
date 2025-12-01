import { ENV } from '@/config/env';
import { Rule, ApiRulesResponse } from './types';

const api = async (url: string, options: RequestInit = {}) => {
    try {
        const response = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        
        if (!response.ok) {
            let errorMessage = `Request failed with status ${response.status}`;
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
            }
            
            return { ok: false, data: null, error: errorMessage };
        }
        
        const data = await response.json();
        return { ok: true, data, error: null };
    } catch (error) {
        return { ok: false, data: null, error: 'Network error or server is not responding' };
    }
};

export const fetchRules = async (type?: 'ips' | 'urls' | 'ports'): Promise<{ data: ApiRulesResponse | null; error: string | null }> => {
    const url = type 
        ? `/api/firewall/rules?type=${type}`
        : `/api/firewall/rules`;
    const result = await api(url, { cache: 'no-store' });
    return { data: result.ok ? result.data : null, error: result.error };
};

export const toggleRule = async (rule: Rule): Promise<{ success: boolean; error: string | null }> => {
    const body = {
        urls: rule.type === "url"
            ? { ids: [rule.id], mode: rule.mode, active: !rule.active }
            : {},
        ports: rule.type === "port"
            ? { ids: [rule.id], mode: rule.mode, active: !rule.active }
            : {},
        ips: rule.type === "ip"
            ? { ids: [rule.id], mode: rule.mode, active: !rule.active }
            : {},
    };
    const result = await api(`/api/firewall/rules`, {
        method: 'PUT',
        body: JSON.stringify(body),
        headers: { 'Content-Type': 'application/json' }
    });
    return { success: result.ok, error: result.error };
};

export const deleteRule = async (rule: Rule): Promise<{ success: boolean; error: string | null }> => {
    const result = await api(`/api/firewall/${rule.type}`, {
        method: 'DELETE',
        body: JSON.stringify({
            values: [rule.type === 'port' ? Number(rule.value) : rule.value],
            mode: rule.mode
        })
    });
    return { success: result.ok, error: result.error };
};

export const addRule = async (
    type: 'ip' | 'url' | 'port',
    value: string,
    mode: 'blacklist' | 'whitelist'
): Promise<{ success: boolean; error: string | null }> => {
    const result = await api(`/api/firewall/${type}`, {
        method: 'POST',
        body: JSON.stringify({
            values: type === 'port' ? [Number(value)] : [value],
            mode
        })
    });
    return { success: result.ok, error: result.error };
};
