import { Rule, ApiRulesResponse, RuleType, RuleMode } from './types';

// Simple API helper
const api = async (url: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    return { ok: response.ok, data: response.ok ? await response.json() : null };
  } catch {
    return { ok: false, data: null };
  }
};

// Transform API response
const transformRules = (data: ApiRulesResponse): Rule[] => {
  const rules: Rule[] = [];
  const add = (list: any[], type: RuleType, mode: RuleMode) => {
    list.forEach(rule => rules.push({
      id: rule.id,
      type,
      value: type === 'port' ? rule.value.toString() : rule.value,
      mode,
      active: true
    }));
  };

  add(data.ips.blacklist, 'ip', 'blacklist');
  add(data.ips.whitelist, 'ip', 'whitelist');
  add(data.urls.blacklist, 'url', 'blacklist');
  add(data.urls.whitelist, 'url', 'whitelist');
  add(data.ports.blacklist, 'port', 'blacklist');
  add(data.ports.whitelist, 'port', 'whitelist');

  return rules;
};

// API Functions
export const fetchRules = async (): Promise<Rule[]> => {
  const result = await api('/api/firewall/rules', { cache: 'no-store' });
  return result.ok ? transformRules(result.data) : [];
};

export const addRule = async (type: RuleType, value: string, mode: RuleMode): Promise<boolean> => {
  const result = await api(`/api/firewall/${type}`, {
    method: 'POST',
    body: JSON.stringify({
      values: [type === 'port' ? parseInt(value) : value],
      mode
    })
  });
  return result.ok;
};

export const deleteRule = async (rule: Rule): Promise<boolean> => {
  const result = await api(`/api/firewall/${rule.type}`, {
    method: 'DELETE',
    body: JSON.stringify({
      values: [rule.type === 'port' ? parseInt(rule.value) : rule.value],
      mode: rule.mode
    })
  });
  return result.ok;
};

export const toggleRuleStatus = async (rule: Rule, active: boolean): Promise<boolean> => {
  const payload = { ips: {}, urls: {}, ports: {} };
  const typeKey = rule.type === 'ip' ? 'ips' : rule.type === 'url' ? 'urls' : 'ports';
  payload[typeKey] = { ids: [rule.id], mode: rule.mode, active };

  const result = await api('/api/firewall/rules', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
  return result.ok;
};