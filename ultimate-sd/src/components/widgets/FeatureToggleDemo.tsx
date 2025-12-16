import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { ToggleLeft, Users, CheckCircle, XCircle, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

const TOTAL_USERS = 20;

interface User {
    id: number;
    isEnabled: boolean;
}

const FeatureToggleDemo: React.FC = () => {
    const [rolloutPercentage, setRolloutPercentage] = useState(0);
    const [featureEnabled, setFeatureEnabled] = useState(false);

    // Deterministic rollout based on ID
    // If rollout is 30%, IDs 1-6 get it (assuming uniform distribution)
    const users: User[] = Array.from({ length: TOTAL_USERS }, (_, i) => ({
        id: i + 1,
        isEnabled: featureEnabled && ((i + 1) / TOTAL_USERS) * 100 <= rolloutPercentage
    }));

    return (
        <Card className="w-full max-w-4xl p-6 bg-slate-900 border-purple-500/30 shadow-2xl shadow-purple-500/10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-purple-500/20 rounded-xl border border-purple-500/30">
                        <ToggleLeft className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Feature Flag Dashboard</h2>
                        <p className="text-sm text-slate-400">Control feature rollout safely</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="text-sm font-medium text-slate-300">Master Switch</span>
                    <Switch
                        checked={featureEnabled}
                        onCheckedChange={setFeatureEnabled}
                        className="data-[state=checked]:bg-purple-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Controls */}
                <div className="space-y-6">
                    <div className="p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-white flex items-center gap-2">
                                <Settings className="w-4 h-4 text-purple-400" /> Rollout Strategy
                            </h3>
                            <span className="font-mono text-purple-300 text-lg font-bold">{rolloutPercentage}%</span>
                        </div>

                        <Slider
                            value={[rolloutPercentage]}
                            max={100}
                            step={5}
                            disabled={!featureEnabled}
                            onValueChange={([v]) => setRolloutPercentage(v)}
                            className={`py-4 ${!featureEnabled ? 'opacity-50' : ''}`}
                        />

                        <p className="text-xs text-slate-400 mt-2">
                            Percentage-based rollout. Typically uses a hash of User ID to determine eligibility consistently.
                            <br />
                            <code>hash(userId) % 100 &lt; targetPercentage</code>
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                            <span className="text-2xl font-bold text-green-400">
                                {users.filter(u => u.isEnabled).length}
                            </span>
                            <p className="text-xs text-green-300/70 uppercase font-semibold mt-1">Enabled Users</p>
                        </div>
                        <div className="p-4 bg-slate-800 border border-slate-700 rounded-lg text-center">
                            <span className="text-2xl font-bold text-slate-400">
                                {users.filter(u => !u.isEnabled).length}
                            </span>
                            <p className="text-xs text-slate-500 uppercase font-semibold mt-1">Disabled Users</p>
                        </div>
                    </div>
                </div>

                {/* User Grid */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-400" /> User Impact Replay
                        </h3>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1 text-green-400"><CheckCircle className="w-3 h-3" /> New Feature</span>
                            <span className="flex items-center gap-1 text-slate-500"><XCircle className="w-3 h-3" /> Legacy</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-5 gap-3">
                        {users.map((user) => (
                            <motion.div
                                key={user.id}
                                layout
                                className={`
                    aspect-square rounded-lg flex items-center justify-center font-mono text-xs border
                    ${user.isEnabled
                                        ? 'bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.2)]'
                                        : 'bg-slate-800 border-slate-700 text-slate-500'
                                    }
                  `}
                            >
                                U{user.id}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </Card>
    );
};

export default FeatureToggleDemo;
