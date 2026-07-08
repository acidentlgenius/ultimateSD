'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Route error boundary caught:', error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-6 px-4 text-center">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
            </div>
            <div className="space-y-2 max-w-md">
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground">
                    An unexpected error occurred while rendering this page. Your progress is saved — reloading is safe.
                </p>
                {error.digest && (
                    <p className="text-xs text-muted-foreground/60">Error ID: {error.digest}</p>
                )}
            </div>
            <div className="flex gap-3">
                <Button onClick={reset} className="gap-2">
                    <RotateCcw className="h-4 w-4" /> Try again
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
