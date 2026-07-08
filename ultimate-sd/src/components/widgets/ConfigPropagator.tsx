"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ServiceInstance = {
    id: string;
    version: string;
    config: { [key: string]: boolean };
    status: 'syncing' | 'healthy' | 'outdated';
};

export default function ConfigPropagator() {
    const [configVersion, setConfigVersion] = useState(1);
    const [featureFlag, setFeatureFlag] = useState(false);
    const [instances, setInstances] = useState<ServiceInstance[]>([
        { id: 'Service-A', version: 'v1', config: { feature_x: false }, status: 'healthy' },
        { id: 'Service-B', version: 'v1', config: { feature_x: false }, status: 'healthy' },
        { id: 'Service-C', version: 'v1', config: { feature_x: false }, status: 'healthy' },
        { id: 'Service-D', version: 'v1', config: { feature_x: false }, status: 'healthy' },
    ]);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    const updateConfig = () => {
        const nextVersion = configVersion + 1;
        const nextFlag = !featureFlag;

        setConfigVersion(nextVersion);
        setFeatureFlag(nextFlag);

        // Trigger propagation simulation
        setInstances(prev => prev.map(inst => ({ ...inst, status: 'outdated' })));

        // Simulate staggered rollout
        instances.forEach((_, index) => {
            const tId = setTimeout(() => {
                setInstances(prev => prev.map((inst, i) => {
                    if (i === index) {
                        return {
                            ...inst,
                            version: `v${nextVersion}`,
                            config: { feature_x: nextFlag },
                            status: 'healthy'
                        };
                    }
                    return inst;
                }));
            }, 1000 + (index * 800)); // Stagger updates
            timeoutIds.current.add(tId);
        });
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-slate-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Settings className="h-5 w-5 text-slate-500" />
                                Config Management
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Dynamic updates without restart. Version: v{configVersion}
                            </p>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-900 p-2 rounded-lg border">
                            <div className="text-xs font-mono flex items-center gap-2">
                                <span>feature_x:</span>
                                <Badge variant={featureFlag ? "default" : "secondary"} className={featureFlag ? "bg-green-600" : ""}>
                                    {featureFlag.toString()}
                                </Badge>
                            </div>
                            <Button size="sm" onClick={updateConfig} className="h-7 text-xs gap-1">
                                <RefreshCw className="h-3 w-3" />
                                Push Update
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {instances.map(inst => (
                            <div key={inst.id} className="relative group">
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`
                          p-4 rounded-lg border-l-4 shadow-sm flex justify-between items-center
                          ${inst.status === 'outdated' ? 'border-yellow-500 bg-yellow-500/5' :
                                            inst.config.feature_x ? 'border-green-500 bg-green-500/5' : 'border-slate-300 bg-slate-50 dark:bg-slate-900'}
                       `}
                                >
                                    <div>
                                        <div className="flex items-center gap-2 font-bold text-xs">
                                            <Server className="h-3 w-3 text-slate-400" />
                                            {inst.id}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                                            Config: v{inst.version.replace('v', '')}
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-1">
                                        <Badge variant="outline" className="text-[9px] h-5">
                                            feature_x: {inst.config.feature_x.toString()}
                                        </Badge>
                                        {inst.status === 'outdated' && (
                                            <div className="flex items-center gap-1 text-[9px] text-yellow-600 animate-pulse">
                                                <RefreshCw className="h-3 w-3 animate-spin" />
                                                Syncing...
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        ))}
                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-2">
                        Updates propagate to instances eventually. Some systems use "Push" (ZooKeeper/etcd watch) while others use "Pull" (periodic polling).
                    </div>

                </div>
            </Card>
        </div>
    );
}
