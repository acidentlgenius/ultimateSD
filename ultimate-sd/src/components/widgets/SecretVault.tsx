"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Key, ShieldCheck, Timer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Secret = {
    id: string;
    key: string;
    value: string;
    version: number;
};

type Lease = {
    token: string;
    appName: string;
    expiresAt: number;
};

export default function SecretVault() {
    const [secrets, setSecrets] = useState<Secret | null>(null);
    const [lease, setLease] = useState<Lease | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    const storeSecret = () => {
        // Simulate encrypting and storing
        setSecrets({
            id: 'db_password',
            key: 'DB_PASS',
            value: '••••••••••••',
            version: 1
        });
    };

    const requestAccess = () => {
        if (!secrets) return;
        // Grant a short-lived lease
        const duration = 15; // seconds
        setLease({
            token: Math.random().toString(36).substr(2, 9),
            appName: 'PaymentService',
            expiresAt: Date.now() + duration * 1000
        });
        setTimeLeft(duration);
    };

    useEffect(() => {
        if (!lease || timeLeft <= 0) return;
        const interval = setInterval(() => {
            const remaining = Math.ceil((lease.expiresAt - Date.now()) / 1000);
            if (remaining <= 0) {
                setLease(null);
                setTimeLeft(0);
            } else {
                setTimeLeft(remaining);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [lease, timeLeft]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-purple-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-purple-500" />
                                Secret Vault
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Centralized secret storage. No hardcoded creds.
                            </p>
                        </div>

                        {!secrets ? (
                            <Button onClick={storeSecret} size="sm" className="bg-purple-600 hover:bg-purple-700 text-xs gap-1">
                                <Lock className="h-3 w-3" />
                                Store 'DB_PASS'
                            </Button>
                        ) : (
                            <Badge variant="outline" className="border-purple-500/50 text-purple-400 gap-1">
                                <Lock className="h-3 w-3" />
                                Stored (Encrypted)
                            </Badge>
                        )}
                    </div>

                    <div className="flex gap-4 items-center justify-center min-h-[160px]">

                        {/* The Vault */}
                        <div className="relative">
                            <motion.div
                                layout
                                className={`
                     w-32 h-32 rounded-xl border-4 flex flex-col items-center justify-center shadow-2xl transition-all
                     ${lease ? 'border-green-500 bg-green-500/10 shadow-green-500/20' : 'border-slate-700 bg-slate-800'}
                   `}
                            >
                                <AnimatePresence mode="wait">
                                    {lease ? (
                                        <motion.div
                                            key="open"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <Unlock className="h-10 w-10 text-green-500" />
                                            <div className="font-mono text-[10px] text-green-400">ACCESS GRANTED</div>
                                        </motion.div>
                                    ) : (
                                        <motion.div
                                            key="closed"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            exit={{ scale: 0.8, opacity: 0 }}
                                            className="flex flex-col items-center gap-1"
                                        >
                                            <Lock className="h-10 w-10 text-slate-500" />
                                            <div className="font-mono text-[10px] text-slate-500">LOCKED</div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        </div>

                        {/* Connection Line */}
                        <div className="w-16 h-1 bg-gradient-to-r from-slate-700 to-slate-700 relative">
                            {lease && (
                                <motion.div
                                    layoutId="token"
                                    initial={{ x: 0 }}
                                    animate={{ x: 64 }}
                                    transition={{ duration: 0.5, type: 'spring' }}
                                    className="absolute -top-3 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-[10px] text-black font-bold shadow-lg z-10"
                                >
                                    <Key className="h-3 w-3" />
                                </motion.div>
                            )}
                        </div>

                        {/* Application */}
                        <div className="flex flex-col gap-2">
                            <div className="w-32 h-32 border-2 border-dashed border-slate-500 rounded-lg flex flex-col items-center justify-center p-4 bg-muted/10">
                                <div className="text-xs font-bold text-muted-foreground mb-2">My Application</div>
                                {lease ? (
                                    <div className="flex flex-col items-center gap-2 animate-in fade-in slide-in-from-left-4">
                                        <div className="font-mono text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded">
                                            pg_pass_123...
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-yellow-500">
                                            <Timer className="h-3 w-3" />
                                            Lease: {timeLeft}s
                                        </div>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={requestAccess}
                                        disabled={!secrets}
                                        variant="secondary"
                                        size="sm"
                                        className="text-xs w-full"
                                    >
                                        Request Access
                                    </Button>
                                )}
                            </div>
                        </div>

                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-2">
                        Secrets are never stored in code. Apps authenticate (e.g., via IAM) and request a short-lived lease for the secret.
                    </div>

                </div>
            </Card>
        </div>
    );
}
