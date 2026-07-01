"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import {
    ArrowRight,
    Clock,
    Award,
    PlayCircle,
    CheckCircle2,
    CircleDashed,
    RotateCcw,
    Layers,
    Timer,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ProgressStatus } from "@/types";

export interface HistoryItemData {
    id: string;
    sessionId?: string;
    problemId: string;
    problemSlug: string;
    problemTitle: string;
    status: string;
    score: number | null;
    lastAttemptAt: Date | null;
    attemptNumber?: number;
    stepsCompleted?: number;
    durationMinutes?: number;
}

type HistoryFilter = "All" | "In Progress" | "Completed" | "Review Due";

interface HistoryListProps {
    history: HistoryItemData[];
}

function matchesFilter(item: HistoryItemData, filter: HistoryFilter): boolean {
    if (filter === "All") return true;
    switch (filter) {
        case "In Progress":
            return item.status === "IN_PROGRESS";
        case "Completed":
            return item.status === "COMPLETED";
        case "Review Due":
            return item.status === "REVIEW_NEEDED";
        default: {
            const _exhaustive: never = filter;
            return _exhaustive;
        }
    }
}

function getItemHref(item: HistoryItemData): string {
    if (
        (item.status === "COMPLETED" || item.status === "REVIEW_NEEDED") &&
        item.sessionId
    ) {
        return `/profile/history/${item.sessionId}`;
    }
    return `/practice/${item.problemSlug}`;
}

function getActionLabel(status: string): string {
    switch (status) {
        case "COMPLETED":
            return "Review Solution";
        case "REVIEW_NEEDED":
            return "Review Now";
        default:
            return "Continue Practice";
    }
}

const FILTER_TABS: HistoryFilter[] = ["All", "In Progress", "Completed", "Review Due"];

export function HistoryList({ history }: HistoryListProps) {
    const [filter, setFilter] = useState<HistoryFilter>("All");

    const filteredHistory = useMemo(
        () => history.filter((item) => matchesFilter(item, filter)),
        [history, filter]
    );

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
                        <Link href="/">
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border/40">
                <h2 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground">
                    Recent Activity
                </h2>
                <div className="flex flex-wrap gap-1.5 p-1 bg-muted/50 rounded-xl border border-border/50">
                    {FILTER_TABS.map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setFilter(tab)}
                            className={cn(
                                "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                                filter === tab
                                    ? "bg-background text-foreground shadow-sm border border-border/50"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {filteredHistory.length === 0 ? (
                <Card className="border-dashed bg-muted/20">
                    <CardContent className="py-12 text-center text-muted-foreground">
                        No sessions match this filter.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {filteredHistory.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-5 bg-card hover:bg-accent/5 transition-all duration-300 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-md gap-4 overflow-hidden">
                                <div
                                    className={`absolute left-0 top-0 bottom-0 w-1 transition-colors duration-300 ${getStatusColor(item.status)}`}
                                />

                                <div className="flex-1 min-w-0 flex items-start sm:items-center gap-4">
                                    <div className="p-3 rounded-full bg-secondary/50 ring-1 ring-border/50 group-hover:bg-primary/5 transition-colors shrink-0">
                                        {getStatusIcon(item.status)}
                                    </div>

                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="text-lg font-semibold truncate group-hover:text-primary transition-colors">
                                                {item.problemTitle}
                                            </span>
                                            {getStatusBadge(item.status)}
                                            {item.attemptNumber != null && item.attemptNumber > 0 && (
                                                <Badge variant="outline" className="text-xs font-medium shadow-none">
                                                    {item.attemptNumber === 1
                                                        ? "1 attempt"
                                                        : `${item.attemptNumber} attempts`}
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center text-sm text-muted-foreground gap-x-4 gap-y-1">
                                            <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded text-xs font-medium">
                                                <Clock className="w-3 h-3" />
                                                {item.lastAttemptAt
                                                    ? formatDistanceToNow(new Date(item.lastAttemptAt), {
                                                          addSuffix: true,
                                                      })
                                                    : "Unknown time"}
                                            </span>
                                            {item.stepsCompleted != null && item.stepsCompleted > 0 && (
                                                <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded text-xs font-medium">
                                                    <Layers className="w-3 h-3" />
                                                    {item.stepsCompleted} steps
                                                </span>
                                            )}
                                            {item.durationMinutes != null && item.durationMinutes > 0 && (
                                                <span className="flex items-center gap-1.5 bg-secondary/50 px-2 py-0.5 rounded text-xs font-medium">
                                                    <Timer className="w-3 h-3" />
                                                    {item.durationMinutes} min
                                                </span>
                                            )}
                                            {item.score !== null && (
                                                <span className="flex items-center gap-1.5 font-medium text-foreground/80 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded text-xs border border-yellow-200 dark:border-yellow-900/50">
                                                    <Award className="w-3 h-3 text-yellow-500" />
                                                    Score: {item.score}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    variant="outline"
                                    size="sm"
                                    className="hidden sm:inline-flex shrink-0 gap-2 rounded-full border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all group-hover:translate-x-1 group-hover:shadow-md shadow-sm"
                                >
                                    <Link href={getItemHref(item)}>
                                        {getActionLabel(item.status)}
                                        <PlayCircle className="w-4 h-4" />
                                    </Link>
                                </Button>
                                <Link
                                    href={getItemHref(item)}
                                    className="absolute inset-0 sm:hidden"
                                    aria-label={getActionLabel(item.status)}
                                />
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

function getStatusIcon(status: string) {
    switch (status as ProgressStatus) {
        case "COMPLETED":
            return <CheckCircle2 className="w-6 h-6 text-green-500" />;
        case "REVIEW_NEEDED":
            return <RotateCcw className="w-6 h-6 text-amber-500" />;
        default:
            return <CircleDashed className="w-6 h-6 text-blue-500" />;
    }
}

function getStatusBadge(status: string) {
    switch (status as ProgressStatus) {
        case "COMPLETED":
            return (
                <Badge
                    variant="default"
                    className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200 shadow-none font-medium"
                >
                    Completed
                </Badge>
            );
        case "IN_PROGRESS":
            return (
                <Badge
                    variant="secondary"
                    className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 border-blue-200 dark:border-blue-900 shadow-none font-medium"
                >
                    In Progress
                </Badge>
            );
        case "REVIEW_NEEDED":
            return (
                <Badge
                    variant="secondary"
                    className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200 dark:border-amber-900 shadow-none font-medium"
                >
                    Review Due
                </Badge>
            );
        default:
            return (
                <Badge variant="outline" className="text-muted-foreground shadow-none font-medium">
                    Not Started
                </Badge>
            );
    }
}

function getStatusColor(status: string) {
    switch (status as ProgressStatus) {
        case "COMPLETED":
            return "bg-green-500";
        case "REVIEW_NEEDED":
            return "bg-amber-500";
        case "IN_PROGRESS":
            return "bg-blue-500";
        default:
            return "bg-muted";
    }
}
