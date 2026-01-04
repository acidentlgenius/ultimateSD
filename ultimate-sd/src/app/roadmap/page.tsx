'use client';

import { TRACKS, getRoadmapData } from '@/components/roadmap/RoadmapData';
import { RoadmapNode } from '@/components/roadmap/RoadmapNode';
import { RoadmapPath } from '@/components/roadmap/RoadmapPath';
import { RoadmapTrack } from '@/components/roadmap/RoadmapTypes';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useSearchParams, useRouter } from 'next/navigation';

export default function RoadmapPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const trackParam = searchParams.get('track');

    // Derived state from URL - Single Source of Truth
    const isValidTrack = TRACKS.some(t => t.id === trackParam);
    const selectedTrack = (isValidTrack ? trackParam : 'se') as RoadmapTrack;

    // Only one effect: specific redirection for invalid/missing track
    useEffect(() => {
        if (!isValidTrack) {
            const params = new URLSearchParams(searchParams.toString());
            params.set('track', 'se');
            router.replace(`?${params.toString()}`, { scroll: false });
        }
    }, [isValidTrack, router, searchParams]);

    const handleTrackSelect = (trackId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('track', trackId);
        router.replace(`?${params.toString()}`, { scroll: false });
    };

    const roadmapData = getRoadmapData(selectedTrack);

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/20">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="mb-12 md:mb-16">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                        </Button>
                    </Link>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center max-w-2xl mx-auto"
                    >
                        <div className="inline-block px-3 py-1 rounded-full bg-secondary/50 border border-secondary text-xs font-semibold tracking-wider mb-4 text-primary">
                            ROLE BASED CURRICULUM
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Your Path to <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500">Mastery</span></h1>
                        <p className="text-lg text-muted-foreground mb-8">
                            Choose your career path and solve the exact problems needed to level up.
                        </p>

                        {/* Track Selector */}
                        <div className="flex flex-wrap justify-center gap-2 p-1.5 bg-muted/30 backdrop-blur-md rounded-2xl border border-border/50 shadow-sm inline-flex">
                            {TRACKS.map(track => {
                                const Icon = track.icon;
                                const isSelected = selectedTrack === track.id;
                                return (
                                    <button
                                        key={track.id}
                                        onClick={() => handleTrackSelect(track.id)}
                                        className={cn(
                                            "flex items-center px-4 py-2.5 rounded-xl transition-all duration-300 font-medium text-sm relative overflow-hidden",
                                            isSelected ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                        )}
                                    >
                                        {isSelected && (
                                            <motion.div
                                                layoutId="activeTrack"
                                                className="absolute inset-0 border-2 border-primary/10 rounded-xl"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                        <Icon className={cn("w-4 h-4 mr-2", isSelected ? "text-primary" : "opacity-70")} />
                                        {track.label}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>

                {/* Roadmap Timeline */}
                <div className="relative max-w-5xl mx-auto pb-32 min-h-[500px]">
                    <RoadmapPath />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedTrack}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                        >
                            {roadmapData.map((phase) => (
                                <div key={phase.id} className="mb-24 relative">
                                    {/* Phase Header */}
                                    <div className="flex flex-col items-center justify-center mb-12 text-center relative z-10">
                                        <div className="bg-background/80 backdrop-blur border border-primary/20 px-6 py-2 rounded-full shadow-lg shadow-primary/5">
                                            <h2 className="text-xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">{phase.title}</h2>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2 max-w-md">{phase.description}</p>
                                    </div>

                                    {/* Steps */}
                                    <div className="space-y-4">
                                        {phase.steps.map((step, index) => (
                                            <RoadmapNode
                                                key={step.id}
                                                step={step}
                                                index={index}
                                                isLast={index === phase.steps.length - 1}
                                                align={index % 2 === 0 ? 'left' : 'right'}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
