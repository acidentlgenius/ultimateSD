import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, FileText, Lock, RefreshCw, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Mock hashing function
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
};

interface LogEntry {
    id: number;
    timestamp: string;
    action: string;
    user: string;
    prevHash: string;
    hash: string;
    isTampered: boolean;
}

const INITIAL_LOGS: LogEntry[] = [
    { id: 1, timestamp: '10:00:01', action: 'System Init', user: 'system', prevHash: '00000000', hash: '', isTampered: false },
    { id: 2, timestamp: '10:05:23', action: 'User Login', user: 'alice', prevHash: '', hash: '', isTampered: false },
    { id: 3, timestamp: '10:06:15', action: 'View Document', user: 'alice', prevHash: '', hash: '', isTampered: false },
];

export default function AuditLogVisualizer() {
    const [logs, setLogs] = useState<LogEntry[]>(INITIAL_LOGS);
    const [isValid, setIsValid] = useState(true);

    // Recalculate hashes effectively "mining" the chain or verifying integrity
    useEffect(() => {
        let validChain = true;
        const newLogs = [...logs];

        for (let i = 0; i < newLogs.length; i++) {
            const prev = i === 0 ? '00000000' : newLogs[i - 1].hash;
            const dataToHash = `${newLogs[i].id}${newLogs[i].timestamp}${newLogs[i].action}${newLogs[i].user}${prev}`;
            const calculatedHash = simpleHash(dataToHash);

            // If the stored hash is different (and not empty initially), it's a break
            // But for this demo, we'll auto-update hash unless it's marked 'isTampered'
            // If we want to simulate tamper-proofing, we should freeze the hash once set.

            if (newLogs[i].hash === '') {
                newLogs[i].hash = calculatedHash;
                newLogs[i].prevHash = prev;
            } else {
                // Verification mode
                const currentCalc = simpleHash(dataToHash);
                // If the content changed BUT the hash remains the old one (tamper simulation)
                // In this simplified demo, 'isTampered' flag forces a mismatch visual
                if (newLogs[i].isTampered) {
                    validChain = false;
                } else {
                    // Normal chain update (e.g. extending)
                    newLogs[i].prevHash = prev;
                    newLogs[i].hash = currentCalc;
                }
            }

            // Check chain integrity
            if (i > 0 && newLogs[i].prevHash !== newLogs[i - 1].hash) {
                validChain = false;
            }
        }

        // Only update state if JSON stringify differs to avoid loop, 
        // but here we modified in place, so careful. 
        // For visualizer simplicity, we'll trust the tamper flag primarily for the logic.
        const chainBroken = newLogs.some(l => l.isTampered) || newLogs.some((l, i) => i > 0 && l.prevHash !== newLogs[i - 1].hash);
        setIsValid(!chainBroken);

    }, [logs]); // Dependency on logs structure

    const addLog = () => {
        const id = logs.length + 1;
        const actions = ['Update Config', 'Delete Record', 'Export Data', 'Grant Access'];
        const users = ['bob', 'charlie', 'dave', 'admin'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const now = new Date().toLocaleTimeString();

        const prevHash = logs[logs.length - 1].hash;
        const newEntry: LogEntry = {
            id,
            timestamp: now,
            action,
            user,
            prevHash,
            hash: simpleHash(`${id}${now}${action}${user}${prevHash}`),
            isTampered: false
        };

        setLogs([...logs, newEntry]);
    };

    const tamperLog = (id: number) => {
        setLogs(logs.map(log => {
            if (log.id === id) {
                return { ...log, action: log.action + ' (Tampered)', isTampered: true };
            }
            return log;
        }));
    };

    const repairChain = () => {
        // Reset to a clean state for demo purposes
        setLogs(INITIAL_LOGS.map(l => ({ ...l, hash: '', prevHash: '' }))); // Reset hashes to trigger recalc
    };

    return (
        <div className="w-full max-w-4xl p-4 text-slate-900 bg-slate-50 rounded-xl border border-slate-200 shadow-sm font-sans mx-auto">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isValid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {isValid ? <Shield className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Immutable Audit Log</h2>
                        <p className="text-sm text-slate-500">Cryptographically chained events</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={repairChain} className="gap-2">
                        <RefreshCw className="w-4 h-4" /> Reset
                    </Button>
                    <Button size="sm" onClick={addLog} className="gap-2" disabled={!isValid}>
                        <Plus className="w-4 h-4" /> New Event
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {logs.map((log, index) => (
                        <motion.div
                            key={log.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative"
                        >
                            <div className={`
                relative p-4 rounded-lg border-2 transition-all
                ${log.isTampered ? 'bg-red-50 border-red-300' : 'bg-black dark:bg-white border-slate-200'}
                ${!isValid && !log.isTampered && index > logs.findIndex(l => l.isTampered) ? 'opacity-50' : ''}
              `}>
                                {/* Connector Line */}
                                {index < logs.length - 1 && (
                                    <div className={`absolute left-8 top-full h-4 w-0.5 z-10 
                    ${!isValid && index >= logs.findIndex(l => l.isTampered) ? 'bg-red-300' : 'bg-slate-300'}
                  `}></div>
                                )}

                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="mt-1">
                                            <Badge variant={log.isTampered ? "destructive" : "secondary"}>
                                                ID: {log.id}
                                            </Badge>
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs text-slate-400">{log.timestamp}</span>
                                                <span className="font-bold text-slate-800">{log.action}</span>
                                            </div>
                                            <div className="text-sm text-slate-600 mb-2">User: {log.user}</div>

                                            <div className="flex gap-4 text-xs font-mono">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 text-[10px] uppercase">Prev Hash</span>
                                                    <span className={
                                                        index > 0 && logs[index - 1].hash !== log.prevHash
                                                            ? "text-red-500 font-bold"
                                                            : "text-slate-500"
                                                    }>
                                                        {log.prevHash || "00000000"}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-slate-400 text-[10px] uppercase">Current Hash</span>
                                                    <span className="text-emerald-600 font-medium">{log.hash}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        {!log.isTampered && isValid && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-slate-400 hover:text-red-500"
                                                onClick={() => tamperLog(log.id)}
                                                title="Simulate Attack (Tamper Data)"
                                                aria-label="Simulate Attack (Tamper Data)"
                                            >
                                                <Lock className="w-4 h-4" />
                                            </Button>
                                        )}
                                        {log.isTampered && (
                                            <Badge variant="destructive">TAMPERED</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

        </div>
    );
}
