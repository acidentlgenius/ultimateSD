"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Database, Trash2, Clock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type CacheItem = {
    key: string;
    value: string;
    lastAccessed: number;
};

export default function CacheVisualizer() {
    const [cache, setCache] = useState<CacheItem[]>([]);
    const capacity = 3;
    const [keyInput, setKeyInput] = useState('');
    const [valInput, setValInput] = useState('');
    const [hitLog, setHitLog] = useState<string | null>(null);

    const put = () => {
        if (!keyInput || !valInput) return;

        const existingIndex = cache.findIndex(item => item.key === keyInput);
        const newCache = [...cache];

        if (existingIndex !== -1) {
            // Update existing
            newCache.splice(existingIndex, 1);
            newCache.unshift({ key: keyInput, value: valInput, lastAccessed: Date.now() });
            setHitLog(`Updated key '${keyInput}' (Moved to front)`);
        } else {
            // Insert new
            if (newCache.length >= capacity) {
                const evicted = newCache.pop(); // Evict LRU (last item)
                setHitLog(`Evicted key '${evicted?.key}' to make space for '${keyInput}'`);
            } else {
                setHitLog(`Added key '${keyInput}'`);
            }
            newCache.unshift({ key: keyInput, value: valInput, lastAccessed: Date.now() });
        }

        setCache(newCache);
        setKeyInput('');
        setValInput('');
    };

    const get = (key: string) => {
        const existingIndex = cache.findIndex(item => item.key === key);
        if (existingIndex !== -1) {
            const item = cache[existingIndex];
            const newCache = [...cache];
            newCache.splice(existingIndex, 1);
            newCache.unshift({ ...item, lastAccessed: Date.now() });
            setCache(newCache);
            setHitLog(`Cache HIT: '${key}' (Moved to front)`);
        } else {
            setHitLog(`Cache MISS: '${key}'`);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-red-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Database className="h-5 w-5 text-red-500" />
                                LRU Cache Visualizer
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Least Recently Used (LRU) policy. Capacity: {capacity}.
                            </p>
                        </div>
                        <div className="text-xs font-mono bg-muted px-2 py-1 rounded">
                            Size: {cache.length}/{capacity}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 items-end">
                        <div className="space-y-1 flex-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Key</label>
                            <Input value={keyInput} onChange={e => setKeyInput(e.target.value)} placeholder="e.g. user:1" className="h-8 text-xs" />
                        </div>
                        <div className="space-y-1 flex-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Value</label>
                            <Input value={valInput} onChange={e => setValInput(e.target.value)} placeholder="Data..." className="h-8 text-xs" />
                        </div>
                        <Button onClick={put} size="sm" className="h-8 bg-red-600 hover:bg-red-700 text-white">
                            Put (Set)
                        </Button>
                    </div>

                    {/* Visualization */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground uppercase tracking-widest font-bold px-2">
                            <span>Most Recently Used (Head)</span>
                            <span>Least Recently Used (Tail)</span>
                        </div>
                        <div className="flex flex-col gap-2 p-4 bg-muted/20 rounded-lg min-h-[200px] border border-border/50">
                            <AnimatePresence>
                                {cache.map((item) => (
                                    <motion.div
                                        key={item.key}
                                        layout
                                        initial={{ opacity: 0, x: -50 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 50, scale: 0.8 }}
                                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        className="flex items-center justify-between p-3 bg-card border border-border shadow-sm rounded group cursor-pointer hover:border-red-500/50 transition-colors"
                                        onClick={() => get(item.key)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 font-bold text-xs ring-1 ring-red-500/20">
                                                {item.key.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-mono font-bold text-xs">{item.key}</div>
                                                <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{item.value}</div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-[10px] text-green-500 font-bold uppercase">Click to Access (Get)</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                            {cache.length === 0 && (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground italic text-xs">
                                    Cache is empty. add items above.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Log */}
                    {hitLog && (
                        <div className={`p-2 rounded text-xs text-center font-bold border ${hitLog.includes('Evicted') ? 'bg-orange-500/10 border-orange-500/20 text-orange-600' : hitLog.includes('HIT') ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-blue-500/10 border-blue-500/20 text-blue-600'}`}>
                            {hitLog}
                        </div>
                    )}

                </div>
            </Card>
        </div>
    );
}
