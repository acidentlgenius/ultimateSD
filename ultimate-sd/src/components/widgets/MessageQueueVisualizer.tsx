"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Server, Users, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Message = {
    id: string;
    content: string;
    partition: number;
};

type Consumer = {
    id: string;
    groupId: string;
    assignedPartition: number;
    offset: number;
};

export default function MessageQueueVisualizer() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [consumers, setConsumers] = useState<Consumer[]>([
        { id: 'C1', groupId: 'G1', assignedPartition: 0, offset: 0 },
        { id: 'C2', groupId: 'G1', assignedPartition: 1, offset: 0 },
    ]);
    const [partitions] = useState([0, 1, 2]); // 3 Partitions

    const publishMessage = () => {
        const partition = Math.floor(Math.random() * partitions.length);
        const newMessage = {
            id: Math.random().toString(36).substr(2, 5),
            content: `Msg-${messages.length + 1}`,
            partition,
        };
        setMessages(prev => [...prev, newMessage]);
    };

    const messagesRef = useRef(messages);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    const consumeMessages = useCallback(() => {
        setConsumers(prev => prev.map(c => {
            // Find max available offset in this partition
            const partitionMsgs = messagesRef.current.filter(m => m.partition === c.assignedPartition);
            const limit = partitionMsgs.length;

            if (c.offset < limit) {
                return { ...c, offset: c.offset + 1 };
            }
            return c;
        }));
    }, []);

    // Auto-consume effect
    useEffect(() => {
        const interval = setInterval(consumeMessages, 1000);
        return () => clearInterval(interval);
    }, [consumeMessages]);

    const addConsumer = () => {
        if (consumers.length >= partitions.length) return;
        const newId = `C${consumers.length + 1}`;
        // Dumb assignment: next available partition
        const usedPartitions = consumers.map(c => c.assignedPartition);
        const available = partitions.find(p => !usedPartitions.includes(p));

        if (available !== undefined) {
            setConsumers(prev => [...prev, { id: newId, groupId: 'G1', assignedPartition: available, offset: 0 }]);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-orange-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Server className="h-5 w-5 text-orange-500" />
                                Distributed Message Queue
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Topics partitioned for scale. Consumers reading sequentially.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={publishMessage} size="sm" className="bg-orange-600 hover:bg-orange-700 text-xs">
                                Publish Msg
                            </Button>
                            <Button onClick={addConsumer} size="sm" variant="outline" className="text-xs">
                                add Consumer (G1)
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Partitions */}
                        {partitions.map(p => {
                            const pMessages = messages.filter(m => m.partition === p);
                            const assignedConsumer = consumers.find(c => c.assignedPartition === p);

                            return (
                                <div key={p} className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="w-20 justify-center">Partition {p}</Badge>
                                        <div className="flex-1 h-12 bg-muted/30 rounded border flex items-center px-2 gap-1 overflow-hidden relative">
                                            <AnimatePresence>
                                                {pMessages.slice(-10).map((m, i) => (
                                                    <motion.div
                                                        key={m.id}
                                                        initial={{ scale: 0, x: 20 }}
                                                        animate={{ scale: 1, x: 0 }}
                                                        className={`
                                   h-8 w-8 flex-shrink-0 rounded flex items-center justify-center text-[10px] font-mono border
                                   ${assignedConsumer && i < pMessages.slice(-10).length - (pMessages.length - assignedConsumer.offset) ? 'bg-orange-500/20 border-orange-500/50 text-orange-700 dark:text-orange-300' : 'bg-slate-200 dark:bg-slate-800 border-slate-400'}
                                 `}
                                                        title={JSON.stringify(m)}
                                                    >
                                                        {i < 3 ? '...' : ''}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    {/* Consumer Connection */}
                                    <div className="h-8 flex ml-24 relative">
                                        {assignedConsumer && (
                                            <motion.div
                                                layoutId={`conn-${assignedConsumer.id}`}
                                                className="flex flex-col items-center"
                                            >
                                                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                                                <div className="bg-orange-100 dark:bg-orange-950 px-2 py-0.5 rounded border border-orange-500/30 text-[10px] whitespace-nowrap flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    {assignedConsumer.id} (Offset: {assignedConsumer.offset})
                                                </div>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-2">
                        Messages are appended to partitions. Consumers in a group read exclusively from partitions to ensure ordering guarantee within a partition.
                    </div>

                </div>
            </Card>
        </div>
    );
}
