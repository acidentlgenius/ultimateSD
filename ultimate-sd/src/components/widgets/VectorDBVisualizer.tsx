import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, Target, Layers, ArrowRight, Zap, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

// Types for our vector points
interface VectorPoint {
    id: string;
    x: number;
    y: number;
    label: string;
    category: 'king' | 'food' | 'tech' | 'city';
}

// Mock dataset representing semantic concepts
const DATASET: VectorPoint[] = [
    { id: '1', x: 80, y: 80, label: 'King', category: 'king' },
    { id: '2', x: 75, y: 75, label: 'Queen', category: 'king' },
    { id: '3', x: 82, y: 70, label: 'Prince', category: 'king' },
    { id: '4', x: 20, y: 30, label: 'Apple', category: 'food' },
    { id: '5', x: 25, y: 25, label: 'Banana', category: 'food' },
    { id: '6', x: 22, y: 35, label: 'Orange', category: 'food' },
    { id: '7', x: 60, y: 30, label: 'Laptop', category: 'tech' },
    { id: '8', x: 65, y: 35, label: 'Phone', category: 'tech' },
    { id: '9', x: 55, y: 25, label: 'Server', category: 'tech' },
    { id: '10', x: 30, y: 80, label: 'Paris', category: 'city' },
    { id: '11', x: 35, y: 85, label: 'London', category: 'city' },
    { id: '12', x: 25, y: 75, label: 'Tokyo', category: 'city' },
];

