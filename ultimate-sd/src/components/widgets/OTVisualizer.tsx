import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, RefreshCw, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Operation {
    id: string;
    type: 'insert' | 'delete';
    position: number;
    char: string;
    user: 'A' | 'B';
    timestamp: number;
}

const OTVisualizer: React.FC = () => {
    const [docA, setDocA] = useState('Hello');
    const [docB, setDocB] = useState('Hello');
    const [pendingOps, setPendingOps] = useState<Operation[]>([]);
    const [syncLog, setSyncLog] = useState<string[]>([]);

    const performOp = (user: 'A' | 'B', type: 'insert' | 'delete', char: string, position: number) => {
        const op: Operation = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            position,
            char,
            user,
            timestamp: Date.now(),
        };

        // Apply locally immediately
        if (user === 'A') {
            const newText = type === 'insert'
                ? docA.slice(0, position) + char + docA.slice(position)
                : docA.slice(0, position) + docA.slice(position + 1);
            setDocA(newText);
        } else {
            const newText = type === 'insert'
                ? docB.slice(0, position) + char + docB.slice(position)
                : docB.slice(0, position) + docB.slice(position + 1);
            setDocB(newText);
        }

        setPendingOps(prev => [...prev, op]);
        setSyncLog(prev => [`User ${user} ${type}d '${char}' at index ${position}`, ...prev.slice(0, 4)]);
    };

    const sync = () => {
        if (pendingOps.length === 0) return;

        // Simulate Operational Transformation
        // simplified: just apply pending ops to the other doc
        // In a real OT, we'd transform indices.
        // For this demo, we'll just demonstrate the propagation.

        let newA = docA;
        let newB = docB;

        pendingOps.forEach(op => {
            if (op.user === 'A') {
                // Apply A's op to B
                const target = newB;
                if (target.length >= op.position) {
                    newB = op.type === 'insert'
                        ? target.slice(0, op.position) + op.char + target.slice(op.position)
                        : target.slice(0, op.position) + target.slice(op.position + 1);
                }
            } else {
                // Apply B's op to A
                const target = newA;
                if (target.length >= op.position) {
                    newA = op.type === 'insert'
                        ? target.slice(0, op.position) + op.char + target.slice(op.position)
                        : target.slice(0, op.position) + target.slice(op.position + 1);
                }
            }
        });

        setDocA(newA);
        setDocB(newB);
        setPendingOps([]);
        setSyncLog(prev => ['Synced! Documents are now consistent.', ...prev]);
    };

    return (
        <Card className="w-full max-w-4xl p-6 bg-slate-900 border-orange-500/30 shadow-2xl shadow-orange-500/10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-500/20 rounded-xl border border-orange-500/30">
                        <FileText className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Operational Transformation</h2>
                        <p className="text-sm text-slate-400">Simulate real-time collaborative editing</p>
                    </div>
                </div>
                <Button
                    onClick={sync}
                    disabled={pendingOps.length === 0}
                    className="bg-orange-500 hover:bg-orange-600 text-white gap-2 transition-all duration-300"
                >
                    <RefreshCw className={`w-4 h-4 ${pendingOps.length > 0 ? 'animate-spin' : ''}`} />
                    Sync ({pendingOps.length})
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
                {/* User A Editor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-orange-300">User A (San Francisco)</span>
                        <span className="text-xs text-slate-500">Latency: 20ms</span>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 min-h-[150px] font-mono text-lg text-white">
                        {docA}
                        <span className="animate-pulse inline-block w-2 H-5 bg-orange-400 ml-1">|</span>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => performOp('A', 'insert', 'A', docA.length)}>
                            Type 'A'
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => performOp('A', 'delete', '', docA.length - 1)} disabled={docA.length === 0}>
                            Backspace
                        </Button>
                    </div>
                </div>

                {/* Sync Visualizer Line */}
                <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none">
                    <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"></div>
                    <div className="absolute bg-slate-900 p-2 border border-orange-500/30 rounded-full">
                        <ArrowRight className="w-4 h-4 text-orange-400" />
                    </div>
                </div>

                {/* User B Editor */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-semibold text-blue-300">User B (New York)</span>
                        <span className="text-xs text-slate-500">Latency: 85ms</span>
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 min-h-[150px] font-mono text-lg text-white">
                        {docB}
                        <span className="animate-pulse inline-block w-2 H-5 bg-blue-400 ml-1">|</span>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button size="sm" variant="outline" onClick={() => performOp('B', 'insert', 'B', docB.length)}>
                            Type 'B'
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => performOp('B', 'delete', '', docB.length - 1)} disabled={docB.length === 0}>
                            Backspace
                        </Button>
                    </div>
                </div>
            </div>

            <div className="mt-8 p-4 bg-black/40 rounded-lg border border-slate-800">
                <h3 className="text-sm font-semibold text-slate-400 mb-2">Sync Log</h3>
                <div className="space-y-1">
                    <AnimatePresence>
                        {syncLog.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="text-xs font-mono text-slate-300"
                            >
                                {'>'} {log}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {syncLog.length === 0 && <span className="text-xs text-slate-600 italic">No operations yet...</span>}
                </div>
            </div>
        </Card>
    );
};

export default OTVisualizer;
