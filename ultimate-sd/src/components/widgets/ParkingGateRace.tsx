"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, Play, Pause, RotateCcw, Lock, Zap, MousePointerClick, Lightbulb } from 'lucide-react';

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

type Mode = 'manual' | 'naive' | 'atomic';

// ---------------- Manual mode ("You be the database") ----------------

const MANUAL_SPOTS = 8;
const FREE_SPOT = 6; // spot #7 — the only free one

type Owner = 'A' | 'B';
type ManualSpot = { taken: boolean; cars: Owner[] };
type ManualGate = {
    pc: number; // 0 = READ, 1 = PICK, 2 = WRITE, 3 = done
    snapshot: number[] | null;
    picked: number | null;
    outcome: 'parked' | 'turned-away' | 'double-booked' | null;
};
type ManualState = { spots: ManualSpot[]; gates: Record<Owner, ManualGate>; log: string[] };

const OPS = ['READ', 'PICK', 'WRITE'] as const;
const OP_DESC = ['READ free spots', 'PICK a spot', 'WRITE assignment'] as const;

const initGate = (): ManualGate => ({ pc: 0, snapshot: null, picked: null, outcome: null });
const initManual = (): ManualState => ({
    spots: Array.from({ length: MANUAL_SPOTS }, (_, i) => ({ taken: i !== FREE_SPOT, cars: [] })),
    gates: { A: initGate(), B: initGate() },
    log: [],
});

// ---------------- Auto modes (naive / atomic) ----------------

const AUTO_SPOTS = 24;
const NUM_GATES = 6;
const TICK_MS = 160;

type AutoSpot = { occupant: number | null; collided: boolean; freeAt: number };
type AutoGate = { phase: 'idle' | 'waiting'; picked: number; writeAt: number };
type AutoState = {
    tick: number;
    spots: AutoSpot[];
    gates: AutoGate[];
    claims: number;
    collisions: number;
    retries: number;
    angry: number;
};

const initAuto = (): AutoState => ({
    tick: 0,
    spots: Array.from({ length: AUTO_SPOTS }, () => ({ occupant: null, collided: false, freeAt: 0 })),
    gates: Array.from({ length: NUM_GATES }, () => ({ phase: 'idle' as const, picked: -1, writeAt: 0 })),
    claims: 0, collisions: 0, retries: 0, angry: 0,
});

function stepAuto(prev: AutoState, atomic: boolean, rng: () => number): AutoState {
    const s: AutoState = {
        ...prev,
        tick: prev.tick + 1,
        spots: prev.spots.map(x => ({ ...x })),
        gates: prev.gates.map(g => ({ ...g })),
    };

    // Cars eventually leave; collided spots resolve (one car keeps it, the other left angry)
    for (const spot of s.spots) {
        if (spot.occupant !== null && s.tick >= spot.freeAt) {
            if (spot.collided) {
                spot.collided = false;
                spot.freeAt = s.tick + 10 + Math.floor(rng() * 12);
            } else {
                spot.occupant = null;
            }
        }
    }

    for (let gi = 0; gi < s.gates.length; gi++) {
        const g = s.gates[gi];
        if (g.phase === 'idle') {
            if (rng() < 0.8) {
                // READ: snapshot of free spots
                const free: number[] = [];
                s.spots.forEach((sp, i) => { if (sp.occupant === null) free.push(i); });
                if (free.length > 0) {
                    // PICK a spot, then WRITE after a random think-time — the dangerous gap
                    g.picked = free[Math.floor(rng() * free.length)];
                    g.writeAt = s.tick + 1 + Math.floor(rng() * 3);
                    g.phase = 'waiting';
                }
            }
        } else if (s.tick >= g.writeAt) {
            const spot = s.spots[g.picked];
            if (atomic) {
                // Compare-and-set: assign ONLY if still free, otherwise retry
                if (spot.occupant === null) {
                    spot.occupant = gi;
                    spot.freeAt = s.tick + 8 + Math.floor(rng() * 12);
                    s.claims++;
                } else {
                    s.retries++;
                }
            } else {
                // Blind write based on the stale read
                if (spot.occupant === null) {
                    spot.occupant = gi;
                    spot.freeAt = s.tick + 8 + Math.floor(rng() * 12);
                    s.claims++;
                } else {
                    spot.collided = true;
                    spot.freeAt = s.tick + 6;
                    s.collisions++;
                    s.angry++;
                    s.claims++; // the gate *thinks* it succeeded
                }
            }
            g.phase = 'idle';
        }
    }
    return s;
}

// ---------------- Component ----------------

const GATE_COLOR: Record<Owner, string> = {
    A: 'text-cyan-500',
    B: 'text-violet-500',
};
const GATE_BG: Record<Owner, string> = {
    A: 'bg-cyan-500/10 border-cyan-500/30',
    B: 'bg-violet-500/10 border-violet-500/30',
};

