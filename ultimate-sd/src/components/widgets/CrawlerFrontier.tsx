"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Link2, Ghost, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type QueueItem = {
    id: string;
    url: string;
    priority: number;
    domain: string;
};

export default function CrawlerFrontier() {
    const [queues, setQueues] = useState<Record<string, QueueItem[]>>({
        'High Priority': [],
        'Standard': [],
        'Politeness Wait': []
    });
    const [crawledCount, setCrawledCount] = useState(0);
    const [activeUrl, setActiveUrl] = useState<string | null>(null);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());

    const addSeed = () => {
        const domains = ['wikipedia.org', 'cnn.com', 'reddit.com', 'mit.edu'];
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const newItem = {
            id: Math.random().toString(36).substr(2, 5),
            url: `https://${domain}/page-${Math.floor(Math.random() * 100)}`,
            priority: domain.includes('edu') || domain.includes('wiki') ? 1 : 0,
            domain
        };

        setQueues(prev => {
            const key = newItem.priority === 1 ? 'High Priority' : 'Standard';
            return { ...prev, [key]: [...prev[key], newItem] };
        });
    };

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    // SQUASH: Root Cause: The setInterval was previously dependent on state variables (queues, activeUrl).
    // This caused the interval to clear and reset every time the state changed, leading to "interval starvation"
    // where the crawler loop would rarely execute its logic fully if state changed frequently.
    // SQUASH: Fix: Mirror the state in a useRef updated via a separate useEffect.
    // The setInterval now has an empty dependency array [], so it runs consistently,
    // and reads the latest state from stateRef.current.
    const stateRef = useRef({ queues, activeUrl });
    useEffect(() => {
        stateRef.current = { queues, activeUrl };
    }, [queues, activeUrl]);

    // Simulate Crawler Loop
    useEffect(() => {
        const interval = setInterval(() => {
            // 1. Pick URL (High Priority first)
            let nextItem: QueueItem | undefined;
            let sourceQueue = '';

            const currentQueues = stateRef.current.queues;
            const currentActiveUrl = stateRef.current.activeUrl;

            if (currentQueues['High Priority'].length > 0) {
                nextItem = currentQueues['High Priority'][0];
                sourceQueue = 'High Priority';
            } else if (currentQueues['Standard'].length > 0) {
                nextItem = currentQueues['Standard'][0];
                sourceQueue = 'Standard';
            }

            if (nextItem && !currentActiveUrl) {
                // Remove from queue
                setQueues(prev => ({
                    ...prev,
                    [sourceQueue]: prev[sourceQueue].slice(1)
                }));

                // Set active (Crawl)
                setActiveUrl(nextItem.url);

                // Finish Crawl after delay
                const timeoutId1 = setTimeout(() => {
                    setCrawledCount(c => c + 1);
                    setActiveUrl(null);

                    // Add extracted links (recursion sim)
                    if (Math.random() > 0.5) {
                        const newItem = {
                            id: Math.random().toString(36).substr(2, 5),
                            url: `${nextItem.url}/sub`,
                            priority: 0,
                            domain: nextItem.domain
                        };
                        // Enforce politeness (push to Wait queue briefly)
                        setQueues(prev => ({ ...prev, 'Politeness Wait': [...prev['Politeness Wait'], newItem] }));

                        const timeoutId2 = setTimeout(() => {
                            setQueues(prev => ({
                                ...prev,
                                'Politeness Wait': prev['Politeness Wait'].filter(i => i.id !== newItem.id),
                                'Standard': [...prev['Standard'], newItem]
                            }));
                            timeoutIds.current.delete(timeoutId2);
                        }, 2000);
                        timeoutIds.current.add(timeoutId2);
                    }

                    timeoutIds.current.delete(timeoutId1);
                }, 1500);
                timeoutIds.current.add(timeoutId1);
            }

        }, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-emerald-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Ghost className="h-5 w-5 text-emerald-500" />
                                URL Frontier
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Prioritize goodness. Enforce politeness.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge variant="outline" className="gap-1">
                                Crawled: {crawledCount}
                            </Badge>
                            <Button onClick={addSeed} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs">
                                Add Seed URL
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">

                        {/* Queues */}
                        <div className="flex flex-col gap-4">
                            <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                                    High Priority (Edu/Wiki)
                                    <span>{queues['High Priority'].length}</span>
                                </h4>
                                <div className="h-24 bg-muted/30 rounded border p-2 overflow-y-auto space-y-1">
                                    <AnimatePresence>
                                        {queues['High Priority'].map(item => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-1 rounded truncate border border-emerald-500/20"
                                            >
                                                {item.url}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                                    Standard Queue
                                    <span>{queues['Standard'].length}</span>
                                </h4>
                                <div className="h-24 bg-muted/30 rounded border p-2 overflow-y-auto space-y-1">
                                    <AnimatePresence>
                                        {queues['Standard'].map(item => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.8 }}
                                                className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded truncate border"
                                            >
                                                {item.url}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Processing Area */}
                        <div className="flex flex-col gap-4">

                            {/* Active Worker */}
                            <div className="flex-1 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg flex flex-col items-center justify-center relative bg-muted/10">
                                <div className="absolute top-2 left-2 text-[10px] font-bold text-muted-foreground">Worker 1</div>

                                <AnimatePresence mode="wait">
                                    {activeUrl ? (
                                        <motion.div
                                            key="active"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="flex flex-col items-center gap-2 p-4 bg-card shadow-lg rounded-lg border max-w-[90%]"
                                        >
                                            <Link2 className="h-6 w-6 text-emerald-500 animate-pulse" />
                                            <div className="text-[10px] font-mono break-all text-center">{activeUrl}</div>
                                            <Badge variant="secondary" className="text-[9px]">Extracting Links...</Badge>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-xs text-muted-foreground flex flex-col items-center gap-2"
                                        >
                                            <Clock className="h-6 w-6 text-slate-400" />
                                            Waiting for URL...
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Politeness Queue */}
                            <div className="h-20 border rounded-lg p-2 bg-orange-500/5 border-orange-200 dark:border-orange-900/50">
                                <h4 className="text-[10px] uppercase font-bold text-orange-600 mb-1 flex justify-between">
                                    Politeness Delay (2s)
                                    <span>{queues['Politeness Wait'].length}</span>
                                </h4>
                                <div className="flex gap-1 overflow-x-auto">
                                    <AnimatePresence>
                                        {queues['Politeness Wait'].map(item => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="h-6 w-6 bg-orange-100 dark:bg-orange-950 border border-orange-300 rounded flex items-center justify-center text-[8px] flex-shrink-0"
                                            >
                                                ⏱
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </div>

                        </div>

                    </div>

                </div>
            </Card>
        </div>
    );
}
