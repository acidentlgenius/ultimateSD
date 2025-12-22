"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Database, Server, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Block = {
    id: string;
    name: string;
    size: string;
    replicas: string[]; // DataNode IDs
};

type DataNode = {
    id: string;
    rack: string;
    blocks: string[]; // Block IDs
    status: 'alive' | 'dead';
};

export default function DFSVisualizer() {
    const [file, setFile] = useState<{ name: string, size: string } | null>(null);
    const [blocks, setBlocks] = useState<Block[]>([]);
    const [dataNodes, setDataNodes] = useState<DataNode[]>([
        { id: 'DN-1', rack: 'Rack-A', blocks: [], status: 'alive' },
        { id: 'DN-2', rack: 'Rack-A', blocks: [], status: 'alive' },
        { id: 'DN-3', rack: 'Rack-B', blocks: [], status: 'alive' },
        { id: 'DN-4', rack: 'Rack-B', blocks: [], status: 'alive' },
    ]);

    const uploadFile = () => {
        // Simulating a large file upload
        const fileName = "data-logs-2024.csv";
        const fileSize = "256 MB";
        setFile({ name: fileName, size: fileSize });
        setBlocks([]);

        // Simulate splitting into 128MB blocks
        setTimeout(() => {
            const newBlocks: Block[] = [
                { id: 'BLK-1', name: 'blk_1001', size: '128 MB', replicas: [] },
                { id: 'BLK-2', name: 'blk_1002', size: '128 MB', replicas: [] },
            ];
            setBlocks(newBlocks);

            // Replicate blocks
            replicateBlocks(newBlocks);
        }, 1000);
    };

    const replicateBlocks = (currentBlocks: Block[]) => {
        const updatedNodes = [...dataNodes];
        const updatedBlocks = [...currentBlocks];

        updatedBlocks.forEach(block => {
            // Replication Strategy: 3 Replicas
            // 1. Random Node
            // 2. Node in DIFFERENT Rack
            // 3. Node in SAME Rack as #2 (or random 3rd)

            const liveNodes = updatedNodes.filter(n => n.status === 'alive');
            if (liveNodes.length < 3) return; // Not enough nodes

            const r1 = liveNodes[0]; // Simplified for demo
            const r2 = liveNodes.find(n => n.rack !== r1.rack) || liveNodes[1];
            const r3 = liveNodes.find(n => n.id !== r1.id && n.id !== r2.id) || liveNodes[2];

            const targets = [r1, r2, r3];

            block.replicas = targets.map(t => t.id);

            targets.forEach(t => {
                const nodeIndex = updatedNodes.findIndex(n => n.id === t.id);
                if (nodeIndex !== -1 && !updatedNodes[nodeIndex].blocks.includes(block.id)) {
                    updatedNodes[nodeIndex].blocks = [...updatedNodes[nodeIndex].blocks, block.id];
                }
            });
        });

        setDataNodes(updatedNodes);
        setBlocks(updatedBlocks);
    };

    const killNode = (nodeId: string) => {
        setDataNodes(prev => prev.map(n => n.id === nodeId ? { ...n, status: 'dead' } : n));
        // Re-replication logic would go here in a full simulation
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-indigo-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Database className="h-5 w-5 text-indigo-500" />
                                Distributed File System
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                NameNode manages metadata. DataNodes store blocks.
                            </p>
                        </div>
                        <Button onClick={uploadFile} disabled={!!file} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs">
                            {file ? 'File Uploaded' : 'Upload 256MB File'}
                        </Button>
                    </div>

                    <div className="flex gap-4">
                        {/* NameNode Metadata */}
                        <div className="w-1/3 space-y-2">
                            <div className="text-xs font-bold uppercase text-muted-foreground">NameNode (Metadata)</div>
                            <div className="bg-muted/30 p-2 rounded border h-48 overflow-y-auto">
                                {!file && <div className="text-xs text-muted-foreground italic p-2">Namespace empty...</div>}
                                {file && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] space-y-2 font-mono">
                                        <div className="flex items-center gap-1 text-indigo-400">
                                            <FileText className="h-3 w-3" />
                                            {file.name} ({file.size})
                                        </div>
                                        <div className="pl-4 border-l-2 border-slate-700 space-y-1">
                                            {blocks.map(b => (
                                                <div key={b.id} className="bg-slate-800 p-1 rounded">
                                                    <div className="text-gray-300">{b.name} (ID: {b.id})</div>
                                                    <div className="text-gray-500 text-[9px]">Replicas: {b.replicas.join(', ') || 'Pending...'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        {/* DataNodes */}
                        <div className="w-2/3 space-y-2">
                            <div className="text-xs font-bold uppercase text-muted-foreground">DataNodes (Block Storage)</div>
                            <div className="grid grid-cols-2 gap-2">
                                {dataNodes.map(node => (
                                    <div key={node.id} className={`p-2 rounded border transition-colors ${node.status === 'dead' ? 'bg-red-900/20 border-red-900/50' : 'bg-slate-900/50 border-slate-800'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-1">
                                                <Server className={`h-4 w-4 ${node.status === 'dead' ? 'text-red-500' : 'text-green-500'}`} />
                                                <span className="font-bold text-[10px]">{node.id}</span>
                                                <span className="text-[9px] text-muted-foreground">({node.rack})</span>
                                            </div>
                                            {node.status === 'alive' && (
                                                <Button size="icon" variant="ghost" className="h-4 w-4 text-red-400" onClick={() => killNode(node.id)} title="Kill Node">
                                                    <span className="text-[10px]">✕</span>
                                                </Button>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <AnimatePresence>
                                                {node.blocks.map(blkId => (
                                                    <motion.div
                                                        key={blkId}
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="h-6 px-1 bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 rounded text-[9px] flex items-center gap-1"
                                                    >
                                                        <Copy className="h-2 w-2" />
                                                        {blocks.find(b => b.id === blkId)?.name}
                                                    </motion.div>
                                                ))}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-2">
                        Blocks are replicated 3x across racks for fault tolerance. If a node fails, the system (eventually) re-replicates under-replicated blocks.
                    </div>

                </div>
            </Card>
        </div>
    );
}
