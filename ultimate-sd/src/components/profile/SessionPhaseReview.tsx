"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Award, Calendar, Hash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StepAttemptCard } from "@/components/profile/StepAttemptCard";
import { DiagramSnapshotViewer } from "@/components/profile/DiagramSnapshotViewer";
import type { SessionDetail } from "@/types";

interface SessionPhaseReviewProps {
    session: SessionDetail;
    backHref?: string;
    backLabel?: string;
    showBackLink?: boolean;
    userName?: string | null;
    userEmail?: string;
}

export function SessionPhaseReview({
    session,
    backHref = "/profile",
    backLabel = "Back to Profile",
    showBackLink = true,
    userName,
    userEmail,
}: SessionPhaseReviewProps) {
    const defaultPhase = session.phases[0]?.phase ?? "";

    return (
        <div className="space-y-8">
            <div className="space-y-4">
                {showBackLink && (
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {backLabel}
                    </Link>
                )}

                <div className="glass-card rounded-2xl p-6 md:p-8 border border-border/50 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div className="space-y-2">
                            {(userName || userEmail) && (
                                <p className="text-sm text-muted-foreground">
                                    {userName ?? "Unknown user"}
                                    {userEmail ? ` · ${userEmail}` : ""}
                                </p>
                            )}
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                {session.problemTitle}
                            </h1>
                            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <Hash className="w-4 h-4" />
                                    Attempt {session.attemptNumber}
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <Calendar className="w-4 h-4" />
                                    {format(new Date(session.startedAt), "MMM d, yyyy")}
                                </span>
                                {session.finalScore != null && (
                                    <span className="flex items-center gap-1.5 font-medium text-foreground">
                                        <Award className="w-4 h-4 text-yellow-500" />
                                        Final Score: {session.finalScore}%
                                    </span>
                                )}
                            </div>
                        </div>
                        <SessionStatusBadge status={session.status} />
                    </div>
                </div>
            </div>

            {session.phases.length > 0 ? (
                <Tabs defaultValue={defaultPhase} className="space-y-6">
                    <TabsList className="flex-wrap h-auto gap-1 p-1">
                        {session.phases.map((phase) => (
                            <TabsTrigger key={phase.phase} value={phase.phase} className="px-4">
                                {phase.phaseLabel}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {session.phases.map((phase) => (
                        <TabsContent key={phase.phase} value={phase.phase} className="space-y-4 mt-4">
                            {phase.steps.map((step) => (
                                <StepAttemptCard key={step.stepId} step={step} />
                            ))}
                        </TabsContent>
                    ))}
                </Tabs>
            ) : (
                <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground border border-dashed border-border/60">
                    No step submissions recorded for this session.
                </div>
            )}

            <DiagramSnapshotViewer snapshot={session.diagramSnapshot} />
        </div>
    );
}

function SessionStatusBadge({ status }: { status: SessionDetail["status"] }) {
    switch (status) {
        case "COMPLETED":
            return (
                <Badge className="bg-green-500/15 text-green-700 border-green-200 shadow-none">
                    Completed
                </Badge>
            );
        case "ACTIVE":
            return (
                <Badge className="bg-blue-500/15 text-blue-700 border-blue-200 shadow-none">
                    In Progress
                </Badge>
            );
        case "ABANDONED":
            return (
                <Badge variant="outline" className="text-muted-foreground shadow-none">
                    Abandoned
                </Badge>
            );
        default: {
            const _exhaustive: never = status;
            return _exhaustive;
        }
    }
}
