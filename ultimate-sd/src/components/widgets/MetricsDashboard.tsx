"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Activity, BarChart, Clock, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

type DataPoint = {
    timestamp: number;
    value: number;
};

export default function MetricsDashboard() {
    const [rawData, setRawData] = useState<DataPoint[]>([]);
    const [aggregatedData, setAggregatedData] = useState<DataPoint[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isSimulating) {
            interval = setInterval(() => {
                const now = Date.now();
                // Simulate CPU usage between 20-80% with random spikes
                const val = 20 + Math.random() * 60 + (Math.random() > 0.9 ? 20 : 0);

                setRawData(prev => {
                    const newData = [...prev, { timestamp: now, value: val }].slice(-50); // Keep last 50 raw points
                    return newData;
                });

            }, 200); // New point every 200ms
        }
        return () => clearInterval(interval);
    }, [isSimulating]);

    // Aggregate raw data every 1 second (simulated 1-minute blocks)
    useEffect(() => {
        if (rawData.length === 0) return;

        // Simple mock aggregation: Average of last 5 points simulates downsampling
        if (rawData.length % 5 === 0) {
            const chunk = rawData.slice(-5);
            const avg = chunk.reduce((acc, curr) => acc + curr.value, 0) / chunk.length;
            setAggregatedData(prev => [...prev, { timestamp: Date.now(), value: avg }].slice(-10));
        }
    }, [rawData]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-indigo-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Activity className="h-5 w-5 text-indigo-500" />
                                Time Series Aggregation
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualizing raw ingestion vs rolled-up metrics.
                            </p>
                        </div>
                        <Button
                            onClick={() => setIsSimulating(!isSimulating)}
                            size="sm"
                            className={`${isSimulating ? 'bg-red-500 hover:bg-red-600' : 'bg-indigo-500 hover:bg-indigo-600'}`}
                        >
                            {isSimulating ? 'Stop Ingestion' : 'Start Ingestion'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* Raw Stream */}
                        <div className="space-y-2 p-4 rounded bg-muted/20 border border-border">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <Activity className="h-3 w-3" /> Raw Stream
                                </h4>
                                <Badge variant="outline" className="text-[10px] h-5">5 pts/sec</Badge>
                            </div>
                            <div className="h-32 flex items-end gap-[2px] overflow-hidden relative">
                                {rawData.map((d, i) => (
                                    <div
                                        key={d.timestamp}
                                        className="bg-indigo-500/50 w-2 rounded-t-sm transition-all duration-300"
                                        style={{ height: `${d.value}%` }}
                                    />
                                ))}
                                {rawData.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">No Data</div>}
                            </div>
                        </div>

                        {/* Aggregated (Rollup) */}
                        <div className="space-y-2 p-4 rounded bg-muted/20 border border-border">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                    <BarChart className="h-3 w-3" /> 1-Min Rollup
                                </h4>
                                <Badge variant="outline" className="text-[10px] h-5">1 pt/sec</Badge>
                            </div>
                            <div className="h-32 flex items-end gap-2 overflow-hidden relative">
                                {aggregatedData.map((d, i) => (
                                    <motion.div
                                        key={d.timestamp}
                                        initial={{ height: 0 }}
                                        animate={{ height: `${d.value}%` }}
                                        className="bg-cyan-500/80 w-6 rounded-t transition-all duration-300 relative group"
                                    >
                                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-sm border">
                                            {d.value.toFixed(1)}%
                                        </div>
                                    </motion.div>
                                ))}
                                {aggregatedData.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-xs opacity-50">No Rollups</div>}
                            </div>
                        </div>

                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-4">
                        <p className="flex items-center gap-2">
                            <RefreshCw className="h-3 w-3" />
                            Raw data is often kept for short retention (e.g. 7 days).
                            Rollups (aggregates) are computed for long-term storage (e.g. 1 year) to save storage costs.
                        </p>
                    </div>

                </div>
            </Card>
        </div>
    );
}
