"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Zap, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RateLimiterDemo() {
    const [tokens, setTokens] = useState(5);
    const maxTokens = 5;
    const refillRate = 1; // tokens per second
    const [requests, setRequests] = useState<{ id: number, status: 'allowed' | 'denied' }[]>([]);
    const nextId = useRef(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setTokens(prev => Math.min(prev + 1, maxTokens));
        }, 1000 / refillRate);
        return () => clearInterval(interval);
    }, []);

    const handleRequest = () => {
        const id = nextId.current++;
        if (tokens > 0) {
            setTokens(prev => prev - 1);
            setRequests(prev => [{ id, status: 'allowed' as const }, ...prev].slice(0, 5));
        } else {
            setRequests(prev => [{ id, status: 'denied' as const }, ...prev].slice(0, 5));
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-amber-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Shield className="h-5 w-5 text-amber-500" />
                                Token Bucket Rate Limiter
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualizing how tokens govern request allowance.
                            </p>
                        </div>
                        <Button onClick={handleRequest} className="bg-amber-600 hover:bg-amber-700 text-white">
                            Send Request
                        </Button>
                    </div>

                    <div className="flex gap-8 items-center justify-center py-8">

                        {/* Bucket Visualization */}
                        <div className="relative w-32 h-40 border-b-4 border-l-4 border-r-4 border-amber-200 rounded-b-xl bg-amber-500/5 flex flex-col justify-end items-center p-2 gap-1 overflow-visible">
                            <div className="absolute -top-10 text-xs text-muted-foreground font-mono">Bucket (Max {maxTokens})</div>
                            <AnimatePresence>
                                {Array.from({ length: tokens }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0, y: -50 }}
                                        animate={{ scale: 1, y: 0 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="w-full h-4 bg-amber-500 rounded-full shadow-sm"
                                    />
                                ))}
                            </AnimatePresence>
                            {tokens === 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="absolute inset-0 flex items-center justify-center bg-red-500/10 rounded-b-lg"
                                >
                                    <span className="text-red-500 font-bold text-xs uppercase">Empty</span>
                                </motion.div>
                            )}
                        </div>

                        {/* Config Info */}
                        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Refill Rate: {refillRate}/sec</div>
                            <div className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Policy: Reject on Empty</div>
                        </div>

                    </div>

                    {/* Request Log */}
                    <div className="space-y-2">
                        <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">Traffic Log</h4>
                        <div className="space-y-1">
                            {requests.map(req => (
                                <div key={req.id} className={`flex justify-between items-center p-2 rounded text-xs font-mono border ${req.status === 'allowed' ? 'bg-green-500/10 border-green-500/20 text-green-600' : 'bg-red-500/10 border-red-500/20 text-red-600'}`}>
                                    <span>Request #{req.id}</span>
                                    <Badge variant={req.status === 'allowed' ? 'default' : 'destructive'} className="text-[10px] h-5">
                                        {req.status === 'allowed' ? '200 OK' : '429 TOO MANY REQUESTS'}
                                    </Badge>
                                </div>
                            ))}
                            {requests.length === 0 && (
                                <div className="text-center text-xs text-muted-foreground italic py-2">No requests yet.</div>
                            )}
                        </div>
                    </div>

                </div>
            </Card>
        </div>
    );
}
