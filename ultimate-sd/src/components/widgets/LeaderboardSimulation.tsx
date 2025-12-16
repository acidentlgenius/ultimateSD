"use client";

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trophy, Medal, Star, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Player = {
    id: string;
    name: string;
    score: number;
    rank: number;
};

export default function LeaderboardSimulation() {
    const [players, setPlayers] = useState<Player[]>([
        { id: '1', name: 'Alice', score: 1200, rank: 1 },
        { id: '2', name: 'Bob', score: 1100, rank: 2 },
        { id: '3', name: 'Charlie', score: 950, rank: 3 },
    ]);
    const [nameInput, setNameInput] = useState('');
    const [scoreInput, setScoreInput] = useState('');

    const updateScore = () => {
        if (!nameInput || !scoreInput) return;
        const score = parseInt(scoreInput);
        if (isNaN(score)) return;

        // Use a map to handle updates vs inserts
        const playerMap = new Map(players.map(p => [p.name, p]));
        const existing = playerMap.get(nameInput);

        if (existing) {
            // Increment score (ZINCRBY)
            existing.score += score;
        } else {
            // Add new player (ZADD)
            playerMap.set(nameInput, {
                id: Math.random().toString(36).substr(2, 9),
                name: nameInput,
                score: score,
                rank: 0 // Will be recalculated
            });
        }

        // Convert back to array and sort (Redis Sorted Set logic)
        const sorted = Array.from(playerMap.values())
            .sort((a, b) => b.score - a.score)
            .map((p, index) => ({ ...p, rank: index + 1 }));

        setPlayers(sorted.slice(0, 5)); // Keep top 5 for visualization
        setNameInput('');
        setScoreInput('');
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-yellow-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-yellow-500" />
                                Real-time Ranking (ZSET)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualizing O(log N) updates using Sorted Sets.
                            </p>
                        </div>
                        <div className="text-xs font-mono bg-muted px-2 py-1 rounded border">
                            Sorted by Score DESC
                        </div>
                    </div>

                    <div className="flex gap-4 items-end">
                        <div className="space-y-1 flex-1">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Player Name</label>
                            <Input
                                value={nameInput} onChange={e => setNameInput(e.target.value)}
                                placeholder="e.g. David" className="h-8 text-xs font-mono"
                                onKeyDown={e => e.key === 'Enter' && updateScore()}
                            />
                        </div>
                        <div className="space-y-1 w-24">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground">Score (+)</label>
                            <Input
                                value={scoreInput} onChange={e => setScoreInput(e.target.value)}
                                placeholder="100" type="number" className="h-8 text-xs font-mono"
                                onKeyDown={e => e.key === 'Enter' && updateScore()}
                            />
                        </div>
                        <Button onClick={updateScore} size="sm" className="h-8 bg-yellow-500 hover:bg-yellow-600 text-black">
                            Update Rank
                        </Button>
                    </div>

                    {/* Leaderboard List */}
                    <div className="space-y-2 relative min-h-[250px] bg-muted/20 rounded-lg p-4 border border-border/50">
                        <AnimatePresence mode="popLayout">
                            {players.map((player) => (
                                <motion.div
                                    key={player.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                                    className={`
                    flex items-center justify-between p-3 rounded-lg border shadow-sm
                    ${player.rank === 1 ? 'bg-yellow-500/10 border-yellow-500/50' : 'bg-card border-border'}
                    ${player.rank === 2 ? 'bg-slate-300/10 border-slate-300/50' : ''}
                    ${player.rank === 3 ? 'bg-orange-700/10 border-orange-700/50' : ''}
                  `}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                      ${player.rank === 1 ? 'text-yellow-600' : ''}
                      ${player.rank === 2 ? 'text-slate-500' : ''}
                      ${player.rank === 3 ? 'text-orange-700' : ''}
                      ${player.rank > 3 ? 'text-muted-foreground' : ''}
                    `}>
                                            {player.rank === 1 ? <Trophy className="h-5 w-5" /> :
                                                player.rank === 2 ? <Medal className="h-5 w-5" /> :
                                                    player.rank === 3 ? <Medal className="h-5 w-5" /> :
                                                        `#${player.rank}`}
                                        </div>
                                        <div>
                                            <div className="font-bold flex items-center gap-2">
                                                {player.name}
                                                {player.rank === 1 && <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 animate-pulse" />}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-mono font-bold text-lg tabular-nums">
                                        {player.score.toLocaleString()}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {players.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground italic text-xs">
                                Start adding players...
                            </div>
                        )}
                    </div>

                </div>
            </Card>
        </div>
    );
}