const VectorDBVisualizer: React.FC = () => {
    const [queryPos, setQueryPos] = useState({ x: 50, y: 50 });
    const [k, setK] = useState(3);
    const [results, setResults] = useState<{ point: VectorPoint; score: number }[]>([]);
    const [viewMode, setViewMode] = useState<'flat' | 'hnsw'>('flat');
    const [isSearching, setIsSearching] = useState(false);
    const graphRef = useRef<HTMLDivElement>(null);

    // Search Logic (Cosine Similarity implied by Euclidean distance in this simple 2D view)
    useEffect(() => {
        const performSearch = () => {
            // Calculate distances
            const calculated = DATASET.map((point) => {
                const dx = point.x - queryPos.x;
                const dy = point.y - queryPos.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                // Normalize score 0-1 based on max possible distance in 100x100 grid
                const score = Math.max(0, 1 - distance / 50);
                return { point, score };
            });

            // Sort by score desc
            const sorted = calculated.sort((a, b) => b.score - a.score).slice(0, k);
            setResults(sorted);
        };

        if (viewMode === 'flat') {
            performSearch();
        } else {
            // Small delay to simulate HNSW layer traversal
            performSearch();
        }
    }, [queryPos, k, viewMode]);

    const handleGraphClick = (e: React.MouseEvent) => {
        if (!graphRef.current) return;
        const rect = graphRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100; // Inverted Y for cartesian feel? No, let's keep web coords
        // Keep within bounds
        setQueryPos({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, 100 - ((e.clientY - rect.top) / rect.height) * 100)), // Actually let's flip Y to match standard graphing
        });
    };

    // Convert logical coordinates (0-100) to CSS percentage
    // Logical Y=0 is bottom, Y=100 is top.
    const toCSS = (p: { x: number; y: number }) => ({
        left: `${p.x}%`,
        bottom: `${p.y}%`,
    });

    return (
        <div className="p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl font-sans max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                        <Database className="w-6 h-6 text-cyan-400" />
                        Vector Database Visualizer
                    </h2>
                    <p className="text-slate-400 text-sm mt-1">
                        Explore high-dimensional embedding spaces and Nearest Neighbor search.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant={viewMode === 'flat' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('flat')}
                        className="text-xs"
                    >
                        <Search className="w-3 h-3 mr-1" /> Flat Search
                    </Button>
                    <Button
                        variant={viewMode === 'hnsw' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => setViewMode('hnsw')}
                        className="text-xs"
                    >
                        <Layers className="w-3 h-3 mr-1" /> HNSW Index
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Graph Area */}
                <div className="md:col-span-2 space-y-4">
                    <Card
                        className="relative bg-slate-900/50 border-slate-800 h-96 w-full overflow-hidden cursor-crosshair group"
                        ref={graphRef}
                        onClick={(e) => {
                            if (!graphRef.current) return;
                            const rect = graphRef.current.getBoundingClientRect();
                            const x = ((e.clientX - rect.left) / rect.width) * 100;
                            const flippedY = 100 - ((e.clientY - rect.top) / rect.height) * 100;
                            setQueryPos({ x, y: flippedY });
                        }}
                    >
                        {/* Grid Lines */}
                        <div className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                backgroundImage: 'linear-gradient(#475569 1px, transparent 1px), linear-gradient(90deg, #475569 1px, transparent 1px)',
                                backgroundSize: '20px 20px'
                            }}
                        />

                        {/* Data Points */}
                        <AnimatePresence>
                            {DATASET.map((p) => {
                                const isResult = results.some(r => r.point.id === p.id);
                                const resultIndex = results.findIndex(r => r.point.id === p.id);

                                return (
                                    <motion.div
                                        key={p.id}
                                        className={`absolute w-3 h-3 rounded-full flex items-center justify-center -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 ${isResult ? 'bg-cyan-400 z-20 scale-125 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-600 z-10'
                                            }`}
                                        style={toCSS(p)}
                                        initial={false}
                                        animate={toCSS(p)}
                                    >
                                        {/* Label on Hover */}
                                        <span className="absolute bottom-full mb-2 px-2 py-1 bg-slate-800 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap border border-slate-700 pointer-events-none transition-opacity">
                                            {p.label}
                                        </span>

                                        {/* Rank Badge if in results */}
                                        {isResult && (
                                            <span className="absolute -top-4 -right-4 bg-blue-600 text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                                                {resultIndex + 1}
                                            </span>
                                        )}
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>

                        {/* Query Point */}
                        <motion.div
                            className="absolute w-4 h-4 border-2 border-white rounded-full bg-transparent shadow-[0_0_15px_rgba(255,255,255,0.8)] z-30 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
                            style={toCSS(queryPos)}
                            animate={toCSS(queryPos)}
                            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        >
                            <div className="w-1 h-1 bg-black dark:bg-white rounded-full" />
                            <div className="absolute w-20 h-20 border border-white/10 rounded-full animate-ping" />
                        </motion.div>

                        {/* Connecting Lines to Results */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                            {results.map((r, i) => (
                                <motion.line
                                    key={`line-${r.point.id}`}
                                    x1={`${queryPos.x}%`} // SVG checks coordinates from top-left, need to map our cartesian-web hybrid
                                    y1={`${100 - queryPos.y}%`}
                                    x2={`${r.point.x}%`}
                                    y2={`${100 - r.point.y}%`}
                                    stroke="rgba(34, 211, 238, 0.3)"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    initial={{ pathLength: 0, opacity: 0 }}
                                    animate={{ pathLength: 1, opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            ))}
                        </svg>

                        {viewMode === 'hnsw' && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded border border-slate-700 text-[10px] text-slate-400">
                                Layer 0 (Base)
                            </div>
                        )}
                    </Card>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Index Type</div>
                            <div className="flex items-center gap-2 font-mono text-sm text-cyan-200">
                                {viewMode === 'flat' ? 'Brute Force (Flat)' : 'HNSW (Graph)'}
                            </div>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                            <div className="text-xs text-slate-500 mb-1">Distance Metric</div>
                            <div className="flex items-center gap-2 font-mono text-sm text-purple-200">
                                Cosine Similarity
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Controls & Results */}
                <div className="space-y-6">
                    <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-slate-300">Top K Neighbors</span>
                            <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-cyan-400">{k}</span>
                        </div>
                        <Slider
                            value={[k]}
                            min={1}
                            max={5}
                            step={1}
                            onValueChange={(val) => setK(val[0])}
                            className="py-2"
                        />
                    </div>

                    <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Search Results</h3>
                        <AnimatePresence mode="popLayout">
                            {results.map((r, i) => (
                                <motion.div
                                    key={r.point.id}
                                    layout
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-800 text-xs font-bold text-slate-400 group-hover:bg-cyan-900 group-hover:text-cyan-200 transition-colors">
                                            {i + 1}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium text-slate-200">{r.point.label}</div>
                                            <div className="text-[10px] text-slate-500 capitalize">{r.point.category}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs font-mono text-emerald-400">
                                            {(r.score * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-[10px] text-slate-600">match</div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {results.length === 0 && (
                            <div className="text-center py-8 text-slate-500 text-sm italic">
                                No results found near query.
                            </div>
                        )}
                    </div>

                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-900/50">
                        <div className="flex items-start gap-2">
                            <Settings className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                            <p className="text-xs text-blue-200/80 leading-relaxed">
                                <strong>How it works:</strong> Objects are converted into vectors (numbers). Similar objects are mathematically efficiently close to each other in this space.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VectorDBVisualizer;
