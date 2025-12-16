"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Wifi, Video, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Quality = '4k' | '1080p' | '720p' | '360p';

const BITRATES = {
    '4k': 15,    // Mbps
    '1080p': 5,
    '720p': 2.5,
    '360p': 1
};

export default function ABRSimulator() {
    const [bandwidth, setBandwidth] = useState([8]); // Mbps
    const [buffer, setBuffer] = useState(10); // Seconds
    const [quality, setQuality] = useState<Quality>('1080p');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);

    // ABR Logic Loop
    useEffect(() => {
        if (!isPlaying) return;

        const interval = setInterval(() => {
            // Simulate buffer consumption/filling
            setBuffer(prev => {
                const currentBitrate = BITRATES[quality];
                const downloadRate = bandwidth[0];

                // If download > bitrate, buffer grows. Else shrinks.
                // Simplified model: net change per second
                const change = (downloadRate / currentBitrate) - 1;
                const newBuffer = Math.max(0, Math.min(30, prev + change));

                // Check buffering state
                if (newBuffer < 1) setIsBuffering(true);
                if (newBuffer > 5) setIsBuffering(false);

                return newBuffer;
            });

            // Adaptive Switching Logic
            const currentBw = bandwidth[0];
            setQuality(prev => {
                if (currentBw > 20 && buffer > 15) return '4k';
                if (currentBw < 2 && prev !== '360p') return '360p'; // Panic switch

                // Smooth transitions
                if (currentBw > 8 && prev === '720p') return '1080p';
                if (currentBw < 4 && prev === '1080p') return '720p';

                return prev;
            });

        }, 1000);

        return () => clearInterval(interval);
    }, [isPlaying, bandwidth, quality, buffer]);

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-red-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row gap-8">

                    {/* Controls */}
                    <div className="md:w-1/3 space-y-6">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Video className="h-5 w-5 text-red-500" />
                                Adaptive Bitrate (ABR)
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Simulate network fluctuations and see how the player adjusts quality to prevent buffering.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="flex items-center gap-2 font-medium">
                                        <Wifi className="h-4 w-4 text-blue-500" /> Available Bandwidth
                                    </span>
                                    <span className="font-mono text-xs">{bandwidth[0]} Mbps</span>
                                </div>
                                <Slider
                                    value={bandwidth}
                                    max={25}
                                    step={0.5}
                                    onValueChange={setBandwidth}
                                    className="cursor-pointer"
                                />
                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                    <span>Slow (3G)</span>
                                    <span>Fast (Fiber)</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Current Bitrate:</span>
                                    <span className="font-mono font-bold text-red-400">{BITRATES[quality]} Mbps</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Buffer Health:</span>
                                    <span className={`font-mono font-bold ${buffer < 5 ? 'text-yellow-500' : 'text-green-500'}`}>
                                        {buffer.toFixed(1)}s
                                    </span>
                                </div>
                            </div>

                            <Button
                                onClick={() => setIsPlaying(!isPlaying)}
                                variant={isPlaying ? "destructive" : "default"}
                                className="w-full"
                            >
                                {isPlaying ? "Pause Stream" : "Start Stream"}
                            </Button>
                        </div>
                    </div>

                    {/* Player Viz */}
                    <div className="md:w-2/3 flex items-center justify-center p-8 bg-black rounded-lg aspect-video relative overflow-hidden">

                        {/* Background "Video" */}
                        <motion.div
                            className="absolute inset-0 bg-gradient-to-tr from-gray-900 to-gray-800"
                            animate={{ opacity: isBuffering ? 0.5 : 1 }}
                        >
                            {/* Simulated Video Content */}
                            <div className="w-full h-full flex items-center justify-center">
                                <motion.div
                                    animate={{ rotate: isPlaying && !isBuffering ? 360 : 0 }}
                                    transition={{ ease: "linear", duration: 10, repeat: Infinity }}
                                    className="w-32 h-32 rounded-full border-4 border-dashed border-white/20"
                                />
                            </div>
                        </motion.div>

                        {/* Quality Badge (Center) */}
                        <div className="z-10 text-center space-y-2">
                            {isBuffering ? (
                                <div className="flex flex-col items-center animate-pulse">
                                    <AlertTriangle className="h-12 w-12 text-yellow-500 mb-2" />
                                    <span className="text-white font-bold text-xl">Buffering...</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <Badge variant="outline" className={`text-2xl px-4 py-2 bg-black/50 backdrop-blur border-2 ${quality === '4k' ? 'border-purple-500 text-purple-400' :
                                            quality === '1080p' ? 'border-green-500 text-green-400' :
                                                quality === '720p' ? 'border-blue-500 text-blue-400' :
                                                    'border-red-500 text-red-400'
                                        }`}>
                                        {quality.toUpperCase()}
                                    </Badge>
                                    <span className="text-white/50 text-xs mt-2 font-mono">
                                        Resolution
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Debug Info Overlay */}
                        <div className="absolute top-2 right-2 text-[10px] font-mono text-white/30 text-right">
                            <div>BUF: {buffer.toFixed(1)}s</div>
                            <div>BW: {bandwidth[0]}Mbps</div>
                        </div>

                    </div>
                </div>
            </Card>
        </div>
    );
}
