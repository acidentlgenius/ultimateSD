'use client';

import { motion } from 'framer-motion';
import { Code, Server, Brain, Bot, ArrowRight, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TRACKS = [
    {
        id: 'se',
        label: 'Software Engineer',
        description: 'Master the fundamentals of scalable web apps.',
        icon: Code,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10',
        gradient: 'from-blue-500/20 to-cyan-500/20'
    },
    {
        id: 'sse',
        label: 'Senior SE',
        description: 'Deep dive into distributed systems patterns.',
        icon: Server,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10',
        gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
        id: 'mlops',
        label: 'MLOps & MLE',
        description: 'Deploying and scaling machine learning models.',
        icon: Brain,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
        gradient: 'from-emerald-500/20 to-green-500/20'
    },
    {
        id: 'agentic-ai',
        label: 'Agentic AI',
        description: 'Building autonomous agent orchestrators.',
        icon: Bot,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10',
        gradient: 'from-orange-500/20 to-red-500/20'
    }
];

export function RoadmapPreview() {
    return (
        <div className="py-24 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-3xl -z-10" />

            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
                    <div className="max-w-2xl">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">
                            Structured Learning Paths
                        </h2>
                        <p className="text-lg text-muted-foreground">
                            Not sure where to start? Follow our carefully curated roadmaps tailored for different engineering roles.
                            From Junior to Staff Engineer, we have a path for you.
                        </p>
                    </div>
                    <Link href="/roadmap">
                        <Button size="lg" variant="outline" className="h-12 px-8 rounded-full border-primary/20 hover:bg-primary/5 group">
                            View All Roadmaps <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {TRACKS.map((track, index) => (
                        <motion.div
                            key={track.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <Link href={`/roadmap?track=${track.id}`} className="block h-full group">
                                <div className="relative h-full bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 transition-all duration-500 hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 overflow-hidden">

                                    {/* Hover Gradient Background */}
                                    <div className={cn(
                                        "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br",
                                        track.gradient
                                    )} />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 shadow-inner", track.bg)}>
                                            <track.icon className={cn("w-7 h-7", track.color)} />
                                        </div>

                                        <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors duration-300">{track.label}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 flex-grow leading-relaxed">
                                            {track.description}
                                        </p>

                                        <div className="flex items-center text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">
                                            Start Path
                                            <motion.span
                                                initial={{ x: 0 }}
                                                whileHover={{ x: 5 }}
                                                className="inline-block ml-1"
                                            >
                                                <ArrowRight className="w-4 h-4" />
                                            </motion.span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
