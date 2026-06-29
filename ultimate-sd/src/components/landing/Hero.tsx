"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { LaunchOfferPublicStats } from "@/lib/launch-offer";
import { LaunchOfferBanner } from "@/components/landing/LaunchOfferBanner";

interface HeroProps {
    launchStats?: LaunchOfferPublicStats;
}

export function Hero({ launchStats }: HeroProps) {
    return (
        <div className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40">
            {/* Background Gradients */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-4 relative z-10 text-center">
                {launchStats ? (
                    <LaunchOfferBanner stats={launchStats} />
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-secondary mb-8 backdrop-blur-sm"
                    >
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span className="text-sm font-medium">Now launching — interactive system design practice</span>
                    </motion.div>
                )}

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
                >
                    Master Systems <br className="hidden md:block" />
                    <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
                        That Scale to Billions
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed"
                >
                    Experience the chaos of real-world distributed systems in a risk-free environment.
                    Simulate <strong>flash sales</strong>, secure <strong>secrets</strong>, and optimize <strong>databases</strong> with AI guidance.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Button size="lg" className="h-14 px-8 text-lg rounded-full shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all hover:scale-105" asChild>
                        <Link href="#features">
                            Start Exploring <ArrowRight className="ml-2 h-5 w-5" />
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full hover:bg-secondary/50 backdrop-blur-sm" asChild>
                        <Link href="/draw">
                            <span className="mr-2">🎨</span> Free Canvas
                        </Link>
                    </Button>
                </motion.div>

                {/* Launch signals */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                    className="mt-12 flex flex-col items-center gap-4"
                >
                    <p className="text-sm text-muted-foreground font-medium">
                        Built for engineers preparing for senior &amp; staff system design interviews
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3 max-w-2xl">
                        {['86+ problems', 'Interactive simulations', 'AI step-by-step practice', 'Free canvas'].map((item) => (
                            <span
                                key={item}
                                className="text-xs font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-secondary/50"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-primary/90 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
                        <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                        Launching today — try it free, feedback welcome
                    </div>
                </motion.div>

                {/* Abstract 3D-like Visual Representation */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mt-20 relative mx-auto max-w-5xl aspect-[16/9] hidden md:block"
                >
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-border/50 to-transparent p-[1px] shadow-2xl">
                        <div className="w-full h-full rounded-2xl bg-background/50 backdrop-blur-xl overflow-hidden border border-black/10 dark:border-white/10 relative group">
                            {/* Mock Interface Header */}
                            <div className="h-12 border-b border-black/10 dark:border-white/10 flex items-center px-4 gap-2 bg-black/5 dark:bg-white/5">
                                <div className="flex gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/50" />
                                </div>
                                <div className="mx-auto text-xs font-mono text-muted-foreground opacity-50">ultimatesd_simulation_v1.0.exe</div>
                            </div>

                            {/* Living System Visualization */}
                            <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none">
                                <div className="grid grid-cols-3 gap-12 p-12 w-full h-full opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                                    {/* Client Node */}
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="w-24 h-24 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center animate-float">
                                            <Zap className="w-8 h-8 text-blue-500" />
                                        </div>
                                        <div className="text-sm font-mono text-blue-400">Clients (10k req/s)</div>
                                    </div>

                                    {/* Load Balancer */}
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="w-24 h-24 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
                                            <div className="w-16 h-16 rounded-full border border-dashed border-purple-500 animate-spin-slow" />
                                        </div>
                                        <div className="text-sm font-mono text-purple-400">Load Balancer</div>
                                    </div>

                                    {/* Database Cluster */}
                                    <div className="flex flex-col items-center justify-center gap-4">
                                        <div className="w-24 h-24 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="w-6 h-6 rounded bg-green-500/40 animate-pulse" />
                                                <div className="w-6 h-6 rounded bg-green-500/40 animate-pulse delay-75" />
                                                <div className="w-6 h-6 rounded bg-green-500/40 animate-pulse delay-150" />
                                                <div className="w-6 h-6 rounded bg-green-500/40 animate-pulse delay-300" />
                                            </div>
                                        </div>
                                        <div className="text-sm font-mono text-green-400">Sharded DB</div>
                                    </div>
                                </div>

                                {/* Connection Lines (Simulated) */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                                    <path d="M 300 300 L 500 300" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-dash" />
                                    <path d="M 600 300 L 800 300" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" className="animate-dash" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
