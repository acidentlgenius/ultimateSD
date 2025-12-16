"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Server, User, Wifi, CloudLightning } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Region = 'NA' | 'EU' | 'AS' | 'SA';

type CDNNode = {
    region: Region;
    type: 'origin' | 'edge';
    hasCache: boolean;
};

type Request = {
    id: string;
    from: Region;
    path: 'edge' | 'origin';
    latency: number;
};

export default function CDNMap() {
    const [nodes, setNodes] = useState<Record<Region, CDNNode>>({
        'NA': { region: 'NA', type: 'origin', hasCache: true }, // Origin is in NA
        'EU': { region: 'EU', type: 'edge', hasCache: false },
        'AS': { region: 'AS', type: 'edge', hasCache: false },
        'SA': { region: 'SA', type: 'edge', hasCache: false },
    });

    const [requests, setRequests] = useState<Request[]>([]);
    const [lastLatency, setLastLatency] = useState<number | null>(null);

    const sendRequest = (region: Region) => {
        const node = nodes[region];
        const isCached = node.type === 'origin' || node.hasCache;

        // Simulate latency
        // Edge Hit: 20-50ms
        // Origin Miss: 150-300ms (depends on region distance from NA)
        const distancePenalty = region === 'NA' ? 0 : region === 'EU' ? 100 : region === 'SA' ? 120 : 200;
        const latency = isCached ? 20 + Math.random() * 30 : 50 + distancePenalty + Math.random() * 50;

        const newReq: Request = {
            id: Math.random().toString(36),
            from: region,
            path: isCached ? 'edge' : 'origin',
            latency: Math.round(latency)
        };

        setRequests(prev => [...prev.slice(-4), newReq]);
        setLastLatency(newReq.latency);

        // Cache content at edge after a miss
        if (!isCached) {
            setTimeout(() => {
                setNodes(prev => ({
                    ...prev,
                    [region]: { ...prev[region], hasCache: true }
                }));
            }, 1000); // Simulate network fetch time
        }
    };

    const clearCache = () => {
        setNodes(prev => {
            const reset: any = {};
            Object.keys(prev).forEach(k => {
                const r = k as Region;
                reset[r] = { ...prev[r], hasCache: prev[r].type === 'origin' };
            });
            return reset;
        });
        setLastLatency(null);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-cyan-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-cyan-500" />
                                Content Delivery Network
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Route users to nearest Edge server. Fallback to Origin on miss.
                            </p>
                        </div>
                        <Button onClick={clearCache} size="sm" variant="outline" className="text-xs">
                            Purge All Caches
                        </Button>
                    </div>

                    <div className="relative h-64 border rounded-lg bg-slate-900/50 overflow-hidden">

                        {/* Simple World Map Concept involving grid */}
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-8">

                            {/* NA (Top Left) - Origin */}
                            <div className="relative border border-cyan-500/30 rounded p-2 flex flex-col items-center justify-center gap-2">
                                <div className="absolute top-2 left-2 text-[10px] font-bold text-cyan-500">North America (Origin)</div>
                                <Server className="h-8 w-8 text-cyan-400" />
                                <Badge variant="secondary" className="text-[10px]">Origin Server</Badge>
                                <Button size="sm" onClick={() => sendRequest('NA')} className="h-6 text-[10px] gap-1">
                                    <User className="h-3 w-3" /> Req
                                </Button>
                            </div>

                            {/* EU (Top Right) */}
                            <div className="relative border border-slate-700 rounded p-2 flex flex-col items-center justify-center gap-2">
                                <div className="absolute top-2 left-2 text-[10px] text-muted-foreground">Europe</div>
                                <CloudLightning className={`h-8 w-8 ${nodes['EU'].hasCache ? 'text-green-500' : 'text-slate-600'}`} />
                                <Badge variant={nodes['EU'].hasCache ? 'default' : 'outline'} className="text-[10px]">
                                    {nodes['EU'].hasCache ? 'Cached (HIT)' : 'Empty (MISS)'}
                                </Badge>
                                <Button size="sm" onClick={() => sendRequest('EU')} className="h-6 text-[10px] gap-1">
                                    <User className="h-3 w-3" /> Req
                                </Button>
                            </div>

                            {/* SA (Bottom Left) */}
                            <div className="relative border border-slate-700 rounded p-2 flex flex-col items-center justify-center gap-2">
                                <div className="absolute top-2 left-2 text-[10px] text-muted-foreground">South America</div>
                                <CloudLightning className={`h-8 w-8 ${nodes['SA'].hasCache ? 'text-green-500' : 'text-slate-600'}`} />
                                <Badge variant={nodes['SA'].hasCache ? 'default' : 'outline'} className="text-[10px]">
                                    {nodes['SA'].hasCache ? 'Cached (HIT)' : 'Empty (MISS)'}
                                </Badge>
                                <Button size="sm" onClick={() => sendRequest('SA')} className="h-6 text-[10px] gap-1">
                                    <User className="h-3 w-3" /> Req
                                </Button>
                            </div>

                            {/* AS (Bottom Right) */}
                            <div className="relative border border-slate-700 rounded p-2 flex flex-col items-center justify-center gap-2">
                                <div className="absolute top-2 left-2 text-[10px] text-muted-foreground">Asia</div>
                                <CloudLightning className={`h-8 w-8 ${nodes['AS'].hasCache ? 'text-green-500' : 'text-slate-600'}`} />
                                <Badge variant={nodes['AS'].hasCache ? 'default' : 'outline'} className="text-[10px]">
                                    {nodes['AS'].hasCache ? 'Cached (HIT)' : 'Empty (MISS)'}
                                </Badge>
                                <Button size="sm" onClick={() => sendRequest('AS')} className="h-6 text-[10px] gap-1">
                                    <User className="h-3 w-3" /> Req
                                </Button>
                            </div>

                        </div>

                        {/* Request Animation Overlay (Visual connection lines omitted for simplicity, focusing on result toast overlay) */}
                        <AnimatePresence>
                            {lastLatency !== null && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full border border-cyan-500 shadow-xl flex items-center gap-3 z-20"
                                >
                                    <Wifi className="h-4 w-4 text-cyan-400" />
                                    <span className="font-mono font-bold text-lg">{lastLatency}ms</span>
                                    <span className="text-xs text-gray-300">
                                        {lastLatency < 60 ? '⚡️ Edge Hit' : '🐢 Origin Trip'}
                                    </span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                    </div>

                    <div className="text-[10px] text-muted-foreground text-center">
                        Requests from distant regions to Origin (NA) incur high latency. Once cached at the Edge, subsequent requests are fast.
                    </div>

                </div>
            </Card>
        </div>
    );
}
