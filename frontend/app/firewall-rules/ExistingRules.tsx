// components/ExistingRules.tsx
import RulesList from './RulesList';
import { fetchRules } from '@/api/rules';

const ExistingRules = async () => {
    const data = await fetchRules();

    if (!data) {
        return (
            <div className="bg-white rounded-lg p-6 shadow-md border">
                <div className="text-center py-8">
                    <div className="text-red-500 text-4xl mb-2">⚠️</div>
                    <p className="text-gray-600">Failed to load rules</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg p-6 shadow-md border">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <span className="w-6 h-6 bg-gray-500 rounded text-white text-center text-sm">✓</span>
                Existing Rules
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                    <h4 className="font-medium mb-3 text-blue-600 border-b pb-2">IP Addresses</h4>
                    <RulesList typeRules={data.ips} type="ip" />
                </div>
                <div>
                    <h4 className="font-medium mb-3 text-green-600 border-b pb-2">URLs</h4>
                    <RulesList typeRules={data.urls} type="url" />
                </div>
                <div>
                    <h4 className="font-medium mb-3 text-purple-600 border-b pb-2">Ports</h4>
                    <RulesList typeRules={data.ports} type="port" />
                </div>
            </div>
        </div>
    );
};

export default ExistingRules;