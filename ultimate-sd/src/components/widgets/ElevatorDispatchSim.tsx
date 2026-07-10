"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Play, Pause, RotateCcw, MousePointerClick, Trophy, Sunrise, Users } from 'lucide-react';

// Deterministic-enough seeded RNG (mulberry32)
const mulberry32 = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

const FLOORS = 10;
const SHAFTS = 3;
const CAPACITY = 6;
const RUN_TICKS = 60; // 60 simulated seconds per run
const TICK_MS = 400;
const FLOOR_H = 30; // px per floor
const P95_TARGET = 45; // manual challenge: keep p95 under this

type Mode = 'manual' | 'fcfs' | 'look';
type Pattern = 'normal' | 'rush';
type Dir = -1 | 0 | 1;

type Passenger = { id: number; origin: number; dest: number; spawnTick: number };
type Elevator = {
    id: number;
    floor: number;
    dir: Dir;
    doorTicks: number;
    riders: Passenger[];
    target: number | null;
};
type World = {
    tick: number;
    nextPid: number;
    elevators: Elevator[];
    waiting: Passenger[];
    waits: number[]; // recorded wait time (seconds) when a passenger boards
    delivered: number;
    boarded: number;
    finished: boolean;
};
type RunResult = { avg: number; p95: number; served: number };

const sgn = (x: number): Dir => (x > 0 ? 1 : x < 0 ? -1 : 0);

const initWorld = (): World => ({
    tick: 0,
    nextPid: 1,
    elevators: Array.from({ length: SHAFTS }, (_, id) => ({
        id, floor: id * 4, dir: 0 as Dir, doorTicks: 0, riders: [], target: null,
    })),
    waiting: [],
    waits: [],
    delivered: 0,
    boarded: 0,
    finished: false,
});

function spawn(world: World, rng: () => number, pattern: Pattern) {
    const rate = pattern === 'rush' ? 1.0 : 0.45;
    let n = rng() < rate ? 1 : 0;
    if (pattern === 'rush' && rng() < 0.55) n++;
    for (let i = 0; i < n; i++) {
        let origin: number, dest: number;
        if (pattern === 'rush' && rng() < 0.8) {
            origin = 0; // lobby
            dest = 5 + Math.floor(rng() * 5); // upper floors
        } else {
            origin = Math.floor(rng() * FLOORS);
            do { dest = Math.floor(rng() * FLOORS); } while (dest === origin);
        }
        world.waiting.push({ id: world.nextPid++, origin, dest, spawnTick: world.tick });
    }
}

// Open doors: unload riders for this floor, board waiting passengers (per mode rules)
function openDoors(world: World, e: Elevator, mode: Mode) {
    e.doorTicks = 1;
    const kept: Passenger[] = [];
    for (const r of e.riders) {
        if (r.dest === e.floor) world.delivered++;
        else kept.push(r);
    }
    e.riders = kept;

    // SCAN/LOOK only boards passengers travelling the sweep direction
    const dirRule: Dir = mode === 'look' && e.dir !== 0 ? e.dir : 0;
    const room = CAPACITY - e.riders.length;
    const boarding: Passenger[] = [];
    world.waiting = world.waiting.filter(p => {
        if (p.origin !== e.floor || boarding.length >= room) return true;
        if (dirRule !== 0 && sgn(p.dest - p.origin) !== dirRule) return true;
        boarding.push(p);
        return false;
    });
    for (const p of boarding) {
        world.waits.push(world.tick - p.spawnTick);
        world.boarded++;
        e.riders.push(p);
    }
    if (e.dir === 0 && e.riders.length > 0) e.dir = sgn(e.riders[0].dest - e.floor);
}

function manualStep(world: World, e: Elevator) {
    if (e.doorTicks > 0) { e.doorTicks--; return; }
    if (e.target !== null) {
        if (e.floor === e.target) {
            e.target = null;
            openDoors(world, e, 'manual');
            return;
        }
        e.floor += sgn(e.target - e.floor);
        return;
    }
    // No command: auto-deliver riders to their nearest destination
    if (e.riders.length > 0) {
        const nearest = e.riders.reduce((a, b) =>
            Math.abs(a.dest - e.floor) <= Math.abs(b.dest - e.floor) ? a : b);
        if (nearest.dest === e.floor) openDoors(world, e, 'manual');
        else e.floor += sgn(nearest.dest - e.floor);
    } else {
        e.dir = 0;
    }
}

