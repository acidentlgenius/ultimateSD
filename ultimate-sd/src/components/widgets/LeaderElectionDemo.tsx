"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, AlertTriangle, Heart, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type NodeState = 'Follower' | 'Candidate' | 'Leader' | 'Dead';

type Node = {
    id: number;
    state: NodeState;
    term: number;
    votes: number;
    timeout: number; // ms remaining
};

export default function LeaderElectionDemo() {
    const [nodes, setNodes] = useState<Node[]>([
        { id: 1, state: 'Leader', term: 1, votes: 0, timeout: 0 },
        { id: 2, state: 'Follower', term: 1, votes: 0, timeout: 50 },
        { id: 3, state: 'Follower', term: 1, votes: 0, timeout: 60 },
        { id: 4, state: 'Follower', term: 1, votes: 0, timeout: 55 },
        { id: 5, state: 'Follower', term: 1, votes: 0, timeout: 70 },
    ]);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [msg, ...prev].slice(0, 5));

    // Simplified Raft-like Loop
    useEffect(() => {
        const interval = setInterval(() => {
            setNodes(prevNodes => {
                const hasLeader = prevNodes.some(n => n.state === 'Leader');
                return prevNodes.map(node => {
                    if (node.state === 'Dead') return node;

                    // LEADER: Send Heartbeats
                    if (node.state === 'Leader') {
                        // Reset everyone's timeout (conceptually)
                        return node;
                    }

                    // FOLLOWER: Countdown
                    if (node.state === 'Follower') {
                        if (hasLeader) {
                            return { ...node, timeout: 50 + Math.random() * 20 }; // Reset by heartbeat
                        } else {
                            const newTimeout = node.timeout - 10;
                            if (newTimeout <= 0) {
                                addLog(`Node ${node.id}: Timeout! Becoming Candidate.`);
                                return { ...node, state: 'Candidate', term: node.term + 1, votes: 1, timeout: 30 }; // Vote for self
                            }
                            return { ...node, timeout: newTimeout };
                        }
                    }

                    // CANDIDATE: Request Votes
                    if (node.state === 'Candidate') {
                        // Simplified: If timeout expires again without majority, retry.
                        // If gets majority, become leader.
                        // Here we just randomly "receive" votes for demo
                        if (Math.random() > 0.3) {
                            const newVotes = node.votes + 1;
                            if (newVotes > prevNodes.length / 2) {
                                addLog(`Node ${node.id}: Won Election! Term ${node.term}`);
                                return { ...node, state: 'Leader' };
                            }
                            return { ...node, votes: newVotes };
                        }
                    }

                    return node;
                });
            });
        }, 500);
        return () => clearInterval(interval);
    }, []);

    const killNode = (id: number) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, state: 'Dead' } : n));
        addLog(`Node ${id} Killed.`);
    };

    const restartNode = (id: number) => {
        setNodes(prev => prev.map(n => n.id === id ? { ...n, state: 'Follower', timeout: 50 } : n));
        addLog(`Node ${id} Restarted.`);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-amber-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Crown className="h-5 w-5 text-amber-500" />
                                Leader Election (Raft-like)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualizing Consensus. Kill the Leader to trigger election.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Activity className="h-3 w-3 animate-pulse text-green-500" />
                            System Active
                        </div>
                    </div>

                    <div className="flex items-center justify-center gap-6 py-6 min-h-[200px]">
                        {nodes.map(node => (
                            <div key={node.id} className="relative group">
                                <motion.div
                                    layout
                                    className={`
                       w-20 h-20 rounded-full flex flex-col items-center justify-center border-4 shadow-xl transition-colors
                       ${node.state === 'Leader' ? 'border-amber-500 bg-amber-500/10' :
                                            node.state === 'Candidate' ? 'border-blue-500 bg-blue-500/10' :
                                                node.state === 'Dead' ? 'border-slate-700 bg-slate-800 opacity-50' :
                                                    'border-green-500 bg-green-500/10'}
                     `}
                                >
                                    {node.state === 'Leader' && <Crown className="h-6 w-6 text-amber-500 mb-1" />}
                                    {node.state === 'Candidate' && <AlertTriangle className="h-6 w-6 text-blue-500 mb-1" />}
                                    {node.state === 'Follower' && <Heart className="h-6 w-6 text-green-500 mb-1" />}
                                    {node.state === 'Dead' && <span className="text-2xl grayscale">💀</span>}

                                    <div className="font-bold text-xs">Node {node.id}</div>
                                    {node.state !== 'Dead' && (
                                        <div className="text-[9px] font-mono mt-1">Term: {node.term}</div>
                                    )}
                                </motion.div>

                                {/* Controls */}
                                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                    {node.state === 'Dead' ? (
                                        <Button size="icon" variant="outline" className="h-6 w-6" aria-label="Restart Node" title="Restart Node" onClick={() => restartNode(node.id)}>↺</Button>
                                    ) : (
                                        <Button size="icon" variant="destructive" className="h-6 w-6" aria-label="Kill Node" title="Kill Node" onClick={() => killNode(node.id)}>✕</Button>
                                    )}
                                </div>

                                {/* Heartbeat Visualization */}
                                {node.state === 'Leader' && (
                                    <div className="absolute inset-0 rounded-full border-4 border-amber-500 animate-ping opacity-20 pointer-events-none" />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="bg-muted/30 p-2 rounded border h-24 overflow-y-auto space-y-1 font-mono text-[10px]">
                        {logs.map((log, i) => (
                            <div key={i} className="text-muted-foreground border-b border-white/5 last:border-0 pb-1">
                                {log}
                            </div>
                        ))}
                    </div>

                    <div className="text-[10px] text-muted-foreground border-t pt-2 flex gap-4 justify-center">
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Leader</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> Candidate</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> Follower</div>
                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-700" /> Dead</div>
                    </div>

                </div>
            </Card>
        </div>
    );
}
