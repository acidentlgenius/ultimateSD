'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Lock, PlayCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { RoadmapStep } from './RoadmapTypes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface RoadmapNodeProps {
    step: RoadmapStep;
    index: number;
    isLast: boolean;
    align: 'left' | 'right';
}

export function RoadmapNode({ step, index, isLast, align }: RoadmapNodeProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const Icon = step.icon || FileText;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
            case 'in-progress': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
            case 'unlocked': return 'text-primary bg-primary/10 border-primary/20';
            default: return 'text-muted-foreground bg-muted/10 border-muted/20';
        }
    };

    const statusColor = getStatusColor(step.status);
    const isLocked = step.status === 'locked';

    return (
        <div className={cn("relative flex items-start justify-between w-full mb-8", align === 'left' ? 'flex-row-reverse' : '')}>

            {/* Connector Line (Desktop) */}
            <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 h-full flex-col items-center">
                <div className={cn("w-0.5 h-full bg-border/50", isLast ? 'h-0' : '')} />
                <div className={cn("absolute top-0 w-4 h-4 rounded-full border-2 bg-background z-10 box-content",
                    step.status === 'completed' ? 'border-green-500 bg-green-500' : 'border-primary',
                    isLocked ? 'border-muted-foreground bg-muted' : ''
                )} />
            </div>

            {/* Content Spacer for layout balance */}
            <div className="hidden md:block w-5/12" />

            {/* Card Content */}
            <motion.div
                initial={{ opacity: 0, x: align === 'left' ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1 }}
                className={cn("w-full md:w-5/12 relative group", isLocked && "opacity-70 grayscale-[0.5]")}
            >
                <div
                    onClick={() => !isLocked && setIsExpanded(!isExpanded)}
                    className={cn(
                        "rounded-2xl border p-5 backdrop-blur-sm transition-all duration-300 hover:shadow-lg cursor-pointer",
                        statusColor,
                        isLocked ? 'cursor-not-allowed hover:shadow-none' : 'bg-card/50 hover:bg-card/80',
                        isExpanded ? 'ring-2 ring-primary/20' : ''
                    )}>
                    <div className="flex items-start gap-4">
                        <div className={cn("p-2 rounded-xl shrink-0 mt-1", statusColor)}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {step.difficulty && (
                                        <span className={cn("text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border",
                                            step.difficulty === 'Advanced' ? 'border-red-500/30 text-red-500' :
                                                step.difficulty === 'Intermediate' ? 'border-yellow-500/30 text-yellow-500' :
                                                    'border-green-500/30 text-green-500'
                                        )}>
                                            {step.difficulty}
                                        </span>
                                    )}
                                </div>
                                {step.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                {isLocked && <Lock className="w-3 h-3" />}
                            </div>
                            <h3 className="text-lg font-bold truncate pr-2">{step.title}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{step.description}</p>

                            {/* Collapsible Content */}
                            <div className={cn("grid transition-all duration-300 ease-in-out overflow-hidden", isExpanded ? "grid-rows-[1fr] mt-4 opacity-100" : "grid-rows-[0fr] opacity-0")}>
                                <div className="min-h-0 pt-2 border-t border-border/50 space-y-3">
                                    {step.resources && step.resources.map((res, i) => (
                                        <Link
                                            href={res.url || '#'}
                                            key={i}
                                            onClick={(e) => isLocked && e.preventDefault()}
                                            className="flex items-center p-2 rounded-lg hover:bg-muted/50 transition-colors group/link"
                                        >
                                            {res.type === 'video' ? <PlayCircle className="w-4 h-4 mr-3 text-red-500" /> : <FileText className="w-4 h-4 mr-3 text-blue-500" />}
                                            <div className="flex-1">
                                                <div className="text-sm font-medium group-hover/link:text-primary transition-colors">{res.title}</div>
                                                <div className="text-xs text-muted-foreground">{res.duration}</div>
                                            </div>
                                            <div className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Start</div>
                                        </Link>
                                    ))}

                                    {step.problemSlug && (
                                        <Link href={`/practice/${step.problemSlug}`}>
                                            <Button size="sm" className="w-full mt-2 bg-gradient-to-r from-primary to-purple-600 border-0 hover:opacity-90">
                                                Solve Challenge <PlayCircle className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    )}

                                    {!step.problemId && (
                                        <Button size="sm" className="w-full mt-2" variant={step.status === 'completed' ? 'outline' : 'default'}>
                                            {step.status === 'completed' ? 'Review' : 'Mark Complete'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {!isLocked && (
                            <div className="shrink-0 text-muted-foreground">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