export default function ParkingGateRace() {
    const [mode, setMode] = useState<Mode>('manual');
    const [manual, setManual] = useState<ManualState>(initManual);
    const [safeRunDone, setSafeRunDone] = useState(false);
    const [raceCaused, setRaceCaused] = useState(false);

    const [auto, setAuto] = useState<AutoState>(initAuto);
    const [running, setRunning] = useState(false);
    const autoRef = useRef(auto);
    const rngRef = useRef(mulberry32(1337));
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Single ref-tracked interval; cleared on pause, mode switch and unmount.
    useEffect(() => {
        if (!running || mode === 'manual') return;
        const id = setInterval(() => {
            const next = stepAuto(autoRef.current, mode === 'atomic', rngRef.current);
            autoRef.current = next;
            setAuto(next);
        }, TICK_MS);
        intervalRef.current = id;
        return () => {
            clearInterval(id);
            if (intervalRef.current === id) intervalRef.current = null;
        };
    }, [running, mode]);

    // Detect outcome of a completed manual run
    const bothDone = manual.gates.A.pc === 3 && manual.gates.B.pc === 3;
    const collision = manual.spots.some(s => s.cars.length > 1);
    useEffect(() => {
        if (mode !== 'manual' || !bothDone) return;
        if (collision) setRaceCaused(true);
        else setSafeRunDone(true);
    }, [mode, bothDone, collision]);

    const resetAuto = () => {
        setRunning(false);
        rngRef.current = mulberry32(1337);
        const fresh = initAuto();
        autoRef.current = fresh;
        setAuto(fresh);
    };

    const switchMode = (m: Mode) => {
        if (m === mode) return;
        setMode(m);
        setRunning(false);
        rngRef.current = mulberry32(1337);
        const fresh = initAuto();
        autoRef.current = fresh;
        setAuto(fresh);
    };

    const runOp = (g: Owner) => {
        setManual(prev => {
            if (prev.gates[g].pc >= 3) return prev;
            const spots = prev.spots.map(s => ({ ...s, cars: [...s.cars] }));
            const gates: Record<Owner, ManualGate> = { A: { ...prev.gates.A }, B: { ...prev.gates.B } };
            const gate = gates[g];
            const log = [...prev.log];

            if (gate.pc === 0) {
                const free: number[] = [];
                spots.forEach((s, i) => { if (!s.taken && s.cars.length === 0) free.push(i); });
                gate.snapshot = free;
                log.push(`Gate ${g} · READ → ${free.length ? `sees spot #${free[0] + 1} free` : 'sees NO free spots'}`);
                gate.pc = 1;
            } else if (gate.pc === 1) {
                if (!gate.snapshot || gate.snapshot.length === 0) {
                    gate.outcome = 'turned-away';
                    gate.pc = 3;
                    log.push(`Gate ${g} · PICK → nothing free in its snapshot. Car ${g} turned away.`);
                } else {
                    gate.picked = gate.snapshot[0];
                    gate.pc = 2;
                    log.push(`Gate ${g} · PICK → chooses spot #${gate.picked + 1}`);
                }
            } else if (gate.pc === 2) {
                const spot = spots[gate.picked!];
                spot.cars.push(g);
                gate.pc = 3;
                if (spot.cars.length > 1) {
                    for (const owner of spot.cars) gates[owner].outcome = 'double-booked';
                    log.push(`Gate ${g} · WRITE → 💥 spot #${gate.picked! + 1} was already assigned. DOUBLE-BOOKED!`);
                } else {
                    gate.outcome = 'parked';
                    log.push(`Gate ${g} · WRITE → car ${g} parked in spot #${gate.picked! + 1} ✅`);
                }
            }
            return { spots, gates, log };
        });
    };

    const claimsPerSec = auto.tick > 0 ? (auto.claims / (auto.tick * TICK_MS / 1000)) : 0;

    const renderManual = () => (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5 shrink-0" />
                Two cars arrive at once and only one spot is left. You execute the database: click either gate&apos;s next operation, in any order you like.
            </p>

            {/* Spot grid */}
            <div className="grid grid-cols-8 gap-1.5 p-3 rounded-lg bg-muted/40 border border-border">
                {manual.spots.map((s, i) => {
                    const isCollision = s.cars.length > 1;
                    const isFree = !s.taken && s.cars.length === 0;
                    return (
                        <div
                            key={i}
                            className={`h-12 rounded-md border flex flex-col items-center justify-center text-center leading-none
                                ${isCollision ? 'bg-red-500/20 border-red-500 animate-pulse' :
                                    isFree ? 'bg-emerald-500/10 border-emerald-500/50 border-dashed' :
                                        'bg-card border-border'}`}
                        >
                            <span className="text-sm">
                                {isCollision ? '🚗🚗' : isFree ? '' : '🚗'}
                            </span>
                            <span className={`text-[9px] font-mono mt-0.5 ${isCollision ? 'text-red-500 font-bold' : isFree ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-muted-foreground'}`}>
                                {isCollision ? '💥' : `#${i + 1}${isFree ? ' FREE' : ''}`}
                            </span>
                            {s.cars.length === 1 && (
                                <span className={`text-[9px] font-bold ${GATE_COLOR[s.cars[0]]}`}>car {s.cars[0]}</span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Gates */}
            <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                {(['A', 'B'] as Owner[]).map(g => {
                    const gate = manual.gates[g];
                    return (
                        <div key={g} className={`p-3 rounded-lg border ${GATE_BG[g]} space-y-2`}>
                            <div className="flex items-center justify-between">
                                <span className={`font-bold text-sm flex items-center gap-1.5 ${GATE_COLOR[g]}`}>
                                    <Car className="h-4 w-4" /> Gate {g}
                                </span>
                                {gate.outcome && (
                                    <Badge
                                        variant={gate.outcome === 'double-booked' ? 'destructive' : 'secondary'}
                                        className="text-[10px] h-5"
                                    >
                                        {gate.outcome === 'parked' ? 'Parked ✅' : gate.outcome === 'turned-away' ? 'Turned away' : 'Double-booked 💥'}
                                    </Badge>
                                )}
                            </div>
                            <div className="flex gap-1">
                                {OPS.map((op, i) => (
                                    <span
                                        key={op}
                                        className={`flex-1 text-center text-[10px] font-mono py-1 rounded border
                                            ${gate.pc > i ? 'bg-muted text-muted-foreground border-transparent line-through' :
                                                gate.pc === i ? 'bg-primary/10 border-primary/50 font-bold' :
                                                    'border-border text-muted-foreground/60'}`}
                                    >
                                        {op}
                                    </span>
                                ))}
                            </div>
                            <div className="text-[10px] font-mono text-muted-foreground min-h-4">
                                {gate.snapshot !== null && (
                                    <span>saw: {gate.snapshot.length ? gate.snapshot.map(i => `#${i + 1}`).join(', ') + ' free' : 'lot full'}</span>
                                )}
                                {gate.picked !== null && <span> · picked #{gate.picked + 1}</span>}
                            </div>
                            <Button
                                onClick={() => runOp(g)}
                                disabled={gate.pc >= 3}
                                size="sm"
                                className="w-full text-xs"
                                aria-label={gate.pc >= 3 ? `Gate ${g}: done` : `Gate ${g}: run ${OPS[gate.pc]}`}
                            >
                                {gate.pc >= 3 ? 'Done' : `Run ${OP_DESC[gate.pc]}`}
                            </Button>
                        </div>
                    );
                })}
            </div>

            {/* Outcome banners */}
            {bothDone && collision && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-xs">
                    <span className="font-bold text-red-500">💥 Double-booked!</span>{' '}
                    Both gates READ the same &quot;free&quot; state, then both WROTE. Neither check was wrong — the world just changed between the check and the write. That gap is the race.
                </div>
            )}
            {bothDone && !collision && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/40 text-xs">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Safe this time.</span>{' '}
                    One gate finished its WRITE before the other READ, so the second gate saw the truth.
                </div>
            )}
            {safeRunDone && !raceCaused && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/40 text-xs flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>
                        Now break it: reset, then run <span className="font-mono font-bold">A READ → B READ → A WRITE → B WRITE</span>. Both gates will see the same free spot…
                    </span>
                </div>
            )}

            {/* Op log */}
            {manual.log.length > 0 && (
                <div className="space-y-1 max-h-28 overflow-y-auto">
                    {manual.log.map((line, i) => (
                        <div key={i} className="text-[10px] font-mono text-muted-foreground px-2 py-1 rounded bg-muted/40 border border-border/50">
                            {line}
                        </div>
                    ))}
                </div>
            )}

            <Button onClick={() => setManual(initManual())} size="sm" variant="outline" className="text-xs">
                <RotateCcw className="h-3 w-3 mr-1" /> Reset lot
            </Button>
        </div>
    );

    const renderAuto = (atomic: boolean) => (
        <div className="space-y-4">
            <p className="text-xs text-muted-foreground">
                {atomic
                    ? <>Same 6 gates, but each claim is a single compare-and-set: <span className="font-mono">&quot;assign spot 12 to me IF it is still free&quot;</span>. Losers just retry.</>
                    : <>6 gates each READ the free list, think for a moment, then WRITE. The gap between read and write is where disaster lives.</>}
            </p>

            {/* Controls */}
            <div className="flex items-center gap-2 flex-wrap">
                <Button
                    onClick={() => setRunning(r => !r)}
                    size="sm"
                    className={`text-xs ${atomic ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                    {running ? <><Pause className="h-3 w-3 mr-1" /> Pause</> : <><Play className="h-3 w-3 mr-1" /> Start</>}
                </Button>
                <Button onClick={resetAuto} size="sm" variant="outline" className="text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" /> Reset
                </Button>
                <span className="text-[10px] font-mono text-muted-foreground ml-auto">
                    t = {(auto.tick * TICK_MS / 1000).toFixed(1)}s
                </span>
            </div>

            {/* Stat tiles */}
            <div className="grid grid-cols-2 @md:grid-cols-4 gap-2">
                <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                    <div className="text-lg font-bold font-mono">{claimsPerSec.toFixed(1)}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Claims/sec</div>
                </div>
                <div className={`p-2 rounded-lg border text-center ${auto.collisions > 0 ? 'bg-red-500/10 border-red-500/40' : 'bg-muted/40 border-border'}`}>
                    <div className={`text-lg font-bold font-mono ${auto.collisions > 0 ? 'text-red-500' : ''}`}>{auto.collisions}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Collisions</div>
                </div>
                <div className={`p-2 rounded-lg border text-center ${auto.retries > 0 ? 'bg-amber-500/10 border-amber-500/40' : 'bg-muted/40 border-border'}`}>
                    <div className={`text-lg font-bold font-mono ${auto.retries > 0 ? 'text-amber-500' : ''}`}>{auto.retries}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Retries</div>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border text-center">
                    <div className="text-lg font-bold font-mono">{auto.angry > 0 ? '😡' : ''} {auto.angry}</div>
                    <div className="text-[9px] uppercase tracking-wide text-muted-foreground">Angry customers</div>
                </div>
            </div>

            {/* Gates strip */}
            <div className="flex gap-1.5">
                {auto.gates.map((g, i) => (
                    <div
                        key={i}
                        className={`flex-1 text-center py-1 rounded border text-[10px] font-mono
                            ${g.phase === 'waiting' ? 'bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400' : 'bg-muted/40 border-border text-muted-foreground'}`}
                        title={g.phase === 'waiting' ? `Gate ${i + 1}: read done, write pending…` : `Gate ${i + 1}: idle`}
                    >
                        G{i + 1}{g.phase === 'waiting' ? '…' : ''}
                    </div>
                ))}
            </div>

            {/* Spot grid */}
            <div className="grid grid-cols-8 gap-1 p-3 rounded-lg bg-muted/40 border border-border">
                {auto.spots.map((s, i) => (
                    <div
                        key={i}
                        className={`h-9 rounded flex items-center justify-center text-xs border
                            ${s.collided ? 'bg-red-500/20 border-red-500 animate-pulse' :
                                s.occupant !== null ? 'bg-card border-border' :
                                    'bg-emerald-500/10 border-emerald-500/40 border-dashed'}`}
                        title={s.collided ? 'Double-booked!' : s.occupant !== null ? `Taken (gate ${s.occupant + 1})` : 'Free'}
                    >
                        {s.collided ? '💥' : s.occupant !== null ? '🚗' : ''}
                    </div>
                ))}
            </div>

            <div className="text-[10px] text-muted-foreground">
                {atomic
                    ? 'Zero collisions — the price is a few retries and slightly lower per-gate throughput. That is the honest trade-off.'
                    : 'Every 💥 is two drivers holding a ticket for the same spot.'}
            </div>
        </div>
    );

    return (
        <div className="@container space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-emerald-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2">
                            <Car className="h-5 w-5 text-emerald-500" />
                            Parking Gate Race
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                            Why two gates can sell the same parking spot — and how atomic claims fix it.
                        </p>
                    </div>

                    {/* Mode tabs */}
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            onClick={() => switchMode('manual')}
                            size="sm" variant={mode === 'manual' ? 'default' : 'outline'} className="text-xs"
                        >
                            <MousePointerClick className="h-3 w-3 mr-1" /> You be the database
                        </Button>
                        <Button
                            onClick={() => switchMode('naive')}
                            size="sm" variant={mode === 'naive' ? 'default' : 'outline'} className="text-xs"
                        >
                            <Zap className="h-3 w-3 mr-1" /> Naive (auto)
                        </Button>
                        <Button
                            onClick={() => switchMode('atomic')}
                            size="sm" variant={mode === 'atomic' ? 'default' : 'outline'} className="text-xs"
                        >
                            <Lock className="h-3 w-3 mr-1" /> Atomic claim
                        </Button>
                    </div>

                    {mode === 'manual' ? renderManual() : renderAuto(mode === 'atomic')}

                    <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                        💡 The fix isn&apos;t &quot;check first&quot; — it&apos;s making check-and-assign <span className="font-bold">ONE atomic operation</span>.
                    </div>
                </div>
            </Card>
        </div>
    );
}
