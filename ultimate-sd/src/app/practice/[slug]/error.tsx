'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

// Practice sessions auto-save every answer and diagram to the server (and
// localStorage), so a render crash here must never read as "work lost".
export default function PracticeError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Practice page error boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-[100dvh] flex flex-col items-center justify-center gap-6 px-4 text-center bg-background">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="space-y-2 max-w-md">
                <h1 className="text-2xl font-bold">The practice session hit a snag</h1>
                <p className="text-muted-foreground">
                    Don&apos;t worry — every answer you submitted and your diagram are already saved.
                    Reload to pick up exactly where you left off.
                </p>
                {error.digest && (
                    <p className="text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
                )}
            </div>
            <div className="flex gap-3">
                <Button onClick={reset} className="gap-2" data-testid="practice-error-retry">
                    <RotateCcw className="h-4 w-4" /> Resume session
                </Button>
                <Button asChild variant="outline" className="gap-2">
                    <Link href="/">
                        <Home className="h-4 w-4" /> Go home
                    </Link>
                </Button>
            </div>
        </div>
    );
}
