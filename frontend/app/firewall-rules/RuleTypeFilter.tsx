"use client";
import { useState } from 'react';
import { fetchRules, fetchIpRules, fetchUrlRules, fetchPortRules } from '@/api/rules';
import { ApiRulesResponse } from '@/api/types';
import RulesList from './RulesList';

type FilterType = 'all' | 'ips' | 'urls' | 'ports';

const RuleTypeFilter = () => {
    const [activeFilter, setActiveFilter] = useState<FilterType>('all');
    const [data, setData] = useState<ApiRulesResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFilterChange = async (filter: FilterType) => {
        setActiveFilter(filter);
        setLoading(true);
        setError(null);

        try {
            let result;
            switch (filter) {
                case 'ips':
                    result = await fetchIpRules();
                    break;
                case 'urls':
                    result = await fetchUrlRules();
                    break;
                case 'ports':
                    result = await fetchPortRules();
                    break;
                default:
                    result = await fetchRules();
            }

            if (result.error) {
                setError(result.error);
                setData(null);
            } else {
                setData(result.data);
            }
        } catch (err) {
            setError('Failed to fetch rules');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const renderFilteredRules = () => {
        if (loading) {
            return (
                <div className="text-center py-8">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <p className="mt-2 text-gray-600">Loading {activeFilter} rules...</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center py-8">
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <p className="text-red-500">{error}</p>
                </div>
            );
        }

        if (!data) {
            return null;
        }

        // Show filtered view based on active filter
        if (activeFilter === 'ips' && data.ips) {
            return (
                <div>
                    <h4 className="font-medium mb-3 text-blue-600 border-b pb-2">IP Addresses</h4>
                    <RulesList typeRules={data.ips} type="ip" />
                </div>
            );
        }

        if (activeFilter === 'urls' && data.urls) {
            return (
                <div>
                    <h4 className="font-medium mb-3 text-green-600 border-b pb-2">URLs</h4>
                    <RulesList typeRules={data.urls} type="url" />
                </div>
            );
        }

        if (activeFilter === 'ports' && data.ports) {
            return (
                <div>
                    <h4 className="font-medium mb-3 text-purple-600 border-b pb-2">Ports</h4>
                    <RulesList typeRules={data.ports} type="port" />
                </div>
            );
        }

        // Show all rules in the original layout
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                    <h4 className="font-medium mb-3 text-blue-600 border-b pb-2">IP Addresses</h4>
                    <RulesList typeRules={data.ips || { blacklist: [], whitelist: [] }} type="ip" />
                </div>
                <div>
                    <h4 className="font-medium mb-3 text-green-600 border-b pb-2">URLs</h4>
                    <RulesList typeRules={data.urls || { blacklist: [], whitelist: [] }} type="url" />
                </div>
                <div>
                    <h4 className="font-medium mb-3 text-purple-600 border-b pb-2">Ports</h4>
                    <RulesList typeRules={data.ports || { blacklist: [], whitelist: [] }} type="port" />
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white rounded-lg p-6 shadow-md border">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-500 rounded text-white text-center text-sm">✓</span>
                    Rules with Filter
                </h3>
                
                <div className="flex flex-wrap gap-2">
                    {([
                        { key: 'all', label: 'All', color: 'bg-gray-500' },
                        { key: 'ips', label: 'IPs', color: 'bg-blue-500' },
                        { key: 'urls', label: 'URLs', color: 'bg-green-500' },
                        { key: 'ports', label: 'Ports', color: 'bg-purple-500' }
                    ] as const).map(({ key, label, color }) => (
                        <button
                            key={key}
                            onClick={() => handleFilterChange(key)}
                            disabled={loading}
                            className={`px-3 py-1 text-sm rounded-lg text-white font-medium transition-colors ${
                                activeFilter === key 
                                    ? color 
                                    : 'bg-gray-300 hover:bg-gray-400'
                            } disabled:opacity-50`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {renderFilteredRules()}
        </div>
    );
};

export default RuleTypeFilter;
