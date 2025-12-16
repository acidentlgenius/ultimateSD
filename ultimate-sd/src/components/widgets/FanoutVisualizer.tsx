"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Users, User, Database, Send, Clock, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Strategy = 'push' | 'pull';

interface Tweet {
    id: string;
    content: string;
    timestamp: number;
}

interface Follower {
    id: number;
    isOnline: boolean;
    hasReceived: boolean;
}

export default function FanoutVisualizer() {
    const [strategy, setStrategy] = useState<Strategy>('push');
    const [followers, setFollowers] = useState<Follower[]>(
        Array.from({ length: 6 }, (_, i) => ({ id: i, isOnline: false, hasReceived: false }))
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [metrics, setMetrics] = useState({ writeLatency: 0, readLatency: 0 });
    const [logs, setLogs] = useState<string[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setFollowers(prev => prev.map(f => ({ ...f, isOnline: Math.random() > 0.3 })));
    }, []);

    if (!mounted) return null; // or a loading skeleton

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

    const resetSimulation = () => {
        setFollowers(prev => prev.map(f => ({ ...f, hasReceived: false })));
        setIsProcessing(false);
        setMetrics({ writeLatency: 0, readLatency: 0 });
        setLogs([]);
    };

    const simulateTweet = async () => {
        if (isProcessing) return;
        resetSimulation();
        setIsProcessing(true);

        if (strategy === 'push') {
            // Fan-out on Write
            addLog('🚀 User posts tweet...');
            await new Promise(r => setTimeout(r, 500));

            const start = Date.now();
            addLog(`📡 Fan-out to ${followers.length} followers...`);

            // Simulate sequential/parallel writes
            for (let i = 0; i < followers.length; i++) {
                await new Promise(r => setTimeout(r, 300)); // Simulate write latency per follower
                setFollowers(prev => {
                    const newFollowers = [...prev];
                    newFollowers[i] = { ...newFollowers[i], hasReceived: true };
                    return newFollowers;
                });
            }

            const end = Date.now();
            const latency = end - start;
            setMetrics({ writeLatency: latency, readLatency: 10 }); // Fast reads later
            addLog(`✅ Fan-out complete in ${latency}ms`);
            addLog('👀 Followers see tweet instantly on load (Pre-computed)');
        } else {
            // Fan-out on Read (Pull)
            addLog('🚀 User posts tweet...');
            const start = Date.now();
            await new Promise(r => setTimeout(r, 500)); // Single write to DB

            const writeLatency = Date.now() - start;
            addLog(`💾 Tweet saved to DB in ${writeLatency}ms`);

            // Simulate followers coming online and pulling
            addLog('⏳ Waiting for followers to refresh feed...');
            await new Promise(r => setTimeout(r, 800));

            const readStart = Date.now();
            setFollowers(prev => prev.map(f => ({ ...f, hasReceived: true })));
            const readLatency = 500 + (followers.length * 50); // Complex query
            setMetrics({ writeLatency: writeLatency, readLatency });

            addLog(`📉 Followers pull feed (High Read Latency: ${readLatency}ms)`);
        }

        setIsProcessing(false);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Controls */}
                    <div className="md:w-1/3 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Fan-out Strategy
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Simulate how tweets are delivered to followers.
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button
                                variant={strategy === 'push' ? 'default' : 'outline'}
                                onClick={() => { setStrategy('push'); resetSimulation(); }}
                                disabled={isProcessing}
                                className="justify-start"
                            >
                                <div className="text-left">
                                    <div className="font-semibold">Push Model</div>
                                    <div className="text-[10px] opacity-80">Fan-out on Write (Pre-compute)</div>
                                </div>
                            </Button>
                            <Button
                                variant={strategy === 'pull' ? 'default' : 'outline'}
                                onClick={() => { setStrategy('pull'); resetSimulation(); }}
                                disabled={isProcessing}
                                className="justify-start"
                            >
                                <div className="text-left">
                                    <div className="font-semibold">Pull Model</div>
                                    <div className="text-[10px] opacity-80">Fan-out on Read (On-demand)</div>
                                </div>
                            </Button>
                        </div>

                        {metrics.writeLatency > 0 && (
                            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Write Latency:</span>
                                    <span className={`font-mono font-bold ${strategy === 'push' ? 'text-red-500' : 'text-green-500'}`}>
                                        {metrics.writeLatency}ms
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Read Latency:</span>
                                    <span className={`font-mono font-bold ${strategy === 'push' ? 'text-green-500' : 'text-red-500'}`}>
                                        {metrics.readLatency}ms
                                    </span>
                                </div>
                                <div className="text-[10px] italic text-muted-foreground mt-2 border-t pt-2">
                                    {strategy === 'push'
                                        ? "Heavy load on poster's write. Fast reads for users."
                                        : "Fast posting. Heavy load on viewing (database reads)."
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Viz Area */}
                    <div className="md:w-2/3 space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-full bg-primary/20">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                                <div className="font-semibold">Celebrity User</div>
                            </div>

                            <AnimatePresence>
                                {isProcessing && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                    >
                                        <ArrowRight className="h-6 w-6 text-muted-foreground animate-pulse" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="flex items-center gap-2">
                                <div className="p-2 rounded-full bg-secondary/20">
                                    <Database className="h-6 w-6 text-secondary-foreground" />
                                </div>
                                <div className="font-semibold">{strategy === 'push' ? 'Follower Timelines' : 'Global Tweets DB'}</div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4 rounded-xl bg-muted/20 min-h-[160px]">
                            {followers.map((f) => (
                                <motion.div
                                    key={f.id}
                                    initial={false}
                                    animate={{
                                        backgroundColor: f.hasReceived ? 'var(--primary)' : 'transparent',
                                        color: f.hasReceived ? 'white' : 'inherit',
                                        scale: f.hasReceived ? 1.05 : 1
                                    }}
                                    className={`p-3 rounded-lg border-2 flex items-center gap-3 transition-colors ${f.hasReceived
                                        ? 'border-primary'
                                        : 'border-border bg-background'
                                        }`}
                                >
                                    <Users className={`h-4 w-4 ${f.hasReceived ? 'text-white' : 'text-muted-foreground'}`} />
                                    <div className="flex flex-col">
                                        <span className="font-medium text-xs">Follower #{f.id + 1}</span>
                                        <span className="text-[10px] opacity-70">{f.hasReceived ? 'Feed Updated' : 'Waiting...'}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="flex justify-end">
                            <Button onClick={simulateTweet} disabled={isProcessing} size="lg" className="w-full md:w-auto">
                                <Send className="h-4 w-4 mr-2" />
                                {isProcessing ? 'Processing...' : 'Post Tweet'}
                            </Button>
                        </div>

                        {/* Logs */}
                        <div className="h-24 overflow-y-auto rounded-lg bg-black/80 text-green-400 p-3 font-mono text-xs space-y-1">
                            {logs.length === 0 && <span className="opacity-50">System ready. Waiting for tweet...</span>}
                            {logs.map((log, i) => (
                                <div key={i} className="flex gap-2">
                                    <span className="opacity-50">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
