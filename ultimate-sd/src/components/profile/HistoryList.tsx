"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Clock, Award, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface HistoryItemData {
    id: string;
    problemId: string;
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
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="bg-muted p-4 rounded-full mb-4">
                        <Clock className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No activity yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-6">
                        Start solving system design problems to see your progress history here.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard">Start Practicing</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight">Recent Activity</h2>
            </div>

            <div className="space-y-3">
                {history.map((item) => (
                    <div
                        key={item.id}
                        className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card hover:bg-accent/5 transition-colors rounded-lg border shadow-sm gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold truncate">{item.problemTitle}</span>
                                {getStatusBadge(item.status)}
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground gap-3">
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {item.lastAttemptAt
                                        ? formatDistanceToNow(new Date(item.lastAttemptAt), { addSuffix: true })
                                        : 'Unknown time'}
                                </span>
                                {item.score !== null && (
                                    <span className="flex items-center gap-1 font-medium text-foreground/80">
                                        <Award className="w-3 h-3 text-yellow-500" />
                                        Score: {item.score}%
                                    </span>
                                )}
                            </div>
                        </div>

                        <Button asChild variant="ghost" size="sm" className="shrink-0 gap-1 group-hover:bg-primary/10 group-hover:text-primary">
                            <Link href={`/practice/${item.problemId}`}>
                                {item.status === 'COMPLETED' ? 'Review' : 'Continue'}
                                <ArrowRight className="w-4 h-4 ml-1" />
                            </Link>
                        </Button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getStatusBadge(status: string) {
    switch (status) {
        case 'COMPLETED':
            return <Badge variant="default" className="bg-green-500 hover:bg-green-600">Completed</Badge>;
        case 'IN_PROGRESS':
            return <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 border-blue-200 dark:border-blue-900 border">In Progress</Badge>;
        default:
            return <Badge variant="outline" className="text-muted-foreground">Not Started</Badge>;
    }
}
