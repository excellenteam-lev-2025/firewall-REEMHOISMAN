import { Rule, ApiRulesResponse, RuleType, RuleMode } from './types';

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

// API Functions
export const fetchRules = async (): Promise<ApiRulesResponse | null> => {
    console.log('Fetching rules...');
  const result = await api('http://localhost:3001/api/firewall/rules', { cache: 'no-store' });
  return result.ok ? result.data : null;
};

// Note: addRule, deleteRule, and toggleRuleStatus functions are now handled by useFirewallRules hook