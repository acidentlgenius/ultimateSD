"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ChevronDown, ChevronUp, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { StepSubmissionDetail } from "@/types";

interface StepAttemptCardProps {
    step: StepSubmissionDetail;
}

export function StepAttemptCard({ step }: StepAttemptCardProps) {
    const [showFailed, setShowFailed] = useState(false);

    const passingAttempts = step.attempts.filter((a) => a.isPassing);
    const failedAttempts = step.attempts.filter((a) => !a.isPassing);
    const latestPassing = passingAttempts[passingAttempts.length - 1];
    const displayAttempt = latestPassing ?? step.attempts[step.attempts.length - 1];

    if (!displayAttempt) return null;

    return (
        <Card className="glass-card border-border/50">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-base font-semibold">{step.stepTitle}</CardTitle>
                    <div className="flex items-center gap-2 shrink-0">
                        {displayAttempt.isPassing ? (
                            <Badge className="bg-green-500/15 text-green-700 border-green-200 shadow-none">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Passed
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="text-muted-foreground shadow-none">
                                <XCircle className="w-3 h-3 mr-1" />
                                Attempted
                            </Badge>
                        )}
                        {displayAttempt.score != null && (
                            <Badge variant="secondary" className="font-mono shadow-none">
                                {displayAttempt.score}%
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Your Answer
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap bg-muted/30 p-4 rounded-xl border border-border/40">
                        {displayAttempt.content}
                    </p>
                </div>

                {displayAttempt.feedback && (
                    <div className="space-y-3">
                        {displayAttempt.feedback.strengths && displayAttempt.feedback.strengths.length > 0 && (
                            <FeedbackSection title="Strengths" items={displayAttempt.feedback.strengths} tone="green" />
                        )}
                        {displayAttempt.feedback.weaknesses && displayAttempt.feedback.weaknesses.length > 0 && (
                            <FeedbackSection title="Weaknesses" items={displayAttempt.feedback.weaknesses} tone="amber" />
                        )}
                        {displayAttempt.feedback.missed && displayAttempt.feedback.missed.length > 0 && (
                            <FeedbackSection title="Missed Points" items={displayAttempt.feedback.missed} tone="red" />
                        )}
                    </div>
                )}

                <p className="text-xs text-muted-foreground">
                    {format(new Date(displayAttempt.createdAt), "MMM d, yyyy · h:mm a")}
                </p>

                {failedAttempts.length > 0 && (
                    <div className="pt-2 border-t border-border/40">
                        <button
                            type="button"
                            onClick={() => setShowFailed((prev) => !prev)}
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showFailed ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                            {failedAttempts.length} earlier failed attempt
                            {failedAttempts.length !== 1 ? "s" : ""}
                        </button>

                        {showFailed && (
                            <div className="mt-3 space-y-3">
                                {failedAttempts.map((attempt) => (
                                    <div
                                        key={attempt.id}
                                        className="p-4 rounded-xl bg-muted/20 border border-border/40 space-y-2"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(attempt.createdAt), "MMM d · h:mm a")}
                                            </span>
                                            {attempt.score != null && (
                                                <Badge variant="outline" className="text-xs font-mono shadow-none">
                                                    {attempt.score}%
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-4">
                                            {attempt.content}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function FeedbackSection({
    title,
    items,
    tone,
}: {
    title: string;
    items: string[];
    tone: "green" | "amber" | "red";
}) {
    const toneClasses = {
        green: "text-green-700 dark:text-green-400",
        amber: "text-amber-700 dark:text-amber-400",
        red: "text-red-700 dark:text-red-400",
    };

    return (
        <div>
            <p className={cn("text-xs font-semibold uppercase tracking-wider mb-1.5", toneClasses[tone])}>
                {title}
            </p>
            <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </div>
    );
}