function fcfsStep(world: World, e: Elevator, claimed: Set<number>) {
    if (e.doorTicks > 0) { e.doorTicks--; return; }
    if (e.target === null) {
        if (e.riders.length > 0) {
            // Serve destinations strictly in boarding order — hello, criss-cross
            e.target = e.riders[0].dest;
        } else {
            // Strict first-come-first-served: oldest waiting passenger gets the next car
            let oldest: Passenger | null = null;
            for (const p of world.waiting) {
                if (claimed.has(p.origin)) continue;
                if (oldest === null || p.id < oldest.id) oldest = p;
            }
            if (oldest) {
                e.target = oldest.origin;
                claimed.add(oldest.origin);
            }
        }
    }
    if (e.target === null) { e.dir = 0; return; }
    if (e.floor === e.target) {
        e.target = null;
        openDoors(world, e, 'fcfs');
        return;
    }
    e.dir = sgn(e.target - e.floor);
    e.floor += e.dir;
}

function lookHasDemand(world: World, e: Elevator, dir: Dir): boolean {
    if (dir === 0) return false;
    return (
        e.riders.some(r => (r.dest - e.floor) * dir > 0) ||
        world.waiting.some(p => (p.origin - e.floor) * dir > 0)
    );
}

function lookBoardable(world: World, e: Elevator, dir: Dir): boolean {
    if (e.riders.length >= CAPACITY) return false;
    return world.waiting.some(p =>
        p.origin === e.floor && (dir === 0 || sgn(p.dest - p.origin) === dir)
    );
}

function lookStep(world: World, e: Elevator, claimed: Set<number>) {
    if (e.doorTicks > 0) { e.doorTicks--; return; }
    if (e.dir === 0) {
        if (e.riders.length > 0) {
            const nearest = e.riders.reduce((a, b) =>
                Math.abs(a.dest - e.floor) <= Math.abs(b.dest - e.floor) ? a : b);
            e.dir = sgn(nearest.dest - e.floor);
        } else {
            // Idle: head toward the nearest unclaimed waiting floor
            let best: number | null = null;
            let bestDist = Infinity;
            for (const p of world.waiting) {
                if (claimed.has(p.origin)) continue;
                const d = Math.abs(p.origin - e.floor);
                if (d < bestDist) { bestDist = d; best = p.origin; }
            }
            if (best === null) return;
            claimed.add(best);
            if (best === e.floor) { openDoors(world, e, 'look'); return; }
            e.dir = sgn(best - e.floor);
        }
    }
    // Stop en route: someone to drop off, or someone here travelling our way
    if (e.riders.some(r => r.dest === e.floor) || lookBoardable(world, e, e.dir)) {
        openDoors(world, e, 'look');
        return;
    }
    // Sweep on while there is demand ahead
    if (lookHasDemand(world, e, e.dir)) {
        e.floor = Math.max(0, Math.min(FLOORS - 1, e.floor + e.dir));
        return;
    }
    // End of sweep: reverse if there is demand behind or someone here going the other way
    const rev = (-e.dir) as Dir;
    if (lookHasDemand(world, e, rev) || lookBoardable(world, e, rev)) {
        e.dir = rev;
        if (lookBoardable(world, e, rev)) { openDoors(world, e, 'look'); return; }
        e.floor = Math.max(0, Math.min(FLOORS - 1, e.floor + e.dir));
        return;
    }
    e.dir = 0;
}

function stepWorld(prev: World, mode: Mode, rng: () => number, pattern: Pattern): World {
    const world: World = {
        ...prev,
        tick: prev.tick + 1,
        elevators: prev.elevators.map(e => ({ ...e, riders: [...e.riders] })),
        waiting: [...prev.waiting],
        waits: [...prev.waits],
    };
    spawn(world, rng, pattern);

    // Floors already being targeted for pickup by an empty car
    const claimed = new Set<number>();
    for (const e of world.elevators) {
        if (e.riders.length === 0 && e.target !== null) claimed.add(e.target);
    }
    for (const e of world.elevators) {
        if (mode === 'manual') manualStep(world, e);
        else if (mode === 'fcfs') fcfsStep(world, e, claimed);
        else lookStep(world, e, claimed);
    }
    if (world.tick >= RUN_TICKS) world.finished = true;
    return world;
}

