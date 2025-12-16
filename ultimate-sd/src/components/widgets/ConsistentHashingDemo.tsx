"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Minus, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Node = {
    id: string;
    angle: number; // Position on ring (0-360)
    color: string;
};

type KeyItem = {
    id: string;
    angle: number; // Position on ring (0-360)
    targetNodeId: string;
};

export default function ConsistentHashingDemo() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 'S1', angle: 45, color: '#ec4899' },  // Pink
        { id: 'S2', angle: 135, color: '#8b5cf6' }, // Violet
        { id: 'S3', angle: 225, color: '#3b82f6' }, // Blue
    ]);
    const [keys, setKeys] = useState<KeyItem[]>([]);
    const ringRef = useRef<HTMLDivElement>(null);

    // Helper to find target node (first node with angle >= key angle, or wrap around)
    const findTargetNode = (keyAngle: number, currentNodes: Node[]): string => {
        if (currentNodes.length === 0) return '';
        const sortedNodes = [...currentNodes].sort((a, b) => a.angle - b.angle);
        for (const node of sortedNodes) {
            if (node.angle >= keyAngle) return node.id;
        }
        return sortedNodes[0].id; // Wrap around
    };

    const addNode = () => {
        if (nodes.length >= 8) return;
        const newId = `S${nodes.length + 1 + Math.floor(Math.random() * 10)}`;
        const newAngle = Math.floor(Math.random() * 360);
        const colors = ['#f59e0b', '#10b981', '#ef4444', '#06b6d4', '#6366f1'];
        const newColor = colors[nodes.length % colors.length];

        setNodes(prev => [...prev, { id: newId, angle: newAngle, color: newColor }]);
    };

    const removeNode = () => {
        if (nodes.length <= 1) return;
        setNodes(prev => {
            const copy = [...prev];
            copy.pop(); // Remove last added
            return copy;
        });
    };

    const addKey = () => {
        const keyId = `K${keys.length + 1}`;
        const angle = Math.floor(Math.random() * 360);
        setKeys(prev => [...prev, { id: keyId, angle, targetNodeId: '' }]); // Target calc in effect
    };

    // Recalculate key mappings whenever nodes or keys change
    useEffect(() => {
        setKeys(prevKeys => prevKeys.map(k => ({
            ...k,
            targetNodeId: findTargetNode(k.angle, nodes)
        })));
    }, [nodes, keys.length]); // keys.length check ensures we re-calc for new keys too

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-fuchsia-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Database className="h-5 w-5 text-fuchsia-500" />
                                Consistent Hashing Ring
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Distribute keys uniformly while minimizing movement.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={addNode} size="sm" variant="outline" className="text-xs gap-1">
                                <Plus className="h-3 w-3" /> Server
                            </Button>
                            <Button onClick={removeNode} size="sm" variant="outline" className="text-xs gap-1">
                                <Minus className="h-3 w-3" /> Server
                            </Button>
                            <Button onClick={addKey} size="sm" className="bg-fuchsia-600 hover:bg-fuchsia-700 text-xs gap-1">
                                <Plus className="h-3 w-3" /> Key
                            </Button>
                        </div>
                    </div>

                    <div className="relative h-64 w-full flex items-center justify-center">

                        {/* Ring */}
                        <div className="w-56 h-56 rounded-full border-4 border-slate-200 dark:border-slate-700 relative" ref={ringRef}>

                            {/* Nodes (Servers) */}
                            <AnimatePresence>
                                {nodes.map(node => (
                                    <motion.div
                                        key={node.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        className="absolute w-8 h-8 -ml-4 -mt-4 rounded-full flex items-center justify-center shadow-lg border-2 border-white text-[10px] font-bold text-white z-10"
                                        style={{
                                            backgroundColor: node.color,
                                            left: `${50 + 50 * Math.cos((node.angle - 90) * Math.PI / 180)}%`,
                                            top: `${50 + 50 * Math.sin((node.angle - 90) * Math.PI / 180)}%`,
                                        }}
                                    >
                                        {node.id}
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Keys (Data) */}
                            <AnimatePresence>
                                {keys.map(key => {
                                    const mappedNode = nodes.find(n => n.id === key.targetNodeId);
                                    return (
                                        <motion.div
                                            key={key.id}
                                            initial={{ scale: 0 }}
                                            animate={{
                                                scale: 1,
                                                backgroundColor: mappedNode ? mappedNode.color : '#94a3b8'
                                            }}
                                            className="absolute w-3 h-3 -ml-1.5 -mt-1.5 rounded-full border border-black/20 z-0 transition-colors duration-500"
                                            style={{
                                                left: `${50 + 44 * Math.cos((key.angle - 90) * Math.PI / 180)}%`, // Slightly inner circle
                                                top: `${50 + 44 * Math.sin((key.angle - 90) * Math.PI / 180)}%`,
                                            }}
                                            title={`Key: ${key.id} -> Node: ${key.targetNodeId}`}
                                        />
                                    );
                                })}
                            </AnimatePresence>

                            {/* Center Stats */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <div className="text-2xl font-bold">{nodes.length}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Servers</div>
                                <div className="text-lg font-bold mt-2">{keys.length}</div>
                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Keys</div>
                            </div>

                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground text-center">
                        Keys are mapped to the next server in clockwise direction. Adding/Removing a server only affects keys in its immediate segment.
                    </div>

                </div>
            </Card>
        </div>
    );
}
