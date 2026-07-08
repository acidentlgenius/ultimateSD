"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Mail, MessageSquare, Smartphone, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Notification = {
    id: string;
    type: 'email' | 'push' | 'sms';
    message: string;
    status: 'queued' | 'processing' | 'delivered';
};

export default function NotificationSystemDemo() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const isMountedRef = useRef(true);

    // Track mount status so the async worker can bail out after unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const sendNotification = (type: 'email' | 'push' | 'sms') => {
        const newNotif: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            message: type === 'email' ? 'Welcome!' : type === 'push' ? 'New Like' : 'OTP: 1234',
            status: 'queued'
        };
        setNotifications(prev => [...prev, newNotif]);
    };

    useEffect(() => {
        // Worker simulation: process queued items one by one
        if (notifications.some(n => n.status !== 'delivered') && !isProcessing) {
            const worker = async () => {
                setIsProcessing(true);

                // Find next queued item
                const nextIdx = notifications.findIndex(n => n.status === 'queued');
                if (nextIdx !== -1) {
                    // Update to processing
                    setNotifications(prev => {
                        const copy = [...prev];
                        copy[nextIdx].status = 'processing';
                        return copy;
                    });

                    // Simulate network latency (0.5s - 1.5s)
                    await new Promise(r => setTimeout(r, 800));
                    if (!isMountedRef.current) return;

                    // Mark as delivered
                    setNotifications(prev => {
                        const copy = [...prev];
                        copy[nextIdx].status = 'delivered';
                        return copy;
                    });
                }

                setIsProcessing(false);
            };
            worker();
        }
    }, [notifications, isProcessing]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-teal-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Bell className="h-5 w-5 text-teal-500" />
                                Notification Pub/Sub
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Decoupled dispatch via Message Queues.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={() => sendNotification('email')} size="sm" variant="outline" className="text-xs gap-1">
                                <Mail className="h-3 w-3" /> Email
                            </Button>
                            <Button onClick={() => sendNotification('push')} size="sm" variant="outline" className="text-xs gap-1">
                                <Smartphone className="h-3 w-3" /> Push
                            </Button>
                            <Button onClick={() => sendNotification('sms')} size="sm" variant="outline" className="text-xs gap-1">
                                <MessageSquare className="h-3 w-3" /> SMS
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-stretch min-h-[200px]">

                        {/* Publisher/Queue */}
                        <div className="flex flex-col gap-4 border-r border-dashed border-border pr-4">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground text-center">Message Queue</h4>
                            <div className="flex flex-col gap-2 flex-1 justify-end">
                                <AnimatePresence>
                                    {notifications.filter(n => n.status === 'queued').map(n => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, y: -20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 50, scale: 0.8 }}
                                            className="p-2 rounded border bg-card text-xs flex items-center gap-2 shadow-sm"
                                        >
                                            {n.type === 'email' ? <Mail className="h-3 w-3 text-blue-500" /> :
                                                n.type === 'push' ? <Smartphone className="h-3 w-3 text-purple-500" /> :
                                                    <MessageSquare className="h-3 w-3 text-green-500" />}
                                            <span className="font-mono">{n.id.substr(0, 4)}</span>
                                            <Badge variant="secondary" className="text-[10px] ml-auto">Queued</Badge>
                                        </motion.div>
                                    ))}
                                    {notifications.filter(n => n.status === 'queued').length === 0 && (
                                        <div className="text-center text-xs text-muted-foreground italic my-auto">Queue Empty</div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Worker */}
                        <div className="flex flex-col items-center justify-center w-24 gap-2">
                            <div className={`
                 w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all duration-300
                 ${isProcessing ? 'border-teal-500 animate-pulse bg-teal-500/10' : 'border-border bg-muted'}
               `}>
                                <span className="text-[10px] font-bold uppercase text-muted-foreground text-center leading-3">
                                    {isProcessing ? 'Working...' : 'Idle'}
                                </span>
                            </div>
                            <div className="h-full w-px border-l border-dashed border-border" />
                        </div>

                        {/* Consumer/Device */}
                        <div className="flex flex-col gap-4 border-l border-dashed border-border pl-4">
                            <h4 className="text-xs font-bold uppercase text-muted-foreground text-center">Delivered</h4>
                            <div className="flex flex-col gap-2 flex-1 justify-end">
                                <AnimatePresence>
                                    {notifications.filter(n => n.status === 'delivered').slice(-5).map(n => (
                                        <motion.div
                                            key={n.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="p-2 rounded border border-green-500/20 bg-green-500/5 text-xs flex items-center gap-2 shadow-sm"
                                        >
                                            <CheckCheck className="h-3 w-3 text-green-600" />
                                            <span className="font-mono text-green-700">{n.id.substr(0, 4)}</span>
                                            <span className="text-[10px] text-muted-foreground ml-auto">{n.type}</span>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>

                </div>
            </Card>
        </div>
    );
}
