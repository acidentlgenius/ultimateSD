"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Hexagon, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function BloomFilterViz() {
    const size = 10;
    const [bitArray, setBitArray] = useState<number[]>(Array(size).fill(0));
    const [inputValue, setInputValue] = useState('');
    const [log, setLog] = useState<{ message: string; type: 'success' | 'error' | 'info'; bits?: number[] } | null>(null);

    // Simple hash functions
    const hash1 = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash + str.charCodeAt(i) * 31) % size;
        }
        return hash;
    };

    const hash2 = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash + str.charCodeAt(i) * 17) % size;
        }
        return hash;
    };

    const hash3 = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash + str.charCodeAt(i) * 7) % size;
        }
        return hash;
    };

    const getHashIndices = (str: string) => [hash1(str), hash2(str), hash3(str)];

    const handleAdd = () => {
        if (!inputValue) return;
        const indices = getHashIndices(inputValue);
        const newBitArray = [...bitArray];
        indices.forEach(index => {
            newBitArray[index] = 1;
        });
        setBitArray(newBitArray);
        setLog({
            message: `Added '${inputValue}'. Hashed to bits: ${indices.join(', ')}`,
            type: 'success',
            bits: indices
        });
        setInputValue('');
    };

    const handleCheck = () => {
        if (!inputValue) return;
        const indices = getHashIndices(inputValue);
        const exists = indices.every(index => bitArray[index] === 1);

        if (exists) {
            setLog({
                message: `'${inputValue}' might exist (Bits ${indices.join(', ')} are all 1). False positives are possible.`,
                type: 'info',
                bits: indices
            });
        } else {
            setLog({
                message: `'${inputValue}' definitely does NOT exist (Not all bits ${indices.join(', ')} are 1).`,
                type: 'error',
                bits: indices
            });
        }
        setInputValue('');
    };

    const handleReset = () => {
        setBitArray(Array(size).fill(0));
        setLog(null);
        setInputValue('');
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-indigo-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Hexagon className="h-5 w-5 text-indigo-500" />
                                Bloom Filter Visualizer
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Probabilistic data structure for fast set membership testing.
                            </p>
                        </div>
                        <Button onClick={handleReset} variant="outline" size="sm" className="text-xs h-8">
                            Reset
                        </Button>
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2 items-end">
                        <div className="space-y-1 flex-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">URL or String</label>
                            <Input
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="e.g. google.com"
                                className="h-8 text-xs"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAdd();
                                }}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleAdd} size="sm" className="h-8 bg-indigo-600 hover:bg-indigo-700 text-white min-w-[80px]">
                                Add
                            </Button>
                            <Button onClick={handleCheck} size="sm" variant="secondary" className="h-8 min-w-[80px]">
                                Check
                            </Button>
                        </div>
                    </div>

                    {/* Bit Array Visualization */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground">Bit Array (Size: {size})</h4>
                        <div className="flex flex-wrap gap-2 justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
                            {bitArray.map((bit, index) => {
                                const isHighlighted = log?.bits?.includes(index);
                                return (
                                    <div key={index} className="flex flex-col items-center gap-1">
                                        <div className="text-[10px] text-muted-foreground font-mono">{index}</div>
                                        <motion.div
                                            initial={false}
                                            animate={{
                                                backgroundColor: bit === 1
                                                    ? (isHighlighted ? '#4f46e5' : '#6366f1') // Indigo 600 / Indigo 500
                                                    : 'transparent',
                                                borderColor: bit === 1
                                                    ? (isHighlighted ? '#4338ca' : '#4f46e5')
                                                    : (isHighlighted ? '#818cf8' : 'currentColor'),
                                                scale: isHighlighted ? [1, 1.2, 1] : 1
                                            }}
                                            transition={{ duration: 0.3 }}
                                            className={`w-10 h-10 border rounded flex items-center justify-center font-bold font-mono transition-colors ${
                                                bit === 0 && !isHighlighted ? 'border-border text-muted-foreground' : 'text-white border-indigo-400'
                                            }`}
                                        >
                                            {bit}
                                        </motion.div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center justify-center gap-4">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 border border-border rounded"></div>
                                <span>0 = Empty</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 bg-indigo-500 border border-indigo-500 rounded"></div>
                                <span>1 = Set</span>
                            </div>
                        </div>
                    </div>

                    {/* Log / Feedback */}
                    <AnimatePresence mode="wait">
                        {log && (
                            <motion.div
                                key={log.message}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className={`p-3 rounded-md text-xs font-bold border flex items-start gap-2 ${
                                    log.type === 'success'
                                        ? 'bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400'
                                        : log.type === 'error'
                                        ? 'bg-red-500/10 border-red-500/20 text-red-700 dark:text-red-400'
                                        : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-700 dark:text-indigo-400'
                                }`}
                            >
                                {log.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />}
                                {log.type === 'error' && <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                                {log.type === 'info' && <Hexagon className="w-4 h-4 shrink-0 mt-0.5" />}
                                <span>{log.message}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>
        </div>
    );
}