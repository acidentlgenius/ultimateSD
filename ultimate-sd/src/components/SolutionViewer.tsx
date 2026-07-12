'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Cpu, FileText, Layers, Database, ArrowRight, Lock } from 'lucide-react';
import { ExpertSolution } from '@/lib/solutions';
import { MermaidDiagram } from './MermaidDiagram';
interface SolutionViewerProps {
    solution: ExpertSolution | null;
    isOpen: boolean;
    onClose: () => void;
}

export function SolutionViewer({ solution, isOpen, onClose }: SolutionViewerProps) {
    if (!solution) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-full h-[90vh] flex flex-col p-0 gap-0 bg-background/95 backdrop-blur-xl border-amber-500/20" aria-describedby={undefined}>
                <DialogHeader className="p-6 pb-2 border-b border-border/50 shrink-0">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-amber-500/50 text-amber-500 bg-amber-500/10 px-3 py-1">
                            <Lock className="w-3 h-3 mr-1" /> Pro Content
                        </Badge>
                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Expert Architecture Guide</span>
                    </div>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {solution.title}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground/80 text-base mt-2">
                        {solution.overview}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    <Tabs defaultValue="architecture" className="h-full flex flex-col">
                        <div className="px-6 border-b border-border/50 bg-muted/20 shrink-0">
                            <TabsList className="bg-transparent h-12 w-full justify-start gap-6 p-0">
                                <TabsTrigger
                                    value="architecture"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-2 pt-2"
                                >
                                    Architecture & Components
                                </TabsTrigger>
                                <TabsTrigger
                                    value="dataflow"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-2 pt-2"
                                >
                                    Data Flow
                                </TabsTrigger>
                                <TabsTrigger
                                    value="tradeoffs"
                                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-amber-500 data-[state=active]:bg-transparent px-0 pb-2 pt-2"
                                >
                                    Trade-offs
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <ScrollArea className="flex-1 p-6">

                            <TabsContent value="architecture" className="mt-0 space-y-8 animate-fade-in">
                                {/* Architecture Diagram */}
                                <div className="w-full rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/10 flex flex-col items-center justify-center text-muted-foreground p-4 overflow-hidden relative group min-h-[300px]">
                                    <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)] pointer-events-none" />

                                    {solution.architectureMermaid ? (
                                        <div className="z-10 w-full">
                                            <MermaidDiagram chart={solution.architectureMermaid} />
                                        </div>
                                    ) : solution.architectureImage && !solution.architectureImage.includes('placeholder') ? (
                                        <img
                                            src={solution.architectureImage}
                                            alt="Architecture Diagram"
                                            className="w-full rounded-lg shadow-lg"
                                        />
                                    ) : (
                                        <div className="text-center z-10">
                                            <Layers className="h-16 w-16 mx-auto mb-4 opacity-50" />
                                            <p className="font-medium">System Architecture Diagram</p>
                                            <p className="text-sm opacity-70 mt-2">Visual representation not available</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {solution.components.map((comp, idx) => (
                                        <div key={idx} className="p-4 rounded-xl border border-border/50 bg-card hover:bg-muted/50 transition-colors">
                                            <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                                                {idx + 1}. {comp.name}
                                            </h3>
                                            <p className="text-sm text-muted-foreground mb-3">{comp.description}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {comp.technologies.map((tech) => (
                                                    <Badge key={tech} variant="secondary" className="text-xs font-normal bg-primary/10 text-primary hover:bg-primary/20">
                                                        {tech}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="dataflow" className="mt-0 animate-fade-in">
                                <div className="space-y-4 max-w-3xl mx-auto">
                                    <h3 className="text-lg font-semibold flex items-center gap-2 mb-6">
                                        <ArrowRight className="h-5 w-5 text-primary" />
                                        Request Lifecycle
                                    </h3>

                                    <div className="relative border-l-2 border-muted pl-8 space-y-8 py-2">
                                        {solution.dataFlow.map((step, idx) => (
                                            <div key={idx} className="relative">
                                                <div className="absolute -left-[41px] top-0 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center text-xs font-bold text-primary">
                                                    {idx + 1}
                                                </div>
                                                <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
                                                    <p className="text-sm font-medium leading-relaxed">{step}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="tradeoffs" className="mt-0 animate-fade-in">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2 text-green-500">
                                            <CheckCircle className="h-5 w-5" />
                                            Pros (Why this works)
                                        </h3>
                                        <div className="space-y-3">
                                            {solution.tradeoffs.pros.map((pro, i) => (
                                                <div key={i} className="p-4 rounded-lg bg-green-500/5 border border-green-500/10 text-sm">
                                                    {pro}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold flex items-center gap-2 text-red-500">
                                            <XCircle className="h-5 w-5" />
                                            Cons (Trade-offs)
                                        </h3>
                                        <div className="space-y-3">
                                            {solution.tradeoffs.cons.map((con, i) => (
                                                <div key={i} className="p-4 rounded-lg bg-red-500/5 border border-red-500/10 text-sm">
                                                    {con}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>
                </div>

                <div className="p-6 border-t border-border/50 bg-muted/10 flex justify-end shrink-0">
                    <Button onClick={onClose} size="lg" className="px-8">Close Guide</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
