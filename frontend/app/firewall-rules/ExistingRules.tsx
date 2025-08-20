// components/ExistingRules.tsx
import RulesList from './RulesList';
import { fetchRules } from '@/api/rules.ts';

const ExistingRules = async () => {
    const data = await fetchRules();

    if (!data) {
        return (
            <div className="rounded-xl bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-200 p-6 shadow-lg border border-zinc-300/50">
                <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <p className="text-zinc-700 font-medium">Failed to load rules</p>
                </div>
            </div>
        );
    }

    return (
        <div className="rounded-xl bg-gradient-to-br from-zinc-200 via-zinc-300 to-zinc-200 p-6 shadow-lg border border-zinc-300/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-zinc-600 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                </div>
                <h3 className="font-bold text-zinc-950 text-xl tracking-wide">Existing Rules</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-400/30">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="font-semibold text-zinc-800 text-lg">IP Addresses</h4>
                    </div>
                    <RulesList typeRules={data.ips} type="ip" />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-400/30">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <h4 className="font-semibold text-zinc-800 text-lg">URLs</h4>
                    </div>
                    <RulesList typeRules={data?.urls} type="url" />
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-zinc-400/30">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <h4 className="font-semibold text-zinc-800 text-lg">Ports</h4>
                    </div>
                    <RulesList typeRules={data?.ports} type="port" />
                </div>
            </div>
        </div>
    );
};

export default ExistingRules;