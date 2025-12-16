"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { File, Database, Scissors, Save, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CHUNKS = {
    header: '1A2B3C',
    body1: '4D5E6F',
    body2: '7G8H9I',
    footer: '0J1K2L'
};

export default function ChunkingDedupeDemo() {
    const [serverChunks, setServerChunks] = useState<string[]>([]);
    const [uploadedBytes, setUploadedBytes] = useState(0);
    const [savedBytes, setSavedBytes] = useState(0);

    const [step, setStep] = useState(0);
    // 0: Upload File A, 1: Upload File B (Modified)

    const handleUploadFileA = () => {
        // File A = Header + Body1 + Footer
        const fileA = [CHUNKS.header, CHUNKS.body1, CHUNKS.footer];
        setServerChunks(fileA);
        setUploadedBytes(300); // Assume 100 bytes per chunk
        setStep(1);
    };

    const handleUploadFileB = () => {
        // File B = Header + Body2 (New) + Footer
        // Chunks: Header (Exists), Body2 (New), Footer (Exists)
        const newChunk = CHUNKS.body2;
        setServerChunks(prev => [...prev, newChunk]);
        setUploadedBytes(prev => prev + 100); // Only upload 1 chunk
        setSavedBytes(200); // Avoided uploading Header and Footer
        setStep(2);
    };

    const reset = () => {
        setServerChunks([]);
        setUploadedBytes(0);
        setSavedBytes(0);
        setStep(0);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-blue-400/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Scissors className="h-5 w-5 text-blue-500" />
                                Chunking & Deduplication
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                See how Dropbox saves bandwidth by only syncing changed blocks.
                            </p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={reset} disabled={step === 0}>
                            Reset
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">

                        {/* Client Side */}
                        <div className="space-y-6">
                            <h4 className="font-semibold flex items-center gap-2"><File className="h-4 w-4" /> Your Computer</h4>

                            {/* File A */}
                            <Card className={`p-4 border border-border transition-opacity ${step >= 1 ? 'opacity-50' : 'opacity-100'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold">Resume_v1.docx</span>
                                    {step === 0 && <Button size="sm" onClick={handleUploadFileA}>Upload</Button>}
                                    {step >= 1 && <Badge variant="outline" className="text-green-500">Synced</Badge>}
                                </div>
                                <div className="flex gap-1">
                                    <div className="h-8 flex-1 bg-gray-500/20 rounded border border-gray-500/50 flex items-center justify-center text-[10px] font-mono" title="Header">1A2B...</div>
                                    <div className="h-8 flex-[2] bg-blue-500/20 rounded border border-blue-500/50 flex items-center justify-center text-[10px] font-mono" title="Body 1">4D5E...</div>
                                    <div className="h-8 flex-1 bg-gray-500/20 rounded border border-gray-500/50 flex items-center justify-center text-[10px] font-mono" title="Footer">0J1K...</div>
                                </div>
                            </Card>

                            {/* File B */}
                            {step >= 1 && (
                                <Card className="p-4 border border-border">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-bold">Resume_v2.docx</span>
                                        {step === 1 && <Button size="sm" onClick={handleUploadFileB}>Sync Changes</Button>}
                                        {step === 2 && <Badge variant="outline" className="text-green-500">Synced</Badge>}
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-2">You changed the middle paragraph.</p>
                                    <div className="flex gap-1">
                                        <div className="h-8 flex-1 bg-gray-500/20 rounded border border-gray-500/50 flex items-center justify-center text-[10px] font-mono opacity-50">1A2B...</div>
                                        <div className="h-8 flex-[2] bg-orange-500/20 rounded border border-orange-500/50 flex items-center justify-center text-[10px] font-mono animate-pulse">7G8H...</div>
                                        <div className="h-8 flex-1 bg-gray-500/20 rounded border border-gray-500/50 flex items-center justify-center text-[10px] font-mono opacity-50">0J1K...</div>
                                    </div>
                                </Card>
                            )}
                        </div>

                        {/* Server Side */}
                        <div className="space-y-6 border-l pl-8 border-border/50">
                            <h4 className="font-semibold flex items-center gap-2"><Database className="h-4 w-4" /> Cloud Storage (Chunks)</h4>

                            <div className="grid grid-cols-3 gap-2">
                                <AnimatePresence>
                                    {serverChunks.includes(CHUNKS.header) && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-gray-500/10 border border-gray-500/30 rounded text-center">
                                            <span className="text-[10px] font-mono block text-muted-foreground">Header</span>
                                            <span className="text-xs font-bold">1A2B3C</span>
                                        </motion.div>
                                    )}
                                    {serverChunks.includes(CHUNKS.body1) && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-blue-500/10 border border-blue-500/30 rounded text-center">
                                            <span className="text-[10px] font-mono block text-blue-400">Body1</span>
                                            <span className="text-xs font-bold">4D5E6F</span>
                                        </motion.div>
                                    )}
                                    {serverChunks.includes(CHUNKS.footer) && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-gray-500/10 border border-gray-500/30 rounded text-center">
                                            <span className="text-[10px] font-mono block text-muted-foreground">Footer</span>
                                            <span className="text-xs font-bold">0J1K2L</span>
                                        </motion.div>
                                    )}
                                    {serverChunks.includes(CHUNKS.body2) && (
                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="p-2 bg-orange-500/10 border border-orange-500/30 rounded text-center">
                                            <span className="text-[10px] font-mono block text-orange-400">Body2</span>
                                            <span className="text-xs font-bold">7G8H9I</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest">Data Uploaded</div>
                            <div className="text-xl font-bold text-blue-500">{uploadedBytes} KB</div>
                        </div>
                        <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest">Bandwidth Saved</div>
                            <div className="text-xl font-bold text-green-500">{savedBytes} KB</div>
                        </div>
                    </div>
                    {step === 2 && (
                        <p className="text-center text-xs text-muted-foreground">
                            Because 'Header' and 'Footer' hashes matched existing chunks, they weren't re-uploaded!
                        </p>
                    )}

                </div>
            </Card>
        </div>
    );
}
