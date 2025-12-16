"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Hash, Server, Clock, List } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SnowflakeDemo() {
    // Epoch for Twitter Snowflake (Nov 04 2010 01:42:54 UTC)
    const EPOCH = 1288834974657;

    const [timestamp, setTimestamp] = useState<number>(Date.now());
    const [datacenterId, setDatacenterId] = useState<number>(1);
    const [machineId, setMachineId] = useState<number>(1);
    const [sequence, setSequence] = useState<number>(0);

    const [generatedId, setGeneratedId] = useState<string>('');
    const [binaryMap, setBinaryMap] = useState({
        sign: '0',
        time: '',
        dc: '',
        machine: '',
        seq: ''
    });

    useEffect(() => {
        // Recalculate ID whenever inputs change
        const timeOffset = BigInt(timestamp) - BigInt(EPOCH);
        // Ensure positive time offset
        const finalTime = timeOffset > BigInt(0) ? timeOffset : BigInt(0);

        // Construct 64-bit ID using BigInt
        // 41 bits time | 5 bits dc | 5 bits machine | 12 bits seq
        const id = (finalTime << BigInt(22)) |
            (BigInt(datacenterId & 31) << BigInt(17)) |
            (BigInt(machineId & 31) << BigInt(12)) |
            (BigInt(sequence & 4095));

        setGeneratedId(id.toString());

        // Generate binary strings for visualization
        const timeBin = finalTime.toString(2).padStart(41, '0');
        const dcBin = (datacenterId & 31).toString(2).padStart(5, '0');
        const macBin = (machineId & 31).toString(2).padStart(5, '0');
        const seqBin = (sequence & 4095).toString(2).padStart(12, '0');

        setBinaryMap({
            sign: '0',
            time: timeBin,
            dc: dcBin,
            machine: macBin,
            seq: seqBin
        });
    }, [timestamp, datacenterId, machineId, sequence]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-slate-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Hash className="h-5 w-5 text-slate-500" />
                                Snowflake ID Generator
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                64-bit unique ID generation strategy (Twitter Snowflake).
                            </p>
                        </div>
                        <div className="font-mono text-xl font-bold text-slate-600 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-3 py-1 rounded border">
                            {generatedId}
                        </div>
                    </div>

                    <div className="space-y-6">

                        {/* 64-bit Visualization */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1">
                                <span className="text-gray-400">Sign (1)</span>
                                <span className="text-blue-500">Timestamp (41)</span>
                                <span className="text-purple-500">Datacenter (5)</span>
                                <span className="text-pink-500">Machine (5)</span>
                                <span className="text-amber-500">Sequence (12)</span>
                            </div>
                            <div className="flex h-12 rounded-lg overflow-hidden border border-border shadow-sm font-mono text-xs text-white leading-[3rem] text-center">
                                <div className="w-[1.5%] bg-gray-400/80 flex items-center justify-center border-r border-white/20" title="Sign Bit">0</div>
                                <div className="w-[64%] bg-blue-500/80 overflow-hidden flex items-center justify-center border-r border-white/20 px-1 truncate" title={`Timestamp: ${binaryMap.time}`}>
                                    {binaryMap.time}
                                </div>
                                <div className="w-[7.8%] bg-purple-500/80 flex items-center justify-center border-r border-white/20" title={`Datacenter: ${binaryMap.dc}`}>
                                    {binaryMap.dc}
                                </div>
                                <div className="w-[7.8%] bg-pink-500/80 flex items-center justify-center border-r border-white/20" title={`Machine: ${binaryMap.machine}`}>
                                    {binaryMap.machine}
                                </div>
                                <div className="w-[18.9%] bg-amber-500/80 flex items-center justify-center" title={`Sequence: ${binaryMap.seq}`}>
                                    {binaryMap.seq}
                                </div>
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/20 rounded-lg">

                            {/* Timestamp */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold flex items-center gap-2 text-blue-600">
                                    <Clock className="h-4 w-4" /> Timestamp (ms)
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={timestamp}
                                        onChange={e => setTimestamp(parseInt(e.target.value) || 0)}
                                        className="h-8 font-mono text-xs"
                                    />
                                    <Button
                                        size="sm" variant="outline" className="h-8 text-xs"
                                        onClick={() => setTimestamp(Date.now())}
                                    >
                                        Now
                                    </Button>
                                </div>
                                <p className="text-[10px] text-muted-foreground">Offsets from Twepoch (2010).</p>
                            </div>

                            {/* Sequence */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold flex items-center gap-2 text-amber-600">
                                    <List className="h-4 w-4" /> Sequence (0-4095)
                                </label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[sequence]}
                                        min={0} max={4095} step={1}
                                        onValueChange={v => setSequence(v[0])}
                                        className="flex-1"
                                    />
                                    <span className="font-mono text-xs w-10 text-right">{sequence}</span>
                                </div>
                            </div>

                            {/* Datacenter ID */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold flex items-center gap-2 text-purple-600">
                                    <Server className="h-4 w-4" /> Datacenter ID (0-31)
                                </label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[datacenterId]}
                                        min={0} max={31} step={1}
                                        onValueChange={v => setDatacenterId(v[0])}
                                        className="flex-1"
                                    />
                                    <span className="font-mono text-xs w-8 text-right">{datacenterId}</span>
                                </div>
                            </div>

                            {/* Machine ID */}
                            <div className="space-y-3">
                                <label className="text-xs font-semibold flex items-center gap-2 text-pink-600">
                                    <Server className="h-4 w-4" /> Machine ID (0-31)
                                </label>
                                <div className="flex items-center gap-4">
                                    <Slider
                                        value={[machineId]}
                                        min={0} max={31} step={1}
                                        onValueChange={v => setMachineId(v[0])}
                                        className="flex-1"
                                    />
                                    <span className="font-mono text-xs w-8 text-right">{machineId}</span>
                                </div>
                            </div>

                        </div>

                    </div>
                </div>
            </Card>
        </div>
    );
}
