"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Users, FileText, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type ServiceNode = {
    id: string;
    label: string;
    icon: React.ElementType;
    x: number;
    y: number;
    color: string;
};

const NODES: ServiceNode[] = [
    { id: 'user-db', label: 'User DB', icon: Users, x: 10, y: 20, color: 'text-blue-500' },
    { id: 'post-db', label: 'Post DB', icon: Database, x: 10, y: 70, color: 'text-green-500' },
    { id: 'feed-service', label: 'Feed Service', icon: Zap, x: 50, y: 45, color: 'text-yellow-500' },
    { id: 'cache-1', label: 'Cache (Friend A)', icon: FileText, x: 90, y: 20, color: 'text-purple-500' },
    { id: 'cache-2', label: 'Cache (Friend B)', icon: FileText, x: 90, y: 70, color: 'text-purple-500' },
];

export default function FeedArchitect() {
    const [activeFlow, setActiveFlow] = useState<'idle' | 'fanout'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    const triggerFanout = () => {
        if (activeFlow !== 'idle') return;
        setActiveFlow('fanout');
        setLogs(['New post created...', 'Looking up friends...', 'Pushing to caches...']);

        const tId = setTimeout(() => {
            setLogs(prev => [...prev, 'Fan-out complete!']);
            setActiveFlow('idle');
        }, 4000);
        timeoutIds.current.add(tId);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-blue-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-blue-500" />
                                Feed Architecture (Fan-out on Write)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualize how a new post propagates to friends' feed caches.
                            </p>
                        </div>
                        <Button onClick={triggerFanout} disabled={activeFlow !== 'idle'}>
                            {activeFlow === 'idle' ? 'Simulate New Post' : 'Processing...'}
                        </Button>
                    </div>

                    <div className="relative h-[300px] w-full bg-slate-950/50 rounded-xl border border-border overflow-hidden">

                        {/* Connection Lines (Static for now, could be SVG) */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                            <line x1="15%" y1="25%" x2="50%" y2="45%" stroke="currentColor" strokeWidth="2" />
                            <line x1="15%" y1="75%" x2="50%" y2="45%" stroke="currentColor" strokeWidth="2" />
                            <line x1="50%" y1="45%" x2="90%" y2="25%" stroke="currentColor" strokeWidth="2" />
                            <line x1="50%" y1="45%" x2="90%" y2="75%" stroke="currentColor" strokeWidth="2" />
                        </svg>

                        {/* Nodes */}
                        {NODES.map(node => (
                            <div
                                key={node.id}
                                className="absolute flex flex-col items-center gap-2 -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${node.x}%`, top: `${node.y}%` }}
                            >
                                <div className={`p-3 rounded-lg bg-background border border-border shadow-lg ${node.color}`}>
                                    <node.icon className="h-6 w-6" />
                                </div>
                                <span className="text-xs font-mono font-bold bg-background/50 px-2 py-1 rounded">
                                    {node.label}
                                </span>
                            </div>
                        ))}

                        {/* Moving Packets */}
                        <AnimatePresence>
                            {activeFlow === 'fanout' && (
                                <>
                                    {/* Step 1: Post DB -> Feed Service */}
                                    <motion.div
                                        initial={{ left: '15%', top: '75%', opacity: 0 }}
                                        animate={{ left: '50%', top: '45%', opacity: 1 }}
                                        transition={{ duration: 1, ease: 'linear' }}
                                        className="absolute z-10 p-1.5 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] -translate-x-1/2 -translate-y-1/2"
                                    >
                                        <FileText className="h-3 w-3 text-white" />
                                    </motion.div>

                                    {/* Step 2: Feed Service -> Caches */}
                                    <motion.div
                                        initial={{ left: '50%', top: '45%', opacity: 0 }}
                                        animate={{ left: '90%', top: '25%', opacity: 1 }}
                                        transition={{ delay: 1, duration: 1, ease: 'linear' }}
                                        className="absolute z-10 p-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] -translate-x-1/2 -translate-y-1/2"
                                    >
                                        <ArrowRight className="h-3 w-3 text-white" />
                                    </motion.div>
                                    <motion.div
                                        initial={{ left: '50%', top: '45%', opacity: 0 }}
                                        animate={{ left: '90%', top: '75%', opacity: 1 }}
                                        transition={{ delay: 1, duration: 1, ease: 'linear' }}
                                        className="absolute z-10 p-1.5 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] -translate-x-1/2 -translate-y-1/2"
                                    >
                                        <ArrowRight className="h-3 w-3 text-white" />
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>

                    </div>

                    <div className="h-24 bg-black/80 rounded-lg p-3 font-mono text-xs text-green-400 overflow-y-auto border border-green-900/30">
                        {logs.map((log, i) => (
                            <div key={i} className="mb-1">&gt; {log}</div>
                        ))}
                        {activeFlow === 'idle' && logs.length === 0 && (
                            <div className="text-muted-foreground animate-pulse">&gt; System ready. Waiting for events...</div>
                        )}
                    </div>

                </div>
            </Card>
        </div>
    );
}
