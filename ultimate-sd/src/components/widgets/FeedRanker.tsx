import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Heart, Share2, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Post {
    id: string;
    content: string;
    author: string;
    features: {
        freshness: number; // 0-1
        relevance: number; // 0-1
        engagement: number; // 0-1
    };
    score?: number;
}

const INITIAL_POSTS: Post[] = [
    { id: '1', content: "Just launched my new startup! 🚀", author: "Elon", features: { freshness: 0.9, relevance: 0.8, engagement: 0.95 } },
    { id: '2', content: "Funny cat video 😺", author: "CatLvr", features: { freshness: 0.4, relevance: 0.6, engagement: 0.9 } },
    { id: '3', content: "System Design Interview tips", author: "TechLead", features: { freshness: 0.7, relevance: 0.95, engagement: 0.6 } },
    { id: '4', content: "What I ate for lunch today 🥗", author: "Foodie", features: { freshness: 0.95, relevance: 0.2, engagement: 0.3 } },
    { id: '5', content: "Breaking News: Major event!", author: "NewsBot", features: { freshness: 1.0, relevance: 0.5, engagement: 0.8 } },
];

const FeedRanker: React.FC = () => {
    // Optimization: Removed redundant state 'posts' and useEffect.
    // Instead, deriving rankedPosts directly from weights using useMemo.
    // This prevents double renders on weight changes.
    const [weights, setWeights] = useState({
        freshness: 0.3,
        relevance: 0.5,
        engagement: 0.2
    });

    const rankedPosts = useMemo(() => {
        return [...INITIAL_POSTS].map(post => ({
            ...post,
            score: (
                post.features.freshness * weights.freshness +
                post.features.relevance * weights.relevance +
                post.features.engagement * weights.engagement
            )
        })).sort((a, b) => (b.score || 0) - (a.score || 0));
    }, [weights]);

    return (
        <Card className="w-full max-w-4xl p-6 bg-slate-900 border-rose-500/30 shadow-2xl shadow-rose-500/10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-rose-500/20 rounded-xl border border-rose-500/30">
                        <Sparkles className="w-6 h-6 text-rose-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Feed Ranking Algorithm</h2>
                        <p className="text-sm text-slate-400">Adjust weights to re-order the feed</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Controls Panel */}
                <div className="space-y-6 bg-slate-800/50 p-6 rounded-xl border border-slate-700 h-fit">
                    <h3 className="font-semibold text-white mb-4">Ranking Signals</h3>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-blue-300">
                                    <Clock className="w-4 h-4" /> Freshness
                                </span>
                                <span className="font-mono">{weights.freshness.toFixed(1)}</span>
                            </div>
                            <Slider
                                value={[weights.freshness]}
                                max={1} step={0.1}
                                onValueChange={([v]) => setWeights(prev => ({ ...prev, freshness: v }))}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-green-300">
                                    <Heart className="w-4 h-4" /> Relevance
                                </span>
                                <span className="font-mono">{weights.relevance.toFixed(1)}</span>
                            </div>
                            <Slider
                                value={[weights.relevance]}
                                max={1} step={0.1}
                                onValueChange={([v]) => setWeights(prev => ({ ...prev, relevance: v }))}
                                className="py-2"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-purple-300">
                                    <Share2 className="w-4 h-4" /> Engagement
                                </span>
                                <span className="font-mono">{weights.engagement.toFixed(1)}</span>
                            </div>
                            <Slider
                                value={[weights.engagement]}
                                max={1} step={0.1}
                                onValueChange={([v]) => setWeights(prev => ({ ...prev, engagement: v }))}
                                className="py-2"
                            />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-700">
                        <p className="text-xs text-slate-400">
                            Score = <br />
                            (Freshness × w1) + <br />
                            (Relevance × w2) + <br />
                            (Engagement × w3)
                        </p>
                    </div>
                </div>

                {/* Feed Preview */}
                <div className="lg:col-span-2 space-y-3">
                    <h3 className="font-semibold text-white mb-4 pl-1">Your Personalized Feed</h3>
                    <AnimatePresence mode='popLayout'>
                        {rankedPosts.map((post) => (
                            <motion.div
                                layout
                                key={post.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                className="p-4 bg-slate-800 rounded-lg border border-slate-700 flex justify-between items-start group hover:border-rose-500/50 transition-colors"
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-white">{post.author}</span>
                                        <span className="text-xs text-slate-500">2h ago</span>
                                    </div>
                                    <p className="text-slate-200 mb-3">{post.content}</p>
                                    <div className="flex gap-4 text-xs text-slate-500">
                                        <span className="flex items-center gap-1 group-hover:text-rose-400 transition-colors">
                                            <Heart className="w-3 h-3" /> {Math.round(post.features.engagement * 100)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <MessageCircle className="w-3 h-3" /> {Math.round(post.features.relevance * 50)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex flex-col items-end gap-1">
                                    <Badge variant="secondary" className="bg-slate-900 text-slate-300 font-mono text-xs">
                                        Score: {post.score?.toFixed(2)}
                                    </Badge>
                                    <div className="text-[10px] text-slate-500 grid grid-cols-2 gap-x-2 gap-y-0.5 text-right w-24">
                                        <span>Fresh:</span><span>{post.features.freshness.toFixed(1)}</span>
                                        <span>Rel:</span><span>{post.features.relevance.toFixed(1)}</span>
                                        <span>Eng:</span><span>{post.features.engagement.toFixed(1)}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>
        </Card>
    );
};

export default FeedRanker;
