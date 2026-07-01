"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Server, ShieldCheck, ShieldAlert, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ServerNode = {
    id: string;
    status: 'healthy' | 'unhealthy';
    load: number; // 0-100
};

type Request = {
    id: string;
    targetId: string;
};

export default function LoadBalancerVisualizer() {
    const [servers, setServers] = useState<ServerNode[]>([
        { id: 'S1', status: 'healthy', load: 0 },
        { id: 'S2', status: 'healthy', load: 0 },
        { id: 'S3', status: 'healthy', load: 0 },
    ]);
    const [requests, setRequests] = useState<Request[]>([]);
    const [algorithm, setAlgorithm] = useState<'round-robin' | 'random' | 'least-connections'>('round-robin');
    const [rrIndex, setRrIndex] = useState(0);

    const toggleHealth = (id: string) => {
        setServers(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === 'healthy' ? 'unhealthy' : 'healthy' } : s
        ));
    };

    const sendRequests = () => {
        // Generate 5 requests
        const newReqs: Request[] = [];
        let currentRr = rrIndex;
        // Create a working copy to track load changes within the batch
        const currentServers = servers.map(s => ({ ...s }));

        // Helper to get healthy servers from our working copy
        const getHealthy = () => currentServers.filter(s => s.status === 'healthy');
        const initialHealthyCount = getHealthy().length; // Optimization: status doesn't change in loop

        if (initialHealthyCount === 0) return; // Drop if all down

        for (let i = 0; i < 5; i++) {
            const healthy = getHealthy();
            let targetId = '';

            if (algorithm === 'random') {
                const r = healthy[Math.floor(Math.random() * healthy.length)];
                targetId = r.id;
            } else if (algorithm === 'round-robin') {
                const r = healthy[currentRr % healthy.length];
                targetId = r.id;
                currentRr++;
            } else if (algorithm === 'least-connections') {
                // Now uses the updated load from the current batch
                const sorted = [...healthy].sort((a, b) => a.load - b.load);
                targetId = sorted[0].id;
            }

            newReqs.push({ id: Math.random().toString(36).substr(2, 5), targetId });

            // Update local state immediately so next iteration sees the load increase
            const serverIndex = currentServers.findIndex(s => s.id === targetId);
            if (serverIndex !== -1) {
                currentServers[serverIndex].load = Math.min(100, currentServers[serverIndex].load + 15);
            }
        }

        // Apply all updates in a single render cycle
        setServers(currentServers);
        setRrIndex(currentRr);
        setRequests(prev => [...prev, ...newReqs]);

        // Cleanup requests after animation
        setTimeout(() => {
            setRequests(prev => prev.slice(5));
            // Decay load
            setServers(prev => prev.map(s => ({ ...s, load: Math.max(0, s.load - 10) })));
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-cyan-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-cyan-500" />
                                Load Balancer
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Route traffic based on health and load.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => setAlgorithm('round-robin')}
                                size="sm" variant={algorithm === 'round-robin' ? 'default' : 'outline'} className="text-xs"
                            >
                                Round Robin
                            </Button>
                            <Button
                                onClick={() => setAlgorithm('random')}
                                size="sm" variant={algorithm === 'random' ? 'default' : 'outline'} className="text-xs"
                            >
                                Random
                            </Button>
                            <Button
                                onClick={() => setAlgorithm('least-connections')}
                                size="sm" variant={algorithm === 'least-connections' ? 'default' : 'outline'} className="text-xs"
                            >
                                Least Conn
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] gap-8 items-center min-h-[200px]">

                        {/* Client / Traffic Source */}
                        <div className="flex flex-col items-center gap-2">
                            <Button onClick={sendRequests} size="lg" className="w-full bg-cyan-600 hover:bg-cyan-700">
                                Send Traffic (5 reqs)
                            </Button>
                        </div>

                        {/* LB Logic Visualization */}
                        <div className="flex flex-col items-center justify-center relative w-24">
                            <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-cyan-500 z-10">
                                <span className="text-[10px] font-bold text-cyan-500 text-center">LB</span>
                            </div>
                            {/* Visualizing requests passing through */}
                            <AnimatePresence>
                                {requests.map((r, i) => (
                                    <motion.div
                                        key={r.id}
                                        initial={{ x: -100, y: 0, opacity: 0 }}
                                        animate={{
                                            x: 100,
                                            y: servers.findIndex(s => s.id === r.targetId) * 60 - 60, // rough Y offset mapping 
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{ duration: 0.8, delay: i * 0.1 }}
                                        className="absolute w-3 h-3 bg-black dark:bg-white rounded-full shadow-sm z-20"
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Backend Servers */}
                        <div className="flex flex-col gap-4">
                            {servers.map(s => (
                                <div
                                    key={s.id}
                                    className={`
                      p-3 rounded-lg border transition-all duration-300 flex items-center gap-3 relative overflow-hidden
                      ${s.status === 'healthy' ? 'bg-card border-border' : 'bg-red-500/10 border-red-500/50'}
                    `}
                                >
                                    <div
                                        className="absolute bottom-0 left-0 h-1 bg-cyan-500 transition-all duration-500"
                                        style={{ width: `${s.load}%` }}
                                    />

                                    <Server className={`h-5 w-5 ${s.status === 'healthy' ? 'text-slate-500' : 'text-red-500'}`} />

                                    <div className="flex-1">
                                        <div className="font-bold text-xs flex justify-between">
                                            {s.id}
                                            <span className="font-mono">{s.load}% Load</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground uppercase">{s.status}</div>
                                    </div>

                                    <Button
                                        onClick={() => toggleHealth(s.id)}
                                        size="icon" variant="ghost" className="h-6 w-6"
                                        aria-label={s.status === 'healthy' ? `Mark server ${s.id} unhealthy` : `Mark server ${s.id} healthy`}
                                        title={s.status === 'healthy' ? "Healthy" : "Unhealthy"}
                                    >
                                        {s.status === 'healthy' ?
                                            <ShieldCheck className="h-4 w-4 text-green-500" /> :
                                            <ShieldAlert className="h-4 w-4 text-red-500" />
                                        }
                                    </Button>
                                </div>
                            ))}
                        </div>

                    </div>

                </div>
            </Card>
        </div>
    );
}
