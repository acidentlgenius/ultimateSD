'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useStopwatch, useTimer } from 'react-timer-hook';
import { Play, Pause, RotateCcw, Timer as TimerIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface TimerWidgetProps {
    initialTimeSeconds?: number;
    className?: string;
    problemId?: string;
    startedAt?: Date | string | null;
    isTimerRunning?: boolean;
    totalPausedSeconds?: number;
    lastPausedAt?: Date | string | null;
    mode?: 'countdown' | 'countup';
    compact?: boolean;
    minimal?: boolean;
    onStart?: () => Promise<void>;
    onComplete?: () => void;
    onToggle?: () => Promise<void>;
}

function pad2(n: number) {
    return n.toString().padStart(2, '0');
}

function formatClock(hours: number, minutes: number, seconds: number) {
    if (hours > 0) return `${hours}:${pad2(minutes)}:${pad2(seconds)}`;
    return `${pad2(minutes)}:${pad2(seconds)}`;
}

function computeServerElapsedSeconds(
    startedAt: Date | string,
    isTimerRunning: boolean,
    totalPausedSeconds: number,
    lastPausedAt: Date | string | null | undefined
) {
    const start = new Date(startedAt).getTime();
    const now = Date.now();
    const totalElapsed = Math.floor((now - start) / 1000);

    let currentPauseDuration = 0;
    if (!isTimerRunning && lastPausedAt) {
        currentPauseDuration = Math.floor((now - new Date(lastPausedAt).getTime()) / 1000);
    }

    return Math.max(0, totalElapsed - totalPausedSeconds - currentPauseDuration);
}

export function TimerWidget({
    initialTimeSeconds = 2700,
    className,
    problemId,
    startedAt,
    isTimerRunning = true,
    totalPausedSeconds = 0,
    lastPausedAt,
    mode = 'countdown',
    compact = false,
    minimal = false,
    onStart,
    onComplete,
    onToggle,
}: TimerWidgetProps) {
    const isCountUp = mode === 'countup';
    const [isLoading, setIsLoading] = useState(false);
    const [localExpiry, setLocalExpiry] = useState<Date | null>(null);
    const [localAutoStart, setLocalAutoStart] = useState(false);
    const onCompleteRef = useRef(onComplete);
    const expireCalledRef = useRef(false);
    const localStartedRef = useRef(false);
    onCompleteRef.current = onComplete;

    const serverElapsed = useMemo(() => {
        if (!startedAt) return 0;
        return computeServerElapsedSeconds(
            startedAt,
            isTimerRunning,
            totalPausedSeconds,
            lastPausedAt
        );
    }, [startedAt, isTimerRunning, totalPausedSeconds, lastPausedAt]);

    const serverCountdownExpiry = useMemo(() => {
        if (!startedAt || isCountUp) return null;
        const remaining = Math.max(0, initialTimeSeconds - serverElapsed);
        return new Date(Date.now() + remaining * 1000);
    }, [startedAt, isCountUp, initialTimeSeconds, serverElapsed]);

    const serverStopwatchOffset = useMemo(() => {
        if (!startedAt || !isCountUp) return undefined;
        return new Date(Date.now() - serverElapsed * 1000);
    }, [startedAt, isCountUp, serverElapsed]);

    const stopwatch = useStopwatch({
        autoStart: false,
        offsetTimestamp: serverStopwatchOffset,
    });
    const countdown = useTimer({
        expiryTimestamp: serverCountdownExpiry ?? localExpiry ?? new Date(Date.now() + initialTimeSeconds * 1000),
        autoStart: false,
        onExpire: () => {
            if (expireCalledRef.current) return;
            expireCalledRef.current = true;
            onCompleteRef.current?.();
        },
    });

    const activeTimer = isCountUp ? stopwatch : countdown;
    const { hours, minutes, seconds, isRunning } = activeTimer;
    const isLowTime = !isCountUp && isRunning && hours === 0 && minutes < 5;

    // Local-storage countdown bootstrap (guest / legacy)
    useEffect(() => {
        if (startedAt || isCountUp || !problemId) return;

        try {
            const storedStatus = localStorage.getItem(`timer_${problemId}_status`);
            const storedTime = localStorage.getItem(`timer_${problemId}_timeLeft`);
            const storedTimestamp = localStorage.getItem(`timer_${problemId}_lastTimestamp`);

            if (storedStatus === 'active' && storedTime && storedTimestamp) {
                const elapsed = Math.floor((Date.now() - parseInt(storedTimestamp, 10)) / 1000);
                const remaining = parseInt(storedTime, 10) - elapsed;
                setLocalExpiry(new Date(Date.now() + Math.max(0, remaining) * 1000));
                setLocalAutoStart(remaining > 0);
            } else if (storedTime) {
                setLocalExpiry(new Date(Date.now() + parseInt(storedTime, 10) * 1000));
                setLocalAutoStart(storedStatus === 'active');
            } else {
                setLocalExpiry(new Date(Date.now() + initialTimeSeconds * 1000));
                setLocalAutoStart(true);
            }
        } catch (e) {
            console.error('Failed to load timer state:', e);
            setLocalExpiry(new Date(Date.now() + initialTimeSeconds * 1000));
            setLocalAutoStart(true);
        }
    }, [problemId, initialTimeSeconds, startedAt, isCountUp]);

    // Sync server-backed timers
    useEffect(() => {
        if (!startedAt) return;

        if (isCountUp && serverStopwatchOffset !== undefined) {
            stopwatch.reset(serverStopwatchOffset, isTimerRunning);
            return;
        }

        if (!isCountUp && serverCountdownExpiry) {
            expireCalledRef.current = false;
            countdown.restart(serverCountdownExpiry, isTimerRunning);
        }

    }, [startedAt, isCountUp, isTimerRunning, serverStopwatchOffset, serverCountdownExpiry]);

    // Local countdown start (once expiry is loaded)
    useEffect(() => {
        if (startedAt || isCountUp || !localExpiry || localStartedRef.current) return;
        localStartedRef.current = true;
        expireCalledRef.current = false;
        countdown.restart(localExpiry, localAutoStart);

    }, [startedAt, isCountUp, localExpiry, localAutoStart]);

    // Persist local countdown ticks
    useEffect(() => {
        if (startedAt || isCountUp || !problemId) return;

        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        try {
            if (isRunning && totalSeconds > 0) {
                localStorage.setItem(`timer_${problemId}_status`, 'active');
                localStorage.setItem(`timer_${problemId}_timeLeft`, totalSeconds.toString());
                localStorage.setItem(`timer_${problemId}_lastTimestamp`, Date.now().toString());
            } else if (totalSeconds === 0) {
                localStorage.setItem(`timer_${problemId}_status`, 'finished');
                localStorage.setItem(`timer_${problemId}_timeLeft`, '0');
            } else {
                localStorage.setItem(`timer_${problemId}_status`, 'paused');
                localStorage.setItem(`timer_${problemId}_timeLeft`, totalSeconds.toString());
                localStorage.setItem(`timer_${problemId}_lastTimestamp`, Date.now().toString());
            }
        } catch {
            /* ignore */
        }
    }, [startedAt, isCountUp, problemId, hours, minutes, seconds, isRunning]);

    const handleStart = useCallback(async () => {
        if (onStart && !startedAt) {
            setIsLoading(true);
            try {
                await onStart();
            } catch (error) {
                console.error('Failed to start server timer', error);
            } finally {
                setIsLoading(false);
            }
        } else if (isCountUp) {
            stopwatch.start();
        } else {
            countdown.resume();
        }
    }, [onStart, startedAt, isCountUp, stopwatch, countdown]);

    const toggleTimer = useCallback(async () => {
        if (startedAt && onToggle) {
            setIsLoading(true);
            try {
                await onToggle();
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (isRunning) {
            if (isCountUp) stopwatch.pause();
            else countdown.pause();
        } else {
            await handleStart();
        }
    }, [startedAt, onToggle, isRunning, isCountUp, stopwatch, countdown, handleStart]);

    const resetTimer = () => {
        if (startedAt) return;
        const expiry = new Date(Date.now() + initialTimeSeconds * 1000);
        if (isCountUp) {
            stopwatch.reset(undefined, false);
        } else {
            expireCalledRef.current = false;
            localStartedRef.current = false;
            countdown.restart(expiry, false);
            setLocalExpiry(expiry);
        }
        if (problemId) {
            localStorage.removeItem(`timer_${problemId}_status`);
            localStorage.removeItem(`timer_${problemId}_timeLeft`);
            localStorage.removeItem(`timer_${problemId}_lastTimestamp`);
        }
    };

    const display = isLoading ? '…' : formatClock(hours, minutes, seconds);

    if (minimal) {
        return (
            <div className={cn('inline-flex items-center gap-1', className)}>
                <span
                    className={cn(
                        'font-mono text-xs md:text-sm font-semibold tabular-nums tracking-tight',
                        isLowTime ? 'text-red-600 dark:text-red-400' : 'text-foreground'
                    )}
                >
                    {display}
                </span>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isRunning ? 'Pause timer' : 'Start timer'}
                    className="h-7 w-7"
                    onClick={toggleTimer}
                    disabled={isLoading}
                >
                    {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
            </div>
        );
    }

    return (
        <Card
            className={cn(
                'flex items-center gap-2 shadow-md bg-background/90 backdrop-blur border-border transition-colors duration-500',
                compact ? 'p-1.5 px-2' : 'p-2 px-3',
                isLowTime ? 'border-red-500/50 bg-red-500/5' : '',
                className
            )}
        >
            <div
                className={cn(
                    'p-1.5 rounded-md transition-colors',
                    isLowTime
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-primary/10 text-primary'
                )}
            >
                <TimerIcon className={cn(compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
            </div>

            <div
                className={cn(
                    'font-mono font-bold min-w-[3.5rem] text-center tabular-nums',
                    compact ? 'text-sm' : 'text-lg',
                    isLowTime ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-foreground'
                )}
            >
                {display}
            </div>

            <div className="flex gap-1 ml-1">
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={isRunning ? 'Pause timer' : 'Start timer'}
                    title={isRunning ? 'Pause timer' : 'Start timer'}
                    className={cn(compact ? 'h-6 w-6' : 'h-7 w-7')}
                    onClick={toggleTimer}
                    disabled={isLoading}
                >
                    {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
                {!startedAt && !problemId && !isCountUp && (
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Reset timer"
                        title="Reset timer"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={resetTimer}
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        </Card>
    );
}
