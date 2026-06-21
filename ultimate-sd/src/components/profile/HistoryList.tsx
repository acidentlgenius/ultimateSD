"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, Award, PlayCircle, CheckCircle2, CircleDashed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

export interface HistoryItemData {
    id: string;
    problemId: string;
    problemSlug: string;
    problemTitle: string;
    status: string;
    score: number | null;
    lastAttemptAt: Date | null;
}

interface HistoryListProps {
    history: HistoryItemData[];
}

export function HistoryList({ history }: HistoryListProps) {
    if (history.length === 0) {
        return (
            <Card className="border-dashed bg-muted/30">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="bg-background p-4 rounded-full shadow-sm mb-4 ring-1 ring-border">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No activity yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Start solving system design problems to see your progress history here.
                    </p>
                    <Button asChild size="lg" className="rounded-full font-semibold shadow-lg shadow-primary/20">
                        <Link href="/dashboard">
                            Start Practicing
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">Recent Activity</h2>
            </div>

            <div className="grid gap-4">
                {history.map((item, index) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                    >
                        <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-card hover:bg-accent/5 transition-all duration-300 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-md gap-4 overflow-hidden">
                            {/* Hover Status Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${getStatusColor(item.status)}`} />

                            <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4">
                                <div className={`p-3 rounded-full bg-secondary/50 ring-1 ring-border/50 group-hover:bg-primary/5 transition-colors shrink-0`}>
                                    {item.status === 'COMPLETED' ? (
                                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                                    ) : (
                                        <CircleDashed className="w-6 h-6 text-blue-500" />
                                    )}
                                </div>

                                <div className="space-y-1.5 flex-1 min-w-0">
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold truncate group-hover:text-primary transition-colors">{item.problemTitle}</span>
                                        {getStatusBadge(item.status)}
                                    </div>
                                    <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-1">
                                        <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded text-xs font-medium">
                                            <Clock className="w-3 h-3" />
                                            {item.lastAttemptAt
                                                ? formatDistanceToNow(new Date(item.lastAttemptAt), { addSuffix: true })
                                                : 'Unknown time'}
                                        </span>
                                        {item.score !== null && (
                                            <span className="flex items-center gap-1.5 font-medium text-foreground/80 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-xs border border-yellow-200 dark:border-yellow-900/50">
                                                <Award className="w-3 h-3 text-yellow-500" />
                                                Score: {item.score}%
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex shrink-0 gap-2 rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all group-hover:translate-x-1 group-hover:shadow-md shadow-sm">
                                <Link href={`/practice/${item.problemSlug}`}>
                                    {item.status === 'COMPLETED' ? 'Review Solution' : 'Continue Practice'}
                                    <PlayCircle className="w-4 h-4" />
                                </Link>
                            </Button>
                            {/* Mobile-only Link Overlay */}
                            <Link href={`/practice/${item.problemSlug}`} className="absolute inset-0 sm:hidden" aria-label="Open problem" />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'COMPLETED':
            return <Badge variant="default" className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200 shadow-none font-medium">Completed</Badge>;
        case 'IN_PROGRESS':
            return <Badge variant="secondary" className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200 dark:border-blue-900 shadow-none font-medium">In Progress</Badge>;
        default:
            return <Badge variant="outline" className="text-muted-foreground shadow-none font-medium">Not Started</Badge>;
    }
}

function getStatusColor(status: string) {
    switch (status) {
        case 'COMPLETED': return 'bg-green-500';
        case 'IN_PROGRESS': return 'bg-blue-500';
        default: return 'bg-muted';
    }
}
