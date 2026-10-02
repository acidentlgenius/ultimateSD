'use client';

import { useState, useEffect } from 'react';
import { getAllSessions, clearSessionState, getStorageInfo, formatStorageSize } from '@/lib/session-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, HardDrive, RefreshCw, AlertCircle, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface SessionDashboardClientProps {
    isLoggedIn: boolean;
}

export function SessionDashboardClient({ isLoggedIn }: SessionDashboardClientProps) {
    const [sessions, setSessions] = useState<Array<{ problemSlug: string; lastUpdated: Date; stepCount: number }>>([]);
    const [storageInfo, setStorageInfo] = useState({ used: 0, available: false, sessionCount: 0 });
    const [isClient, setIsClient] = useState(false);

    const loadData = () => {
        setSessions(getAllSessions());
        setStorageInfo(getStorageInfo());
    };

    useEffect(() => {
        setIsClient(true);
        loadData();
    }, []);

    const handleClearSession = (slug: string) => {
        if (confirm('Are you sure you want to delete this offline session? This cannot be undone.')) {
            clearSessionState(slug);
            loadData();
        }
    };

    const handleClearAll = () => {
        if (confirm('Are you sure you want to delete ALL offline sessions? This cannot be undone.')) {
            sessions.forEach(s => clearSessionState(s.problemSlug));
            loadData();
        }
    };

    if (!isClient) return null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Offline Sessions</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your in-progress practice sessions saved in this browser's local storage.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={loadData}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                    </Button>
                    {sessions.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleClearAll}>
                            <Trash2 className="h-4 w-4 mr-2" /> Clear All
                        </Button>
                    )}
                </div>
            </div>

            {isLoggedIn && sessions.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-600 dark:text-amber-400">
                        <p className="font-semibold mb-1">You are logged in</p>
                        <p>These offline sessions are drafts saved only in this browser. To permanently save your progress, ensure you complete the problems and submit them to your account history.</p>
                    </div>
                </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
                <Card className="md:col-span-1">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                            <HardDrive className="h-4 w-4" /> Storage Usage
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatStorageSize(storageInfo.used)}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {storageInfo.sessionCount} session{storageInfo.sessionCount !== 1 ? 's' : ''} saved locally
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Saved Drafts</h3>
                {sessions.length === 0 ? (
                    <Card className="bg-muted/30 border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <HardDrive className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">No local sessions found</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                Your browser storage is empty. Start a new practice problem, and your progress will automatically save here as you complete steps.
                            </p>
                            <Button asChild className="mt-6" variant="outline">
                                <Link href="/problems">Browse Problems</Link>
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {sessions.map((session) => (
                            <Card key={session.problemSlug} className="flex flex-col group relative overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg truncate" title={session.problemSlug.replace(/-/g, ' ')}>
                                        {session.problemSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                                    </CardTitle>
                                    <CardDescription>
                                        Last updated {formatDistanceToNow(session.lastUpdated, { addSuffix: true })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1">
                                    <div className="text-sm font-medium bg-muted w-fit px-2.5 py-1 rounded-md">
                                        {session.stepCount} step{session.stepCount !== 1 ? 's' : ''} saved
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-2 flex items-center justify-between gap-2 bg-muted/20 border-t">
                                    <Button asChild variant="default" size="sm" className="w-full">
                                        <Link href={`/practice/${session.problemSlug}`}>
                                            <PlayCircle className="h-4 w-4 mr-2" /> Resume
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive px-2"
                                        onClick={() => handleClearSession(session.problemSlug)}
                                        title="Delete offline session"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
