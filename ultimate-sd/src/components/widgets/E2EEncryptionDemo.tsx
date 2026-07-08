"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lock, Unlock, Key, Send, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function E2EEncryptionDemo() {
    const [message, setMessage] = useState('Hello world!');
    const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
    // 0: Initial, 1: Encrypting, 2: Sending, 3: Decrypting/Done

    const [encrypted, setEncrypted] = useState('');
    const [decrypted, setDecrypted] = useState('');
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    const handleEncrypt = () => {
        setStep(1);
        const tId = setTimeout(() => {
            // Simulate simple Caesar cipher or base64 for demo
            setEncrypted(btoa(message));
            setStep(2);
        }, 1000);
        timeoutIds.current.add(tId);
    };

    const handleSend = () => {
        // Only auto-send here for demo flow
        // In reality, step 2 is "in transit"
    };

    const handleDecrypt = () => {
        setStep(3);
        const tId = setTimeout(() => {
            setDecrypted(atob(encrypted));
        }, 1000);
        timeoutIds.current.add(tId);
    };

    const reset = () => {
        setStep(0);
        setEncrypted('');
        setDecrypted('');
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-green-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-8">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-green-500" />
                                E2E Encryption
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualize how messages are secured from Alice to Bob.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={reset} disabled={step === 0}>
                            Reset Demo
                        </Button>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 relative">

                        {/* Alice */}
                        <div className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors ${step === 0 ? 'border-green-500 bg-green-500/10' : 'border-border'}`}>
                            <div className="flex items-center gap-2 font-bold">
                                <User className="h-5 w-5" /> Alice
                            </div>
                            <div className="w-full max-w-[200px]">
                                <Input
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={step > 0}
                                    placeholder="Type message..."
                                    className="text-center"
                                />
                            </div>
                            {step === 0 && (
                                <Button onClick={handleEncrypt} className="w-full bg-green-600 hover:bg-green-700">
                                    <Lock className="h-3 w-3 mr-2" /> Encrypt & Send
                                </Button>
                            )}
                            {step > 0 && <Badge variant="outline"><Key className="h-3 w-3 mr-1" /> Public Key Used</Badge>}
                        </div>

                        {/* Network / Transit */}
                        <div className="flex-1 min-w-[100px] flex flex-col items-center justify-center relative min-h-[100px]">
                            <div className="w-full h-[2px] bg-border absolute top-1/2 -translate-y-1/2 z-0" />

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <motion.div
                                        key="locking"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1, rotate: 360 }}
                                        exit={{ scale: 0 }}
                                        className="z-10 bg-background p-2 rounded-full border border-border"
                                    >
                                        <Lock className="h-6 w-6 text-green-500" />
                                    </motion.div>
                                )}
                                {step === 2 && (
                                    <motion.div
                                        key="traveling"
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="z-10 bg-background p-3 rounded-lg border border-border flex items-center gap-2 shadow-sm max-w-[150px] truncate"
                                    >
                                        <Lock className="h-4 w-4 text-green-500" />
                                        <span className="font-mono text-[10px]">{encrypted.substring(0, 8)}...</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Bob */}
                        <div className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-colors ${step >= 2 ? 'border-green-500 bg-green-500/10' : 'border-border'}`}>
                            <div className="flex items-center gap-2 font-bold">
                                <User className="h-5 w-5" /> Bob
                            </div>

                            <div className="min-w-[200px] min-h-[40px] flex items-center justify-center p-2 rounded-md border border-input bg-background">
                                {step === 3 ? (
                                    <span className="text-sm font-medium animate-fade-in">{decrypted}</span>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic">Waiting for message...</span>
                                )}
                            </div>

                            {step === 2 && (
                                <Button onClick={handleDecrypt} className="w-full bg-green-600 hover:bg-green-700 animate-pulse">
                                    <Unlock className="h-3 w-3 mr-2" /> Decrypt
                                </Button>
                            )}
                            {step === 3 && <Badge variant="outline" className="border-green-500 text-green-500"><ShieldCheck className="h-3 w-3 mr-1" /> Verified</Badge>}
                        </div>

                    </div>

                    <div className="p-4 bg-muted/50 rounded-lg text-xs font-mono text-muted-foreground">
                        <div className="flex gap-2">
                            <span className="font-bold">Protocol:</span>
                            <span>Signal Protocol (Double Ratchet)</span>
                        </div>
                        <div className="mt-2 text-[10px]">
                            1. Alice expects Bob's Public Key. <br />
                            2. Alice encrypts message: <span className="text-green-500">{message}</span> -&gt; <span className="text-red-500">{encrypted || '???'}</span>.<br />
                            3. Server relays encrypted blob. Server CANNOT read it.<br />
                            4. Bob uses Private Key to decrypt.
                        </div>
                    </div>

                </div>
            </Card>
        </div>
    );
}
