'use client';

import React from 'react';
import { Button } from './ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    /** Short name of the isolated region, used in the fallback copy (e.g. "diagram canvas"). */
    label: string;
    /** Optional extra reassurance line under the headline. */
    detail?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    resetKey: number;
}

// Component-level isolation: a crash inside (e.g. Excalidraw) must not take
// down the rest of the practice screen. Route-level error.tsx stays the
// last resort.
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, resetKey: 0 };

    static getDerivedStateFromError(): Partial<ErrorBoundaryState> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        console.error(`ErrorBoundary (${this.props.label}) caught:`, error, info.componentStack);
    }

    handleReset = () => {
        this.setState(s => ({ hasError: false, resetKey: s.resetKey + 1 }));
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center gap-4 p-8 h-full min-h-[200px] text-center" data-testid="component-error-fallback">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                    <div className="space-y-1">
                        <p className="font-semibold">The {this.props.label} crashed</p>
                        <p className="text-sm text-muted-foreground">
                            {this.props.detail ?? 'The rest of your session is unaffected.'}
                        </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={this.handleReset} className="gap-2">
                        <RotateCcw className="h-3.5 w-3.5" /> Reload {this.props.label}
                    </Button>
                </div>
            );
        }
        // key forces a full remount of the crashed subtree on reset
        return <React.Fragment key={this.state.resetKey}>{this.props.children}</React.Fragment>;
    }
}
