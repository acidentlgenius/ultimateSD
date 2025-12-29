'use client';

import React, { useEffect, useState } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from 'date-fns';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getStepSubmissions } from '@/app/actions/progress';

interface StepSubmission {
    id: string;
    content: string;
    feedback: string | null;
    score: number | null;
    isPassing: boolean;
    createdAt: Date;
}

interface Props {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    problemId: string;
    stepId: string;
    stepTitle: string;
}

export default function SubmissionHistory({ isOpen, onOpenChange, problemId, stepId, stepTitle }: Props) {
    const [submissions, setSubmissions] = useState<StepSubmission[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && problemId && stepId) {
            setLoading(true);
            setError(null);
            getStepSubmissions(problemId, stepId)
                .then(result => {
                    if (result.success && result.submissions) {
                        setSubmissions(result.submissions);
                    } else {
                        setError(result.error || 'Failed to load history');
                    }
                })
                .catch(err => {
                    console.error(err);
                    setError('An unexpected error occurred');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, problemId, stepId]);

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
                <SheetHeader>
                    <SheetTitle>Submission History</SheetTitle>
                    <SheetDescription>
                        History for step: <span className="font-medium text-foreground">{stepTitle}</span>
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 mt-6 overflow-hidden relative">
                    {loading ? (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : error ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-red-500">
                            <AlertCircle className="h-8 w-8 mb-2" />
                            <p>{error}</p>
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                            <p>No submissions found for this step yet.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-full pr-4">
                            <div className="space-y-6 pb-6">
                                {submissions.map((sub, index) => (
                                    <div key={sub.id} className="group relative border-l-2 border-muted pl-4 ml-2">
                                        {/* Timeline Dot */}
                                        <div className={`absolute -left-[5px] top-0 h-2.5 w-2.5 rounded-full border ring-4 ring-background ${sub.isPassing ? 'bg-green-500 border-green-500' : 'bg-muted-foreground border-muted-foreground'}`} />

                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">
                                                    {formatDistanceToNow(new Date(sub.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                            <Badge variant={sub.isPassing ? "default" : "secondary"} className={sub.isPassing ? "bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200" : ""}>
                                                {sub.score !== null ? `${sub.score}%` : 'N/A'}
                                            </Badge>
                                        </div>

                                        <div className="bg-muted/30 rounded-lg p-3 space-y-3">
                                            <div>
                                                <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Your Answer</p>
                                                <p className="text-sm whitespace-pre-wrap font-mono text-xs text-foreground/80 bg-background/50 p-2 rounded border border-border/50 max-h-32 overflow-y-auto">
                                                    {sub.content}
                                                </p>
                                            </div>

                                            {sub.feedback && (
                                                <div>
                                                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">Feedback</p>
                                                    <div className="text-sm text-foreground/90 p-2 rounded bg-background/50 border border-border/50">
                                                        {(() => {
                                                            try {
                                                                const feedbackObj = JSON.parse(sub.feedback);
                                                                if (feedbackObj.strengths && feedbackObj.weaknesses) {
                                                                    return (
                                                                        <div className="space-y-2">
                                                                            {feedbackObj.strengths.length > 0 && (
                                                                                <div className="text-xs">
                                                                                    <span className="text-green-600 font-medium">Strengths:</span> {feedbackObj.strengths.slice(0, 2).join(', ')}...
                                                                                </div>
                                                                            )}
                                                                            {feedbackObj.weaknesses.length > 0 && (
                                                                                <div className="text-xs">
                                                                                    <span className="text-red-500 font-medium">Weaknesses:</span> {feedbackObj.weaknesses.slice(0, 2).join(', ')}...
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                }
                                                                return <p className="text-xs">{JSON.stringify(feedbackObj).slice(0, 150)}...</p>;
                                                            } catch (e) {
                                                                return <p className="text-xs">{sub.feedback ? sub.feedback.slice(0, 150) + '...' : 'Invalid feedback format'}</p>;
                                                            }
                                                        })()}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
