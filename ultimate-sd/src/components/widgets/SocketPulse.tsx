"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Wifi, WifiOff, MessageSquare, ArrowDown, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
    id: number;
    text: string;
    source: 'client' | 'server';
    timestamp: number;
};

export default function SocketPulse() {
    const [isConnected, setIsConnected] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');

    const connect = () => {
        // Simulate handshake
        setTimeout(() => {
            setIsConnected(true);
            addMessage('System', 'Connected (101 Switching Protocols)');
        }, 800);
    };

    const disconnect = () => {
        setIsConnected(false);
        addMessage('System', 'Disconnected');
    };

    const addMessage = (source: string, text: string) => {
        setMessages(prev => [...prev.slice(-4), {
            id: Date.now(),
            text,
            source: source === 'Client' ? 'client' : 'server',
            timestamp: Date.now()
        }]);
    };

    const sendMessage = () => {
        if (!inputValue.trim()) return;
        addMessage('Client', inputValue);
        setInputValue('');

        // Auto-echo simulation
        setTimeout(() => {
            if (isConnected) {
                addMessage('Server', `Echo: ${inputValue}`);
            }
        }, 1000);
    };

    // Simulate Push from Server
    useEffect(() => {
        if (!isConnected) return;

        const interval = setInterval(() => {
            if (Math.random() > 0.7) {
                addMessage('Server', 'Push Notification 🔔');
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [isConnected]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-green-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Zap className="h-5 w-5 text-green-500" />
                                WebSocket Pulse
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Persistent, full-duplex communication.
                            </p>
                        </div>

                        <Button
                            onClick={isConnected ? disconnect : connect}
                            variant={isConnected ? "destructive" : "default"}
                            size="sm"
                            className={`${!isConnected && 'bg-green-600 hover:bg-green-700'} text-xs gap-1`}
                        >
                            {isConnected ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                            {isConnected ? 'Disconnect' : 'Connect'}
                        </Button>
                    </div>

                    <div className="flex gap-4 min-h-[160px]">

                        {/* Visual Pipe */}
                        <div className="flex items-center justify-between flex-1 px-8 relative">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                    <MessageSquare className="h-8 w-8 text-slate-400" />
                                </div>
                                <div className="text-[10px] text-muted-foreground">Client</div>
                            </div>

                            {/* Connection Line */}
                            <div className="absolute left-24 right-24 top-1/2 h-2 bg-slate-800 rounded-full overflow-hidden">
                                {isConnected && (
                                    <motion.div
                                        className="w-full h-full bg-green-500/50"
                                        animate={{ opacity: [0.5, 1, 0.5] }}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                    />
                                )}
                            </div>

                            {/* Moving Packets */}
                            <div className="absolute left-24 right-24 top-1/2 -mt-3 h-6 pointer-events-none">
                                <AnimatePresence>
                                    {messages.filter(m => m.timestamp > Date.now() - 2000).map(m => (
                                        <motion.div
                                            key={m.id}
                                            initial={{ x: m.source === 'client' ? 0 : '100%' }}
                                            animate={{ x: m.source === 'client' ? '100%' : 0 }}
                                            transition={{ duration: 0.8 }}
                                            className={`absolute top-0 w-3 h-3 rounded-full ${m.source === 'client' ? 'bg-blue-500' : 'bg-green-500'}`}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>


                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                    <Zap className="h-8 w-8 text-slate-400" />
                                </div>
                                <div className="text-[10px] text-muted-foreground">Server</div>
                            </div>
                        </div>

                        {/* Chat Panel */}
                        <div className="w-[220px] border-l border-slate-800 pl-4 flex flex-col gap-2 h-[200px]">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase flex justify-between">
                                <span>Stream</span>
                                <span className={isConnected ? "text-green-500" : "text-slate-500"}>●</span>
                            </div>

                            <div className="flex-1 overflow-auto bg-slate-950/50 rounded p-2 flex flex-col gap-2">
                                {messages.map(m => (
                                    <div key={m.id} className={`text-[10px] p-1.5 rounded w-fit max-w-[90%] break-all ${m.source === 'client' ? 'bg-blue-900/30 text-blue-200 self-end' :
                                            m.text.includes('Connected') || m.text.includes('Disconnected') ? 'bg-slate-800 text-slate-400 self-center text-[9px]' :
                                                'bg-green-900/30 text-green-200 self-start'
                                        }`}>
                                        {m.text}
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-1">
                                <input
                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] flex-1 outline-none"
                                    placeholder={isConnected ? "Type message..." : "Connect first"}
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                    disabled={!isConnected}
                                />
                                <Button onClick={sendMessage} disabled={!isConnected} size="icon" className="h-6 w-6 shrink-0">
                                    <ArrowUp className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>

                    </div>

                </div>
            </Card>
        </div>
    );
}