// Metrics include passengers still waiting — ignoring people must hurt your p95
function computeMetrics(w: World): RunResult {
    const all = [...w.waits, ...w.waiting.map(p => w.tick - p.spawnTick)];
    if (all.length === 0) return { avg: 0, p95: 0, served: w.delivered };
    const sorted = [...all].sort((a, b) => a - b);
    const avg = Math.round(sorted.reduce((s, x) => s + x, 0) / sorted.length);
    const p95 = sorted[Math.floor(0.95 * (sorted.length - 1))];
    return { avg, p95, served: w.delivered };
}

const HIST_BUCKETS = [
    { label: '<10' }, { label: '10s' }, { label: '20s' },
    { label: '30s' }, { label: '40s' }, { label: '50+' },
];

const CAR_COLORS = ['bg-cyan-500', 'bg-violet-500', 'bg-amber-500'];
const MODE_LABEL: Record<Mode, string> = { manual: 'Your', fcfs: 'FCFS', look: 'LOOK' };

export default function ElevatorDispatchSim() {
    const [mode, setMode] = useState<Mode>('manual');
    const [pattern, setPattern] = useState<Pattern>('rush');
    const [world, setWorld] = useState<World>(initWorld);
    const [running, setRunning] = useState(false);
    const [selected, setSelected] = useState<number>(0);
    const [results, setResults] = useState<Partial<Record<Mode, RunResult>>>({});

    const worldRef = useRef(world);
    const rngRef = useRef(mulberry32(7));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Single ref-tracked interval; cleared on pause, mode/pattern switch and unmount.
    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => {
            const next = stepWorld(worldRef.current, mode, rngRef.current, pattern);
            worldRef.current = next;
            setWorld(next);
            if (next.finished) {
                setRunning(false);
                setResults(prev => ({ ...prev, [mode]: computeMetrics(next) }));
            }
        }, TICK_MS);
        intervalRef.current = id;
        return () => {
            clearInterval(id);
            if (intervalRef.current === id) intervalRef.current = null;
        };
    }, [running, mode, pattern]);

    const reset = () => {
        setRunning(false);
        rngRef.current = mulberry32(7);
        const fresh = initWorld();
        worldRef.current = fresh;
        setWorld(fresh);
    };

    const start = () => {
        if (worldRef.current.finished) {
            rngRef.current = mulberry32(7);
            const fresh = initWorld();
            worldRef.current = fresh;
            setWorld(fresh);
        }
        setRunning(true);
    };

    const switchMode = (m: Mode) => {
        if (m === mode) return;
        setMode(m);
        setSelected(0);
        setRunning(false);
        rngRef.current = mulberry32(7);
        const fresh = initWorld();
        worldRef.current = fresh;
        setWorld(fresh);
    };

    const switchPattern = (p: Pattern) => {
        if (p === pattern) return;
        setPattern(p);
        setRunning(false);
        rngRef.current = mulberry32(7);
        const fresh = initWorld();
        worldRef.current = fresh;
        setWorld(fresh);
    };

    const dispatchTo = (floor: number) => {
        if (mode !== 'manual') return;
        const next: World = {
            ...worldRef.current,
            elevators: worldRef.current.elevators.map(e =>
                e.id === selected ? { ...e, target: floor } : e
            ),
        };
        worldRef.current = next;
        setWorld(next);
    };

    const metrics = computeMetrics(world);
    const waitingByFloor = new Map<number, Passenger[]>();
    for (const p of world.waiting) {
        const arr = waitingByFloor.get(p.origin) ?? [];
        arr.push(p);
        waitingByFloor.set(p.origin, arr);
    }

    const allWaits = [...world.waits, ...world.waiting.map(p => world.tick - p.spawnTick)];
    const histogram = HIST_BUCKETS.map((_, i) => {
        const min = i * 10;
        const isLast = i === HIST_BUCKETS.length - 1;
        return allWaits.filter(w => w >= min && (isLast || w < min + 10)).length;
    });
    const histMax = Math.max(1, ...histogram);

    const resultCount = Object.keys(results).length;
    const manualResult = results.manual;

    const floorLabel = (f: number) => (f === 0 ? 'L' : String(f));

    return (
        <div className="@container space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-indigo-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Building2 className="h-5 w-5 text-indigo-500" />
                            Elevator Dispatch Simulator
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Ten floors, three cars, one question: who answers which call?
                        </p>
                    </div>

                    {/* Mode + pattern */}
                    <div className="flex flex-wrap gap-2 items-center">
                        <Button onClick={() => switchMode('manual')} size="sm" variant={mode === 'manual' ? 'default' : 'outline'} className="text-xs">
                            <MousePointerClick className="h-3 w-3 mr-1" /> You dispatch
                        </Button>
                        <Button onClick={() => switchMode('fcfs')} size="sm" variant={mode === 'fcfs' ? 'default' : 'outline'} className="text-xs">
                            FCFS
                        </Button>
                        <Button onClick={() => switchMode('look')} size="sm" variant={mode === 'look' ? 'default' : 'outline'} className="text-xs">
                            SCAN/LOOK
                        </Button>
                        <span className="mx-1 h-4 w-px bg-border" aria-hidden="true" />
                        <Button onClick={() => switchPattern('normal')} size="sm" variant={pattern === 'normal' ? 'secondary' : 'ghost'} className="text-xs">
                            <Users className="h-3 w-3 mr-1" /> Normal
                        </Button>
                        <Button onClick={() => switchPattern('rush')} size="sm" variant={pattern === 'rush' ? 'secondary' : 'ghost'} className="text-xs">
                            <Sunrise className="h-3 w-3 mr-1" /> Morning rush
                        </Button>
                    </div>

                    {/* Run controls */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <Button onClick={() => (running ? setRunning(false) : start())} size="sm" className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white">
                            {running ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> {world.finished ? 'Run again' : 'Start'}</>}
                        </Button>
                        <Button onClick={reset} size="sm" variant="outline" className="text-xs">
                            <RotateCcw className="h-3 w-3 mr-1" /> Reset
                        </Button>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="text-[10px] font-mono text-muted-foreground">{world.tick}s / {RUN_TICKS}s</span>
                            <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-label="Run progress" aria-valuenow={world.tick} aria-valuemin={0} aria-valuemax={RUN_TICKS}>
                                <div className="h-full bg-indigo-500 transition-all" style={{ width: `${(world.tick / RUN_TICKS) * 100}%` }} />
                            </div>
                        </div>
                    </div>

                    {mode === 'manual' && (
                        <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-[11px] flex items-center gap-2 flex-wrap">
                            <Trophy className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>Challenge: keep <span className="font-bold">p95 wait under {P95_TARGET}s</span> for 60s. Click a car, then click a floor to send it. Cars auto-deliver riders.</span>
                            {world.finished && manualResult && (
                                <Badge variant={manualResult.p95 < P95_TARGET ? 'secondary' : 'destructive'} className="text-[10px] h-5">
                                    {manualResult.p95 < P95_TARGET ? `Passed! p95 ${manualResult.p95}s` : `p95 ${manualResult.p95}s — over target`}
                                </Badge>
                            )}
                        </div>
                    )}

                    {/* Building */}
                    <div className="flex gap-2 @md:gap-3 p-3 rounded-lg bg-muted/30 border border-border">
                        {/* Floors with waiting passengers */}
                        <div className="flex flex-col flex-1 min-w-0">
                            {Array.from({ length: FLOORS }, (_, i) => FLOORS - 1 - i).map(f => {
                                const q = waitingByFloor.get(f) ?? [];
                                return (
                                    <button
                                        key={f}
                                        onClick={() => dispatchTo(f)}
                                        disabled={mode !== 'manual'}
                                        aria-label={`Floor ${f === 0 ? 'lobby' : f}${q.length ? `, ${q.length} waiting` : ''}${mode === 'manual' ? `. Send elevator ${selected + 1} here` : ''}`}
                                        className={`flex items-center gap-1.5 px-2 border-b border-border/40 text-left last:border-b-0
                                            ${q.length > 0 ? 'bg-amber-500/10' : ''}
                                            ${mode === 'manual' ? 'hover:bg-primary/10 cursor-pointer' : 'cursor-default'}`}
                                        style={{ height: FLOOR_H }}
                                    >
                                        <span className="w-4 text-[10px] font-mono text-muted-foreground shrink-0">{floorLabel(f)}</span>
                                        {q.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" aria-hidden="true" />}
                                        <span className="flex gap-0.5 overflow-hidden">
                                            {q.slice(0, 4).map(p => (
                                                <span key={p.id} className="text-[9px] px-1 rounded bg-muted text-muted-foreground font-mono whitespace-nowrap">
                                                    →{floorLabel(p.dest)}
                                                </span>
                                            ))}
                                            {q.length > 4 && <span className="text-[9px] text-muted-foreground whitespace-nowrap">+{q.length - 4}</span>}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        {/* Shafts */}
                        {world.elevators.map(e => (
                            <div
                                key={e.id}
                                className="relative w-11 @md:w-12 rounded-md bg-muted/50 border border-border shrink-0"
                                style={{ height: FLOORS * FLOOR_H }}
                            >
                                <button
                                    onClick={() => mode === 'manual' && setSelected(e.id)}
                                    aria-label={`Elevator ${e.id + 1} at floor ${floorLabel(e.floor)} with ${e.riders.length} riders${mode === 'manual' && selected === e.id ? ', selected' : ''}`}
                                    className={`absolute left-1 right-1 rounded ${CAR_COLORS[e.id]} text-white text-[10px] font-bold
                                        flex items-center justify-center transition-[top] duration-300 ease-linear
                                        ${mode === 'manual' ? 'cursor-pointer' : 'cursor-default'}
                                        ${mode === 'manual' && selected === e.id ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                                        ${e.doorTicks > 0 ? 'outline outline-2 outline-emerald-400' : ''}`}
                                    style={{ top: (FLOORS - 1 - e.floor) * FLOOR_H + 2, height: FLOOR_H - 4 }}
                                >
                                    {e.riders.length > 0 ? e.riders.length : '·'}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Live metrics */}
                    <div className="grid grid-cols-2 @md:grid-cols-4 gap-2">
                        <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                            <div className="text-lg font-bold font-mono">{metrics.avg}s</div>
                            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Avg wait</div>
                        </div>
                        <div className={`p-2 rounded-lg border text-center ${metrics.p95 >= P95_TARGET && allWaits.length > 0 ? 'bg-red-500/10 border-red-500/40' : 'bg-muted/40 border-border'}`}>
                            <div className={`text-lg font-bold font-mono ${metrics.p95 >= P95_TARGET && allWaits.length > 0 ? 'text-red-500' : ''}`}>{metrics.p95}s</div>
                            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">p95 wait</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                            <div className="text-lg font-bold font-mono">{world.delivered}</div>
                            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Served</div>
                        </div>
                        <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                            <div className="text-lg font-bold font-mono">{world.waiting.length}</div>
                            <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Waiting now</div>
                        </div>
                    </div>

                    {/* Wait-time histogram */}
                    <div className="p-3 rounded-lg bg-muted/30 border border-border">
                        <div className="text-[9px] uppercase tracking-wide text-muted-foreground mb-2">Wait-time distribution ({MODE_LABEL[mode]} run)</div>
                        <div className="flex items-end gap-1" role="img" aria-label="Histogram of passenger wait times">
                            {histogram.map((count, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                    <span className="text-[8px] font-mono text-muted-foreground">{count > 0 ? count : ''}</span>
                                    <div
                                        className={`w-full rounded-t ${i >= 4 ? 'bg-red-500/70' : i >= 2 ? 'bg-amber-500/70' : 'bg-emerald-500/70'}`}
                                        style={{ height: `${Math.max(count > 0 ? 5 : 2, (count / histMax) * 44)}px` }}
                                        title={`${count} passengers`}
                                    />
                                    <span className="text-[8px] font-mono text-muted-foreground">{HIST_BUCKETS[i].label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comparison strip */}
                    {resultCount >= 2 && (
                        <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 text-xs font-mono flex flex-wrap gap-x-3 gap-y-1 items-center">
                            <span className="font-sans font-bold text-indigo-600 dark:text-indigo-400">p95 scoreboard:</span>
                            {(['manual', 'fcfs', 'look'] as Mode[]).filter(m => results[m]).map((m, i, arr) => (
                                <span key={m}>
                                    {MODE_LABEL[m]} p95: <span className="font-bold">{results[m]!.p95}s</span>
                                    {i < arr.length - 1 && <span className="text-muted-foreground"> ·</span>}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                        💡 Good dispatching isn&apos;t about speed — it&apos;s about <span className="font-bold">not changing your mind</span>. SCAN/LOOK turns chaos into a sweep.
                    </div>
                </div>
            </Card>
        </div>
    );
}
