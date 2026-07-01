import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, RefreshCw, Terminal, Cpu, Globe, Calculator, Database } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Types for the ReAct log
type ActionType = 'THOUGHT' | 'ACTION' | 'OBSERVATION' | 'ANSWER';

interface LogEntry {
    id: string;
    type: ActionType;
    content: string;
    tool?: string;
    timestamp: string;
}

// Scenario Definition
const SCENARIO = {
    question: "What is the population of France times 5?",
    steps: [
        { type: 'THOUGHT', content: "I need to find the population of France first, then multiply it by 5." },
        { type: 'ACTION', content: "Searching for 'population of France 2024'", tool: 'Search' },
        { type: 'OBSERVATION', content: "The population of France is approximately 68 million as of 2024." },
        { type: 'THOUGHT', content: "Now I have the population (68,000,000). I need to multiply this by 5." },
        { type: 'ACTION', content: "68000000 * 5", tool: 'Calculator' },
        { type: 'OBSERVATION', content: "340,000,000" },
        { type: 'ANSWER', content: "The population of France times 5 is 340 million." }
    ]
} as const;

const AgentOrchestrator: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isPlaying && currentStepIndex < SCENARIO.steps.length) {
            timer = setTimeout(() => {
                const step = SCENARIO.steps[currentStepIndex];
                // Only valid if index >= 0
                if (step) {
                    // Logic handled in the 'next' tick actually, 
                    // but let's just make the timer trigger the NEXT step
                }
                addNextStep();
            }, 1500);
        } else if (currentStepIndex >= SCENARIO.steps.length) {
            setIsPlaying(false);
        }
        return () => clearTimeout(timer);
    }, [isPlaying, currentStepIndex]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const addNextStep = () => {
        if (currentStepIndex >= SCENARIO.steps.length - 1) {
            setIsPlaying(false);
            return;
        }

        const nextIndex = currentStepIndex + 1;
        const stepData = SCENARIO.steps[nextIndex];

        setLogs(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            type: stepData.type as ActionType,
            content: stepData.content,
            tool: (stepData as any).tool, // quick cast
            timestamp: new Date().toISOString().split('T')[1].split('.')[0]
        }]);

        setCurrentStepIndex(nextIndex);
    };

    const reset = () => {
        setIsPlaying(false);
        setCurrentStepIndex(-1);
        setLogs([]);
    };

    const getTypeColor = (type: ActionType) => {
        switch (type) {
            case 'THOUGHT': return 'text-amber-400 border-amber-400/30 bg-amber-950/20';
            case 'ACTION': return 'text-cyan-400 border-cyan-400/30 bg-cyan-950/20';
            case 'OBSERVATION': return 'text-purple-400 border-purple-400/30 bg-purple-950/20';
            case 'ANSWER': return 'text-emerald-400 border-emerald-400/30 bg-emerald-950/20';
            default: return 'text-slate-400';
        }
    };

    const getTypeIcon = (type: ActionType, tool?: string) => {
        if (type === 'ACTION' && tool === 'Search') return <Globe className="w-4 h-4" />;
        if (type === 'ACTION' && tool === 'Calculator') return <Calculator className="w-4 h-4" />;
        switch (type) {
            case 'THOUGHT': return <Cpu className="w-4 h-4" />;
            case 'ACTION': return <Terminal className="w-4 h-4" />;
            case 'OBSERVATION': return <Database className="w-4 h-4" />; // Using DB icon for returned data
            case 'ANSWER': return <SparklesIcon />; // Custom component below
            default: return <div className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 bg-slate-950 text-slate-100 rounded-xl border border-slate-800 shadow-2xl font-mono max-w-4xl mx-auto h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-slate-100">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                        Agent Orchestrator
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">ReAct Pattern: <span className="text-amber-500">Reasoning</span> + <span className="text-cyan-500">Acting</span></p>
                </div>

                <div className="flex items-center gap-2">
                    {!isPlaying && currentStepIndex === -1 ? (
                        <Button onClick={() => { setIsPlaying(true); addNextStep(); }} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
                            <Play className="w-4 h-4" /> Start Agent
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label={isPlaying ? "Pause scenario" : "Play scenario"}
                                title={isPlaying ? "Pause scenario" : "Play scenario"}
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="border-slate-700 hover:bg-slate-800"
                                disabled={currentStepIndex >= SCENARIO.steps.length - 1}
                                aria-label={isPlaying ? "Pause execution" : "Play execution"}
                                title={isPlaying ? "Pause execution" : "Play execution"}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                aria-label="Reset scenario"
                                title="Reset scenario"
                                onClick={reset}
                                className="border-slate-700 hover:bg-slate-800"
                                aria-label="Reset execution"
                                title="Reset execution"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Left Column: Context & State */}
                <div className="md:col-span-1 space-y-4">
                    <Card className="p-4 bg-slate-900 border-slate-800">
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Current Goal</h3>
                        <p className="text-sm text-slate-200 leading-relaxed">
                            "{SCENARIO.question}"
                        </p>
                    </Card>

                    <Card className="p-4 bg-slate-900 border-slate-800">
                        <h3 className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Active Tools</h3>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/50 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Globe className="w-3 h-3 text-blue-400" /> Google Search
                                </div>
                                <span className="text-slate-600">v2.1</span>
                            </div>
                            <div className="flex items-center justify-between text-xs p-2 rounded bg-slate-950/50 border border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-3 h-3 text-orange-400" /> Calculator
                                </div>
                                <span className="text-slate-600">v1.0</span>
                            </div>
                        </div>
                    </Card>

                    <div className="hidden md:block">
                        <div className="relative h-40 w-full flex items-center justify-center">
                            {isPlaying && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-24 h-24 border-4 border-slate-800/50 rounded-full animate-spin-slow" />
                                    <div className="w-16 h-16 border-2 border-emerald-500/30 rounded-full animate-ping" />
                                    <BotIcon className="w-10 h-10 text-emerald-500 relative z-10" />
                                </div>
                            )}
                            {!isPlaying && <BotIcon className="w-10 h-10 text-slate-700" />}
                        </div>
                    </div>
                </div>

                {/* Right Column: Execution Log */}
                <div className="md:col-span-2 flex flex-col min-h-0 bg-slate-950 rounded-lg border border-slate-900 overflow-hidden relative">
                    <div className="p-2 border-b border-slate-900 bg-slate-900/50 text-[10px] text-slate-500 flex justify-between">
                        <span>AGENT_LOGS.txt</span>
                        <span>READ_ONLY</span>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm custom-scrollbar"
                    >
                        {logs.length === 0 && (
                            <div className="h-full flex items-center justify-center text-slate-700 italic">
                                Waiting to start execution...
                            </div>
                        )}

                        <AnimatePresence initial={false}>
                            {logs.map((log) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex gap-3 max-w-[90%] ${log.type === 'OBSERVATION' ? 'ml-auto flex-row-reverse' : ''}`}
                                >
                                    <div className={`mt-1 shrink-0 w-6 h-6 rounded flex items-center justify-center border ${getTypeColor(log.type)}`}>
                                        {getTypeIcon(log.type, log.tool)}
                                    </div>

                                    <div className={`flex flex-col ${log.type === 'OBSERVATION' ? 'items-end' : 'items-start'}`}>
                                        <span className="text-[10px] text-slate-600 mb-1">{log.type} {log.tool ? `[${log.tool}]` : ''} • {log.timestamp}</span>
                                        <div className={`p-3 rounded-lg border text-sm ${getTypeColor(log.type)}`}>
                                            {log.content}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </div>

            </div>
        </div>
    );
};

// Icons (Simple SVGs if Lucide is missing or just for custom styling)
const SparklesIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
        className="w-4 h-4"
    >
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

const BotIcon = (props: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...props}
    >
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2" />
        <path d="M20 14h2" />
        <path d="M15 13v2" />
        <path d="M9 13v2" />
    </svg>
);

export default AgentOrchestrator;
