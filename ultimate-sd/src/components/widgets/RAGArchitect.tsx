import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Database, FileText, Sparkles, ArrowRight, Bot, User, BrainCircuit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

// Mock Knowledge Base
const KNOWLEDGE_BASE = [
    { id: '1', content: "To reset your password, go to Settings > Security > Password.", score: 0.92 },
    { id: '2', content: "Refunds are processed within 5-10 business days.", score: 0.15 },
    { id: '3', content: "2FA authentication adds an extra layer of security.", score: 0.88 },
    { id: '4', content: "Our API rate limit is 1000 requests per minute.", score: 0.05 },
];

const PRESET_QUERIES = [
    "How do I change my password?",
    "What is the refund policy?",
    "Is the API rate limited?",
];

const RAGArchitect: React.FC = () => {
    const [query, setQuery] = useState('');
    const [stage, setStage] = useState<'idle' | 'retrieving' | 'augmenting' | 'generating' | 'done'>('idle');
    const [retrievedDocs, setRetrievedDocs] = useState<typeof KNOWLEDGE_BASE>([]);
    const [generatedResponse, setGeneratedResponse] = useState('');

    const handleSearch = () => {
        if (!query.trim()) return;
        setStage('retrieving');
        setRetrievedDocs([]);
        setGeneratedResponse('');

        // Simulate Retrieval
        setTimeout(() => {
            // Simple keyword matching for demo purposes
            const relevant = KNOWLEDGE_BASE.filter(doc => {
                const qWords = query.toLowerCase().split(' ');
                return qWords.some(w => doc.content.toLowerCase().includes(w));
            });

            // Fallback if no match
            const results = relevant.length > 0 ? relevant : [KNOWLEDGE_BASE[0]];
            setRetrievedDocs(results);
            setStage('augmenting');
        }, 1500);
    };

    // Simulate Augmentation -> Generation
    useEffect(() => {
        if (stage === 'augmenting') {
            setTimeout(() => setStage('generating'), 1000);
        }
    }, [stage]);

    // Simulate Streaming Generation
    useEffect(() => {
        if (stage === 'generating') {
            const activeDoc = retrievedDocs[0]?.content || "No context found.";
            const answer = `Based on the context: "${activeDoc}", I can tell you that you should check your account settings. If you need further help, please contact support.`;

            let i = 0;
            const interval = setInterval(() => {
                setGeneratedResponse(answer.slice(0, i));
                i++;
                if (i > answer.length) {
                    clearInterval(interval);
                    setStage('done');
                }
            }, 30); // Typewriter speed

            return () => clearInterval(interval);
        }
    }, [stage, retrievedDocs]);

    return (
        <div className="p-6 bg-slate-950 text-slate-100 rounded-xl border border-indigo-900/50 shadow-2xl font-sans max-w-5xl mx-auto">
            <div className="mb-8 text-center">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center justify-center gap-3">
                    <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    RAG Architect
                </h2>
                <p className="text-indigo-200/60 mt-2">Retrieval-Augmented Generation Pipeline Simulator</p>
            </div>

            {/* Input Section */}
            <div className="max-w-2xl mx-auto mb-12 relative z-10">
                <div className="flex gap-2 mb-4">
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Ask a question about the system..."
                        className="bg-slate-900/80 border-indigo-800 text-indigo-100 placeholder:text-indigo-500/50"
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={stage !== 'idle' && stage !== 'done'}
                    />
                    <Button
                        onClick={handleSearch}
                        disabled={stage !== 'idle' && stage !== 'done'}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white min-w-[100px]"
                    >
                        {stage === 'idle' || stage === 'done' ? 'Ask AI' : 'Processing...'}
                    </Button>
                </div>
                <div className="flex gap-2 justify-center flex-wrap">
                    {PRESET_QUERIES.map(q => (
                        <button
                            key={q}
                            onClick={() => { setQuery(q); }}
                            className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:border-indigo-500 hover:text-indigo-300 transition-all"
                        >
                            {q}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pipeline Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Connecting Lines (Desktop Only) */}
                <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] -translate-y-1/2 -z-0">
                    <div className="w-full h-full bg-slate-800 relative overflow-hidden">
                        {(stage !== 'idle' && stage !== 'done') && (
                            <motion.div
                                className="absolute inset-0 bg-indigo-500/50"
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        )}
                    </div>
                </div>

                {/* Stage 1: Retrieval */}
                <div className="relative z-10">
                    <Card className={`h-64 p-4 border transition-all duration-500 flex flex-col ${stage === 'retrieving' ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex items-center gap-2 mb-4 text-indigo-300 font-semibold border-b border-indigo-500/20 pb-2">
                            <Database className="w-4 h-4" /> 1. Retrieval
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                            {stage === 'idle' && (
                                <div className="flex flex-col items-center justify-center h-full text-slate-600 text-sm">
                                    <Search className="w-8 h-8 mb-2 opacity-50" />
                                    Waiting for query...
                                </div>
                            )}

                            {stage === 'retrieving' && (
                                <div className="flex flex-col items-center justify-center h-full gap-3">
                                    <span className="relative flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                                    </span>
                                    <span className="text-indigo-300 animate-pulse text-sm">Scanning Vector DB...</span>
                                </div>
                            )}

                            {(stage === 'augmenting' || stage === 'generating' || stage === 'done') && (
                                retrievedDocs.map((doc, idx) => (
                                    <motion.div
                                        key={doc.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-indigo-950/50 p-2 rounded text-xs border border-indigo-500/30 text-indigo-200"
                                    >
                                        <div className="flex justify-between mb-1 opacity-50">
                                            <span>Chunk #{doc.id}</span>
                                            <span>Score: {doc.score}</span>
                                        </div>
                                        {doc.content}
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Stage 2: Context Augmentation */}
                <div className="relative z-10">
                    <Card className={`h-64 p-4 border transition-all duration-500 flex flex-col ${stage === 'augmenting' ? 'bg-purple-900/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'bg-slate-900 border-slate-800'}`}>
                        <div className="flex items-center gap-2 mb-4 text-purple-300 font-semibold border-b border-purple-500/20 pb-2">
                            <FileText className="w-4 h-4" /> 2. Augmentation
                        </div>

                        <div className="flex-1 overflow-hidden relative">
                            {stage === 'augmenting' ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-purple-950 p-3 rounded border border-purple-500/30 text-xs font-mono text-purple-200 h-full"
                                >
                                    <span className="text-purple-500">SYSTEM:</span> You are a helpful assistant.<br />
                                    <span className="text-purple-500">CONTEXT:</span> {retrievedDocs[0]?.content.substring(0, 50)}...<br />
                                    <span className="text-purple-500">USER:</span> {query}
                                </motion.div>
                            ) : (stage === 'generating' || stage === 'done') ? (
                                <div className="opacity-50 blur-[1px] bg-slate-900/50 h-full p-2 text-[10px] items-center justify-center flex text-slate-500">
                                    Context Window Prepared
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600 text-sm">Waiting...</div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Stage 3: Generation */}
                <div className="relative z-10">
                    <Card className={`h-64 p-4 border transition-all duration-500 flex flex-col ${stage === 'generating' ? 'bg-emerald-900/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : (stage === 'done' ? 'bg-emerald-950/30 border-emerald-600' : 'bg-slate-900 border-slate-800')}`}>
                        <div className="flex items-center gap-2 mb-4 text-emerald-300 font-semibold border-b border-emerald-500/20 pb-2">
                            <Sparkles className="w-4 h-4" /> 3. Generation
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {generatedResponse ? (
                                <div className="flex gap-3">
                                    <Bot className="w-6 h-6 text-emerald-400 shrink-0" />
                                    <p className="text-sm text-emerald-100 leading-relaxed font-mono">
                                        {generatedResponse}
                                        {stage === 'generating' && <span className="inline-block w-2 h-4 bg-emerald-400 ml-1 animate-pulse" />}
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-600 text-sm">
                                    Waiting for context...
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* Footer Info */}
            <div className="mt-8 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 max-w-2xl mx-auto">
                The <span className="text-indigo-400">RAG (Retrieval-Augmented Generation)</span> pattern solves LLM hallucinations by providing relevant context from a private knowledge base before generating an answer.
            </div>
        </div>
    );
};

export default RAGArchitect;
