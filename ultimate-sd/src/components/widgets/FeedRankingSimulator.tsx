"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, TrendingUp, User } from 'lucide-react';
import { motion, Reorder } from 'framer-motion';

interface Post {
    id: string;
    author: string;
    content: string;
    recency: number; // 0-100 (100 = very new)
    affinity: number; // 0-100 (100 = close friend)
    popularity: number; // 0-100 (100 = viral)
    score?: number;
}

const INITIAL_POSTS: Post[] = [
    { id: '1', author: 'Best Friend', content: 'Just got married! 💍', recency: 80, affinity: 95, popularity: 40 },
    { id: '2', author: 'Viral Page', content: 'You wont believe this... 😱', recency: 90, affinity: 10, popularity: 99 },
    { id: '3', author: 'Old Friend', content: 'Throwback Thursday 📸', recency: 20, affinity: 70, popularity: 30 },
    { id: '4', author: 'Celebrity', content: 'New movie out now! 🎥', recency: 60, affinity: 30, popularity: 95 },
    { id: '5', author: 'Acquaintance', content: 'Nice lunch today 🥗', recency: 95, affinity: 20, popularity: 10 },
];

export default function FeedRankingSimulator() {
    const [weights, setWeights] = useState({ recency: 33, affinity: 33, popularity: 33 });
    const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);

    // Recalculate scores when weights change
    useEffect(() => {
        const scoredPosts = INITIAL_POSTS.map(post => {
            const score = (
                (post.recency * weights.recency) +
                (post.affinity * weights.affinity) +
                (post.popularity * weights.popularity)
            ) / 100;
            return { ...post, score };
        });

        // Sort by score descending
        scoredPosts.sort((a, b) => b.score! - a.score!);
        setPosts(scoredPosts);
    }, [weights]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Controls */}
                    <div className="md:w-1/3 space-y-8">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                Feed Ranking Algo
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Adjust the weights to see how the feed reorders.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2 font-medium">
                                        <Clock className="h-4 w-4 text-blue-500" /> Recency
                                    </span>
                                    <span className="font-mono text-xs">{weights.recency}%</span>
                                </div>
                                <Slider
                                    value={[weights.recency]}
                                    max={100}
                                    step={1}
                                    onValueChange={(v: number[]) => setWeights(prev => ({ ...prev, recency: v[0] }))}
                                    className="cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2 font-medium">
                                        <Heart className="h-4 w-4 text-pink-500" /> Affinity (Relationship)
                                    </span>
                                    <span className="font-mono text-xs">{weights.affinity}%</span>
                                </div>
                                <Slider
                                    value={[weights.affinity]}
                                    max={100}
                                    step={1}
                                    onValueChange={(v: number[]) => setWeights(prev => ({ ...prev, affinity: v[0] }))}
                                    className="cursor-pointer"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2 font-medium">
                                        <TrendingUp className="h-4 w-4 text-orange-500" /> Popularity
                                    </span>
                                    <span className="font-mono text-xs">{weights.popularity}%</span>
                                </div>
                                <Slider
                                    value={[weights.popularity]}
                                    max={100}
                                    step={1}
                                    onValueChange={(v: number[]) => setWeights(prev => ({ ...prev, popularity: v[0] }))}
                                    className="cursor-pointer"
                                />
                            </div>
                        </div>

                        <div className="p-3 bg-muted/30 rounded-lg text-xs font-mono">
                            Formula: Score = (R*wR + A*wA + P*wP)
                        </div>
                    </div>

                    {/* Feed Preview */}
                    <div className="md:w-2/3">
                        <h4 className="font-semibold mb-4 flex items-center gap-2">
                            <User className="h-4 w-4" />
                            User's Feed Preview
                        </h4>

                        <div className="space-y-3">
                            {posts.map((post, i) => (
                                <motion.div
                                    layout
                                    key={post.id}
                                    initial={false}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    className="p-4 rounded-xl border border-border bg-background shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-bold text-sm">{post.author}</div>
                                        <Badge variant="outline" className="font-mono text-xs">Score: {post.score?.toFixed(0)}</Badge>
                                    </div>
                                    <p className="text-sm mb-3">{post.content}</p>

                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1" title="Recency">
                                            <Clock className="h-3 w-3" /> {post.recency}
                                        </div>
                                        <div className="flex items-center gap-1" title="Affinity">
                                            <Heart className="h-3 w-3" /> {post.affinity}
                                        </div>
                                        <div className="flex items-center gap-1" title="Popularity">
                                            <TrendingUp className="h-3 w-3" /> {post.popularity}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
