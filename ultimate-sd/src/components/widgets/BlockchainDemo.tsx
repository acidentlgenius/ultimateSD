import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, Lock, Unlock, Hammer, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Simplified SHA256-like simulation for visual purposes
const mockHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(10, '0').substring(0, 10);
};

interface Block {
    id: number;
    nonce: number;
    data: string;
    prevHash: string;
    hash: string;
    isMined: boolean;
}

const DIFFICULTY_PREFIX = '00'; // Hash must start with this

export default function BlockchainDemo() {
    const [blocks, setBlocks] = useState<Block[]>([
        { id: 1, nonce: 0, data: 'Genesis Block', prevHash: '0000000000', hash: '', isMined: false }
    ]);
    const [miningId, setMiningId] = useState<number | null>(null);
    const mineLoopRef = useRef<NodeJS.Timeout | null>(null);

    // Clean up active mining loop on unmount to prevent memory leaks
    useEffect(() => {
        return () => {
            if (mineLoopRef.current) {
                clearInterval(mineLoopRef.current);
            }
        };
    }, []);

    // Recalculate hashes whenever data/nonce/prevHash changes
    useEffect(() => {
        const newBlocks = [...blocks];
        let changed = false;

        for (let i = 0; i < newBlocks.length; i++) {
            const prev = i === 0 ? '0000000000' : newBlocks[i - 1].hash;
            const rawData = `${newBlocks[i].id}${newBlocks[i].nonce}${newBlocks[i].data}${prev}`;
            const hash = mockHash(rawData);

            // Only update if something changed
            if (newBlocks[i].prevHash !== prev || newBlocks[i].hash !== hash) {
                newBlocks[i].prevHash = prev;
                newBlocks[i].hash = hash;
                // Check if it satisfies difficulty
                newBlocks[i].isMined = hash.startsWith(DIFFICULTY_PREFIX);
                changed = true;
            }
        }

        if (changed) {
            setBlocks(newBlocks);
        }
    }, [blocks]); // Be careful with recursive updates, mockHash is stable

    const addBlock = () => {
        const lastBlock = blocks[blocks.length - 1];
        setBlocks([
            ...blocks,
            {
                id: lastBlock.id + 1,
                nonce: 0,
                data: '',
                prevHash: lastBlock.hash,
                hash: '',
                isMined: false
            }
        ]);
    };

    const updateData = (id: number, data: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, data } : b));
    };

    const mineBlock = async (id: number) => {
        setMiningId(id);
        let nonce = 0;
        const block = blocks.find(b => b.id === id);
        if (!block) return;

        const prev = block.prevHash;
        const data = block.data;
        const blockId = block.id;

        // Simulate async mining loop
        if (mineLoopRef.current) clearInterval(mineLoopRef.current);
        const mineLoop = setInterval(() => {
            nonce += Math.floor(Math.random() * 50) + 1; // Skip ahead a bit for speed
            const raw = `${blockId}${nonce}${data}${prev}`;
            const hash = mockHash(raw);

            // Update UI periodically
            setBlocks(prevBlocks => prevBlocks.map(b =>
                b.id === id ? { ...b, nonce, hash } : b
            ));

            if (hash.startsWith(DIFFICULTY_PREFIX)) {
                clearInterval(mineLoop);
                setMiningId(null);
                toast.success(`Block #${id} Mined!`, { description: `Nonce found: ${nonce}` });
            }

            if (nonce > 100000) { // Safety break
                clearInterval(mineLoop);
                setMiningId(null);
                toast.error("Mining timed out");
            }

        }, 50);
        mineLoopRef.current = mineLoop;
    };

    return (
        <div className="w-full max-w-5xl p-6 bg-amber-50 border border-amber-200 rounded-xl shadow-sm overflow-x-auto mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-amber-900">Blockchain Simulator</h2>
                    <p className="text-sm text-amber-700">Proof-of-Work Visualization (Target: Starts with '{DIFFICULTY_PREFIX}')</p>
                </div>
                <Button onClick={addBlock} className="bg-amber-600 hover:bg-amber-700">
                    Add New Block
                </Button>
            </div>

            <div className="flex gap-4 pb-4 items-start min-w-max">
                {blocks.map((block, index) => (
                    <React.Fragment key={block.id}>
                        <motion.div
                            layout
                            className={`
                    w-72 p-4 rounded-xl border-2 transition-all shadow-md flex-shrink-0
                    ${block.isMined ? 'bg-black dark:bg-white border-emerald-500' : 'bg-red-50 border-red-500'}
                  `}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <Badge variant={block.isMined ? "default" : "destructive"} className={block.isMined ? "bg-emerald-600" : ""}>
                                    {block.isMined ? "VALID" : "INVALID"}
                                </Badge>
                                <div className="text-xs font-mono text-slate-400">Block #{block.id}</div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs uppercase text-slate-500 font-bold">Data</label>
                                    <Input
                                        value={block.data}
                                        onChange={(e) => updateData(block.id, e.target.value)}
                                        className="mt-1 font-mono text-sm bg-slate-50"
                                        placeholder="Transaction Data..."
                                    />
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-slate-500 font-bold">Previous Hash</label>
                                    <div className="text-xs font-mono p-2 bg-slate-100 rounded text-slate-600 truncate">
                                        {block.prevHash}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs uppercase text-slate-500 font-bold">Hash</label>
                                    <div className={`text-xs font-mono p-2 rounded truncate transition-colors font-bold
                            ${block.isMined ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}
                         `}>
                                        {block.hash}
                                    </div>
                                </div>

                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="text-xs uppercase text-slate-500 font-bold">Nonce</label>
                                        <div className="text-sm font-mono p-2 bg-slate-100 rounded text-slate-800">
                                            {block.nonce}
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => mineBlock(block.id)}
                                        disabled={block.isMined || miningId !== null}
                                        size="sm"
                                        className={block.isMined ? "bg-slate-200 text-slate-400" : "bg-blue-600 hover:bg-blue-700"}
                                    >
                                        {miningId === block.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Hammer className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        {index < blocks.length - 1 && (
                            <div className="self-center">
                                <Link className={`w-6 h-6 ${blocks[index + 1].prevHash === block.hash ? 'text-slate-400' : 'text-red-500 animate-pulse'}`} />
                            </div>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
}
