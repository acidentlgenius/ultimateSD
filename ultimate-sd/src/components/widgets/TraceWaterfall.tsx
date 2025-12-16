import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Activity, Clock, Database, Globe, Server, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Span {
    id: string;
    name: string;
    service: string;
    start: number; // ms
    duration: number; // ms
    status: 'ok' | 'error';
    type: 'http' | 'db' | 'cache' | 'process';
    children?: string[];
}

const INITIAL_SPANS: Span[] = [
    { id: '1', name: 'GET /checkout', service: 'Frontend', start: 0, duration: 450, status: 'ok', type: 'http', children: ['2', '5'] },
    { id: '2', name: 'POST /api/order', service: 'Order Service', start: 50, duration: 350, status: 'ok', type: 'http', children: ['3', '4'] },
    { id: '3', name: 'SELECT * FROM items', service: 'DB Primary', start: 100, duration: 150, status: 'ok', type: 'db' },
    { id: '4', name: 'Charge Card', service: 'Payment Gateway', start: 280, duration: 100, status: 'ok', type: 'http' },
    { id: '5', name: 'Update Inventory', service: 'Inventory Service', start: 400, duration: 40, status: 'error', type: 'process' },
];

const TraceWaterfall: React.FC = () => {
    const [hoveredSpan, setHoveredSpan] = useState<string | null>(null);

    const totalDuration = Math.max(...INITIAL_SPANS.map(s => s.start + s.duration));

    const getIcon = (type: Span['type']) => {
        switch (type) {
            case 'http': return <Globe className="w-3 h-3" />;
            case 'db': return <Database className="w-3 h-3" />;
            case 'process': return <Server className="w-3 h-3" />;
            default: return <Activity className="w-3 h-3" />;
        }
    };

    const getColor = (service: string) => {
        switch (service) {
            case 'Frontend': return 'bg-blue-500 border-blue-400';
            case 'Order Service': return 'bg-indigo-500 border-indigo-400';
            case 'DB Primary': return 'bg-amber-500 border-amber-400';
            case 'Payment Gateway': return 'bg-green-500 border-green-400';
            case 'Inventory Service': return 'bg-rose-500 border-rose-400';
            default: return 'bg-slate-500';
        }
    };

    return (
        <Card className="w-full max-w-4xl p-6 bg-slate-900 border-orange-500/30 shadow-2xl shadow-orange-500/10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                        <Activity className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Distributed Tracing</h2>
                        <p className="text-sm text-slate-400">Visualize transaction lifecycle across microservices</p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-mono text-white flex items-center justify-end gap-2">
                        <Clock className="w-4 h-4 text-slate-400" /> {totalDuration}ms
                    </div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Total Latency</p>
                </div>
            </div>

            <div className="relative border-l border-b border-slate-700 h-[300px] bg-slate-900/50 rounded-lg overflow-hidden">
                {/* Time Grid */}
                <div className="absolute inset-0 flex user-select-none pointer-events-none">
                    {[0, 1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 border-r border-slate-700/30 relative">
                            <span className="absolute bottom-0 right-1 text-[10px] text-slate-600 font-mono">
                                {Math.round((totalDuration / 5) * (i + 1))}ms
                            </span>
                        </div>
                    ))}
                </div>

                {/* Spans */}
                <div className="absolute inset-0 p-4 space-y-4 pt-8">
                    {INITIAL_SPANS.map((span) => (
                        <div
                            key={span.id}
                            className="relative h-8 group"
                            onMouseEnter={() => setHoveredSpan(span.id)}
                            onMouseLeave={() => setHoveredSpan(null)}
                        >
                            <div
                                className="flex items-center"
                                style={{
                                    marginLeft: `${(span.start / totalDuration) * 100}%`,
                                }}
                            >
                                {/* Span Label (Left of bar or inside if long enough, simplified to left for clarity) */}
                                <span className="text-[10px] text-slate-400 mr-2 w-32 text-right truncate shrink-0">
                                    {span.service}: {span.name}
                                </span>

                                {/* The Bar */}
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(span.duration / totalDuration) * 100}%` }}
                                    transition={{ duration: 0.5, delay: span.start / 1000 }}
                                    className={`
                       h-6 rounded-md shadow-lg border relative flex items-center px-2 gap-2 cursor-pointer
                       ${getColor(span.service)}
                       ${hoveredSpan === span.id ? 'brightness-125 z-10 scale-y-110' : 'opacity-90'}
                     `}
                                >
                                    {getIcon(span.type)}
                                    {span.status === 'error' && <AlertCircle className="w-3 h-3 text-white animate-pulse" />}
                                </motion.div>

                                <span className="text-[10px] text-slate-500 ml-2 font-mono">
                                    {span.duration}ms
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend / Hover Info */}
            <div className="mt-8 h-24 p-4 bg-slate-800 rounded-lg border border-slate-700">
                <AnimatePresence mode="wait">
                    {hoveredSpan ? (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex justify-between items-start"
                        >
                            <div>
                                <h4 className="font-bold text-white flex items-center gap-2">
                                    {getIcon(INITIAL_SPANS.find(s => s.id === hoveredSpan)?.type as any)}
                                    {INITIAL_SPANS.find(s => s.id === hoveredSpan)?.name}
                                </h4>
                                <p className="text-sm text-slate-400">{INITIAL_SPANS.find(s => s.id === hoveredSpan)?.service}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-8 text-sm">
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase">Start</span>
                                    <span className="font-mono text-white">{INITIAL_SPANS.find(s => s.id === hoveredSpan)?.start}ms</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase">Duration</span>
                                    <span className="font-mono text-white">{INITIAL_SPANS.find(s => s.id === hoveredSpan)?.duration}ms</span>
                                </div>
                                <div>
                                    <span className="block text-slate-500 text-xs uppercase">Status</span>
                                    <span className={`font-bold uppercase ${INITIAL_SPANS.find(s => s.id === hoveredSpan)?.status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                                        {INITIAL_SPANS.find(s => s.id === hoveredSpan)?.status}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center h-full text-slate-500 text-sm gap-2"
                        >
                            <Activity className="w-4 h-4" /> Hover over a span to view details
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default TraceWaterfall;
