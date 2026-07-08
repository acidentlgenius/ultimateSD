"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Network, Activity, Shield, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Service = {
    id: string;
    name: string;
    x: number;
    y: number;
    status: 'healthy' | 'degraded';
};

type Trace = {
    id: string;
    from: string;
    to: string;
    status: 'success' | 'fail';
};

export default function ServiceMeshViz() {
    const [services, setServices] = useState<Service[]>([
        { id: 'gateway', name: 'API Gateway', x: 50, y: 50, status: 'healthy' },
        { id: 'auth', name: 'Auth Service', x: 150, y: 20, status: 'healthy' },
        { id: 'order', name: 'Order Service', x: 150, y: 80, status: 'healthy' },
        { id: 'payment', name: 'Payment Service', x: 250, y: 50, status: 'healthy' },
    ]);
    const [activeTrace, setActiveTrace] = useState<Trace[]>([]);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());
    const isMountedRef = useRef(true);

    // Clean up timeouts on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    const sendRequest = async () => {
        // Simulate trace: Gateway -> Auth -> Order -> Payment
        setActiveTrace([]);

        const traceSteps = [
            { id: 't1', from: 'gateway', to: 'auth', status: 'success' as const },
            { id: 't2', from: 'gateway', to: 'order', status: 'success' as const },
            { id: 't3', from: 'order', to: 'payment', status: 'success' as const },
        ];

        for (const step of traceSteps) {
            await new Promise(r => setTimeout(r, 600));
            if (!isMountedRef.current) return;
            setActiveTrace(prev => [...prev, step]);
        }

        const tId = setTimeout(() => setActiveTrace([]), 2000);
        timeoutIds.current.add(tId);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-orange-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Network className="h-5 w-5 text-orange-500" />
                                Service Mesh (Microservices)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualizing inter-service communication and tracing.
                            </p>
                        </div>

                        <Button onClick={sendRequest} size="sm" className="bg-orange-600 hover:bg-orange-700 text-xs gap-1">
                            <Activity className="h-3 w-3" />
                            Trace Request
                        </Button>
                    </div>

                    <div className="relative h-[200px] bg-slate-100 dark:bg-slate-900/50 rounded-lg border border-dashed border-slate-700/50 overflow-hidden">

                        {/* Services */}
                        {services.map(svc => (
                            <motion.div
                                key={svc.id}
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute w-28 h-16 rounded-lg border border-slate-400 bg-card shadow-md flex flex-col items-center justify-center z-10"
                                style={{ left: svc.x * 2.5, top: svc.y * 1.5 }} // Simple scaling for demo coords
                            >
                                <div className="font-bold text-[10px] flex items-center gap-1">
                                    <Layers className="h-3 w-3 text-slate-500" />
                                    {svc.name}
                                </div>

                                {/* Sidecar visual */}
                                <div className="absolute -right-2 -bottom-2 bg-blue-500/10 border border-blue-500 rounded px-1 text-[8px] text-blue-500">
                                    proxy
                                </div>
                            </motion.div>
                        ))}

                        {/* Traces */}
                        <svg className="absolute inset-0 pointer-events-none w-full h-full">
                            <defs>
                                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="28" refY="3.5" orient="auto">
                                    <polygon points="0 0, 10 3.5, 0 7" fill="#f97316" />
                                </marker>
                            </defs>
                            <AnimatePresence>
                                {activeTrace.map(trace => {
                                    const fromSvc = services.find(s => s.id === trace.from)!;
                                    const toSvc = services.find(s => s.id === trace.to)!;

                                    // Calculate centers
                                    const x1 = fromSvc.x * 2.5 + 56; // 56 is half width
                                    const y1 = fromSvc.y * 1.5 + 32; // 32 is half height
                                    const x2 = toSvc.x * 2.5 + 56;
                                    const y2 = toSvc.y * 1.5 + 32;

                                    return (
                                        <motion.line
                                            key={trace.id}
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            x1={x1} y1={y1} x2={x2} y2={y2}
                                            stroke="#f97316"
                                            strokeWidth="2"
                                            strokeDasharray="5,5"
                                            markerEnd="url(#arrowhead)"
                                        />
                                    );
                                })}
                            </AnimatePresence>
                        </svg>

                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-2 flex gap-4">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500/50 border border-blue-500 rounded" /> Sidecar Proxy (Envoy)</div>
                        <div className="flex items-center gap-1"><div className="w-4 h-0.5 bg-orange-500 border border-orange-500" /> mTLS Traffic</div>
                    </div>

                </div>
            </Card>
        </div>
    );
}
