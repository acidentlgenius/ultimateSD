"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GitCommit, Play, CheckCircle, XCircle, Loader2, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Stage = {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
    duration: number; // ms
};

export default function PipelineVisualizer() {
    const [stages, setStages] = useState<Stage[]>([
        { id: 'build', name: 'Build', status: 'pending', duration: 2000 },
        { id: 'test', name: 'Test', status: 'pending', duration: 3000 },
        { id: 'deploy', name: 'Deploy', status: 'pending', duration: 2500 },
    ]);
    const [isRunning, setIsRunning] = useState(false);
    const [shouldFail, setShouldFail] = useState(false);

    const runPipeline = async () => {
        setIsRunning(true);
        const newStages = stages.map(s => ({ ...s, status: 'pending' as const }));
        setStages(newStages);

        for (let i = 0; i < newStages.length; i++) {
            const stage = newStages[i];

            // Update to running
            setStages(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'running' } : s));

            await new Promise(r => setTimeout(r, stage.duration));

            // Fail logic
            if (shouldFail && stage.id === 'test') {
                setStages(prev => prev.map((s, idx) => {
                    if (idx === i) return { ...s, status: 'failed' };
                    if (idx > i) return { ...s, status: 'skipped' };
                    return s;
                }));
                setIsRunning(false);
                return;
            }

            // Success
            setStages(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success' } : s));
        }
        setIsRunning(false);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-blue-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <GitCommit className="h-5 w-5 text-blue-500" />
                                CI/CD Pipeline
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Automated continuous integration and deployment flow.
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-[10px] bg-muted p-1 rounded">
                                <input
                                    type="checkbox"
                                    checked={shouldFail}
                                    onChange={e => setShouldFail(e.target.checked)}
                                    id="fail-test"
                                    className="cursor-pointer"
                                />
                                <label htmlFor="fail-test" className="cursor-pointer">Simulate Test Fail</label>
                            </div>
                            <Button
                                onClick={runPipeline}
                                disabled={isRunning}
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-xs gap-1"
                            >
                                {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                                Trigger Pipeline
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-2 py-8 relative">
                        {/* Connecting Line */}
                        <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -z-10" />

                        {stages.map((stage, i) => (
                            <motion.div
                                key={stage.id}
                                layout
                                className={`
                       relative w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center bg-card shadow-lg z-0
                       ${stage.status === 'running' ? 'border-blue-500 ring-4 ring-blue-500/20' :
                                        stage.status === 'success' ? 'border-green-500' :
                                            stage.status === 'failed' ? 'border-red-500' : 'border-slate-700'}
                    `}
                            >
                                {stage.status === 'running' && <Loader2 className="h-8 w-8 animate-spin text-blue-500" />}
                                {stage.status === 'success' && <CheckCircle className="h-8 w-8 text-green-500" />}
                                {stage.status === 'failed' && <XCircle className="h-8 w-8 text-red-500" />}
                                {stage.status === 'pending' && <div className="h-3 w-3 rounded-full bg-slate-500" />}
                                {stage.status === 'skipped' && <div className="text-xl text-slate-600">⏭️</div>}

                                <div className="absolute -bottom-8 text-center w-32">
                                    <div className="font-bold text-xs">{stage.name}</div>
                                    <div className="text-[10px] text-muted-foreground capitalize">{stage.status}</div>
                                </div>

                                {/* Arrows */}
                                {i < stages.length - 1 && (
                                    <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-slate-500">
                                        ▶
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="p-3 bg-muted/20 rounded-lg text-[10px] font-mono border border-dashed border-slate-700">
                            <div className="text-muted-foreground mb-1">LOGS:</div>
                            {stages.map(s => (
                                <div key={s.id} className={
                                    s.status === 'success' ? 'text-green-500' :
                                        s.status === 'failed' ? 'text-red-500' :
                                            s.status === 'running' ? 'text-blue-500' : 'text-slate-600'
                                }>
                                    [{new Date().toLocaleTimeString()}] {s.name}: {s.status.toUpperCase()}
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2 justify-center text-xs text-muted-foreground">
                            <p>1. <strong>Build</strong>: Compile code, bundle assets.</p>
                            <p>2. <strong>Test</strong>: Unit tests, integration tests.</p>
                            <p>3. <strong>Deploy</strong>: Push to Production (Blue/Green).</p>
                        </div>
                    </div>

                </div>
            </Card>
        </div>
    );
}
