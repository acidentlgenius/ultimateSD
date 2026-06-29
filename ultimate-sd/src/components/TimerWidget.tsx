'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimerWidgetProps {
    initialTimeSeconds?: number; // Default 45 mins = 2700s
    className?: string;
    problemId?: string; // If present, enables persistence and persistence key
    startedAt?: Date | string | null; // If present, enables Server-Side Timer Mode
    isTimerRunning?: boolean; // Server-side running state
    totalPausedSeconds?: number; // Total seconds paused so far
    lastPausedAt?: Date | string | null; // Timestamp of last pause
    onStart?: () => Promise<void>;
    onComplete?: () => void;
    onToggle?: () => Promise<void>;
}

export function TimerWidget({
    initialTimeSeconds = 2700,
    className,
    problemId,
    startedAt,
    isTimerRunning = true,
    totalPausedSeconds = 0,
    lastPausedAt,
    onStart,
    onComplete,
    onToggle
}: TimerWidgetProps) {
    const [timeLeft, setTimeLeft] = useState(initialTimeSeconds);
    const [isActive, setIsActive] = useState(false);
    const [isLowTime, setIsLowTime] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Helper to calculate server time
    const calculateServerTime = () => {
        if (!startedAt) return { remaining: initialTimeSeconds, shouldBeActive: false };

        const start = new Date(startedAt).getTime();
        const now = Date.now();

        // Calculate total elapsed real-world time since start
        const totalElapsed = Math.floor((now - start) / 1000);

        // Effective elapsed time = Total elapsed - Total paused duration
        // If currently paused, we also subtract the time since the last pause
        let currentPauseDuration = 0;
        if (!isTimerRunning && lastPausedAt) {
            currentPauseDuration = Math.floor((now - new Date(lastPausedAt).getTime()) / 1000);
        }

        const effectiveElapsed = totalElapsed - totalPausedSeconds - currentPauseDuration;
        const remaining = Math.max(0, initialTimeSeconds - effectiveElapsed);

        return { remaining, shouldBeActive: isTimerRunning && remaining > 0 };
    };

    // Initial load & Server Sync
    useEffect(() => {
        if (startedAt) {
            const { remaining, shouldBeActive } = calculateServerTime();

            setTimeLeft(remaining);
            setIsActive(shouldBeActive);
            setIsInitialized(true);
            return;
        }

        if (!problemId) {
            setTimeLeft(initialTimeSeconds);
            setIsInitialized(true);
            return;
        }

        // Local storage fallback (Legacy/Client-only mode)
        const loadState = () => {
            try {
                const storedStatus = localStorage.getItem(`timer_${problemId}_status`);
                const storedTime = localStorage.getItem(`timer_${problemId}_timeLeft`);
                const storedTimestamp = localStorage.getItem(`timer_${problemId}_lastTimestamp`);

                if (storedStatus === 'active' && storedTime && storedTimestamp) {
                    const now = Date.now();
                    const elapsed = Math.floor((now - parseInt(storedTimestamp)) / 1000);
                    const remaining = parseInt(storedTime) - elapsed;

                    if (remaining > 0) {
                        setTimeLeft(remaining);
                        setIsActive(true);
                    } else {
                        setTimeLeft(0);
                        setIsActive(false);
                    }
                } else if (storedTime) {
                    setTimeLeft(parseInt(storedTime));
                    setIsActive(storedStatus === 'active');
                } else {
                    setTimeLeft(initialTimeSeconds);
                    // Auto-start if it's a problem session (even if local fallback)
                    if (problemId) setIsActive(true);
                }
            } catch (e) {
                console.error("Failed to load timer state:", e);
                setTimeLeft(initialTimeSeconds);
                if (problemId) setIsActive(true);
            }
            setIsInitialized(true);
        };

        loadState();
    }, [problemId, initialTimeSeconds, startedAt, isTimerRunning, totalPausedSeconds, lastPausedAt]);

    useEffect(() => {
        if (timeLeft === 0 && isActive && startedAt) {
            setIsActive(false);
            if (onComplete) onComplete();
        }
    }, [timeLeft, isActive, startedAt, onComplete]);

    // Timer interval
    useEffect(() => {
        if (!isInitialized) return;

        let interval: NodeJS.Timeout;

        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((prev) => {
                    // Check against server time if available to prevent drift
                    if (startedAt) {
                        const { remaining } = calculateServerTime();
                        if (remaining <= 300) setIsLowTime(true);
                        return remaining;
                    }

                    // Local logic
                    const newValue = prev - 1;
                    if (newValue <= 300) setIsLowTime(true);

                    if (problemId && !startedAt) {
                        localStorage.setItem(`timer_${problemId}_status`, 'active');
                        localStorage.setItem(`timer_${problemId}_timeLeft`, newValue.toString());
                        localStorage.setItem(`timer_${problemId}_lastTimestamp`, Date.now().toString());
                    }
                    return newValue;
                });
            }, 1000);
        } else {
            if (timeLeft === 0 && problemId && !startedAt) {
                localStorage.setItem(`timer_${problemId}_status`, 'finished');
                localStorage.setItem(`timer_${problemId}_timeLeft`, '0');
            } else if (problemId && !startedAt && isInitialized) {
                localStorage.setItem(`timer_${problemId}_status`, 'paused');
                localStorage.setItem(`timer_${problemId}_timeLeft`, timeLeft.toString());
                localStorage.setItem(`timer_${problemId}_lastTimestamp`, Date.now().toString());
            }
        }

        return () => clearInterval(interval);
    }, [isActive, timeLeft, problemId, isInitialized, startedAt, initialTimeSeconds]);

    const handleStart = async () => {
        if (onStart && !startedAt) {
            setIsLoading(true);
            try {
                await onStart();
                // State update will come via startedAt prop change
            } catch (error) {
                console.error("Failed to start server timer", error);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsActive(true);
        }
    };

    const toggleTimer = async () => {
        // If server managed and has toggle capability
        if (startedAt && onToggle) {
            setIsLoading(true);
            try {
                await onToggle();
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Local behavior (fallback)
        if (!isActive) handleStart();
        else setIsActive(false);
    };

    const resetTimer = () => {
        if (startedAt) return; // Cannot reset server timer
        setIsActive(false);
        setTimeLeft(initialTimeSeconds);
        setIsLowTime(false);
        if (problemId) {
            localStorage.removeItem(`timer_${problemId}_status`);
            localStorage.removeItem(`timer_${problemId}_timeLeft`);
            localStorage.removeItem(`timer_${problemId}_lastTimestamp`);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <Card className={cn("flex items-center gap-2 p-2 px-3 shadow-md bg-background/90 backdrop-blur border-border transition-colors duration-500",
            isLowTime && isActive ? "border-red-500/50 bg-red-500/5" : "",
            className
        )}>
            <div className={cn("p-1.5 rounded-md transition-colors", isLowTime && isActive ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400" : "bg-primary/10 text-primary")}>
                <TimerIcon className="h-4 w-4" />
            </div>

            <div className={cn("font-mono text-lg font-bold min-w-[3.5rem] text-center tabular-nums",
                isLowTime && isActive ? "text-red-600 dark:text-red-400 animate-pulse" : "text-foreground"
            )}>
                {isLoading ? "..." : formatTime(timeLeft)}
            </div>

            <div className="flex gap-1 ml-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={toggleTimer}
                    disabled={isLoading}
                    title={isActive ? "Pause" : "Start"}
                    aria-label={isActive ? "Pause" : "Start"}
                >
                    {isActive ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                {!startedAt && !problemId && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={resetTimer}
                        title="Reset"
                        aria-label="Reset"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
