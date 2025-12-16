"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Car, Navigation, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// Simple QuadTree implementation for visualization
type Rect = { x: number; y: number; w: number; h: number };
type Point = { id: number; x: number; y: number; type: 'driver' | 'rider' };

interface QuadNode {
    bounds: Rect;
    points: Point[];
    children: QuadNode[] | null;
}

const CAPACITY = 4; // Max points before split

function createQuadTree(bounds: Rect, points: Point[]): QuadNode {
    if (points.length <= CAPACITY) {
        return { bounds, points, children: null };
    }

    const { x, y, w, h } = bounds;
    const mw = w / 2;
    const mh = h / 2;

    const childBounds = [
        { x: x, y: y, w: mw, h: mh },       // TL
        { x: x + mw, y: y, w: mw, h: mh },  // TR
        { x: x, y: y + mh, w: mw, h: mh },  // BL
        { x: x + mw, y: y + mh, w: mw, h: mh } // BR
    ];

    const children = childBounds.map(b => {
        const containedPoints = points.filter(p =>
            p.x >= b.x && p.x < b.x + b.w &&
            p.y >= b.y && p.y < b.y + b.h
        );
        return createQuadTree(b, containedPoints);
    });

    return { bounds, points: [], children };
}

export default function QuadTreeVisualizer() {
    const [points, setPoints] = useState<Point[]>([]);
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize on client only
    useEffect(() => {
        setMounted(true);
        // Add some initial drivers
        const initialPoints: Point[] = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            type: 'driver'
        }));
        setPoints(initialPoints);
    }, []);

    const addPoint = (type: 'driver' | 'rider') => {
        const newPoint: Point = {
            id: Date.now(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            type
        };
        setPoints(prev => [...prev, newPoint]);
    };

    const reset = () => {
        setPoints([]);
    };

    if (!mounted) return <div className="p-12 text-center text-muted-foreground">Loading Map...</div>;

    const root = createQuadTree({ x: 0, y: 0, w: 100, h: 100 }, points);

    // Flatten quadtree for rendering rects
    const getLeafRects = (node: QuadNode): Rect[] => {
        if (!node.children) return [node.bounds];
        return node.children.flatMap(getLeafRects);
    };

    const leafRects = getLeafRects(root);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Controls */}
                    <div className="md:w-1/3 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Navigation className="h-5 w-5 text-primary" />
                                Geospatial Indexing
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Visualizing how a QuadTree subdivides space to optimize searches.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3">
                            <Button onClick={() => addPoint('driver')} variant="secondary" className="justify-start">
                                <Car className="h-4 w-4 mr-2 text-blue-500" />
                                Add Driver
                            </Button>
                            <Button onClick={() => addPoint('rider')} variant="secondary" className="justify-start">
                                <MapPin className="h-4 w-4 mr-2 text-red-500" />
                                Add Rider
                            </Button>
                            <Button onClick={reset} variant="outline" className="justify-start">
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Reset Map
                            </Button>
                        </div>

                        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Total Points:</span>
                                <span className="font-mono font-bold">{points.length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Partitions (Nodes):</span>
                                <span className="font-mono font-bold">{leafRects.length}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Capacity / Cell:</span>
                                <span className="font-mono font-bold">{CAPACITY}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-2 pt-2 border-t">
                                When a cell exceeds {CAPACITY} points, it splits into 4 sub-quadrants. This makes finding "nearest drivers" much faster than searching the whole list.
                            </p>
                        </div>
                    </div>

                    {/* Map Viz */}
                    <div className="md:w-2/3 aspect-square bg-black/5 rounded-xl border border-border relative overflow-hidden" ref={containerRef}>
                        {/* Grid Partitions */}
                        {leafRects.map((rect, i) => (
                            <motion.div
                                key={`rect-${rect.x}-${rect.y}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute border border-primary/30"
                                style={{
                                    left: `${rect.x}%`,
                                    top: `${rect.y}%`,
                                    width: `${rect.w}%`,
                                    height: `${rect.h}%`,
                                }}
                            />
                        ))}

                        {/* Points */}
                        <div className="absolute inset-0">
                            {points.map((p) => (
                                <motion.div
                                    key={p.id}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    layout
                                    className={`absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center
                    ${p.type === 'driver' ? 'z-10' : 'z-20'}
                  `}
                                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                                >
                                    {p.type === 'driver' ? (
                                        <div className="p-1.5 bg-blue-500/20 rounded-full">
                                            <Car className="h-3 w-3 text-blue-600 fill-blue-600" />
                                        </div>
                                    ) : (
                                        <div className="p-1.5 bg-red-500/20 rounded-full animate-pulse">
                                            <MapPin className="h-4 w-4 text-red-600 fill-red-600" />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
