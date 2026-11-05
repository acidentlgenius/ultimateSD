"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, HardDrive, Trash2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAllSessions, clearSessionState, formatStorageSize, getStorageInfo } from "@/lib/session-storage";
import { PROBLEMS } from "@/lib/problems";

export function OfflineSessionsDashboard() {
    const [sessions, setSessions] = useState<Array<{
        problemSlug: string;
        problemTitle: string;
        lastUpdated: Date;
        stepCount: number;
    }>>([]);
    const [storageInfo, setStorageInfo] = useState({ used: 0, available: true, sessionCount: 0 });
    const [isClient, setIsClient] = useState(false);

    const loadData = () => {
        const rawSessions = getAllSessions();
        const enrichedSessions = rawSessions.map(s => {
            const problem = PROBLEMS.find(p => p.slug === s.problemSlug);
            return {
                ...s,
                problemTitle: problem?.title || s.problemSlug,
            };
        });
        setSessions(enrichedSessions);
        setStorageInfo(getStorageInfo());
    };

    useEffect(() => {
        setIsClient(true);
        loadData();
    }, []);

    const handleClear = (slug: string) => {
        if (confirm("Are you sure you want to delete this offline session? This cannot be undone.")) {
            clearSessionState(slug);
            loadData();
        }
    };

    if (!isClient) return null;

    if (sessions.length === 0) {
        return null;
    }

    return (
        <Card className="mt-8 border-dashed bg-muted/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <HardDrive className="w-5 h-5 text-muted-foreground" />
                    Offline Drafts (Browser Storage)
                </CardTitle>
                <CardDescription>
                    Unsubmitted practice sessions saved locally on this browser ({formatStorageSize(storageInfo.used)} used). Sign in to permanently save your progress to the cloud.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {sessions.map((session) => (
                        <div key={session.problemSlug} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-background/50 transition-colors hover:bg-muted/50">
                            <div>
                                <h4 className="font-semibold text-base mb-1">{session.problemTitle}</h4>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Last active: {formatDistanceToNow(session.lastUpdated, { addSuffix: true })}
                                    </span>
                                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wider font-bold">
                                        {session.stepCount} Steps Completed
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 sm:self-center self-start">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleClear(session.problemSlug)}
                                >
                                    <Trash2 className="w-4 h-4 sm:mr-2" />
                                    <span className="hidden sm:inline">Delete</span>
                                </Button>
                                <Button asChild size="sm">
                                    <Link href={`/practice/${session.problemSlug}`}>
                                        Resume <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
