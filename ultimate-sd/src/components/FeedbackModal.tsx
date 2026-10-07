'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Lightbulb, TrendingUp, Award, Trophy, Sparkles, Zap, Target } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { updateStreak } from '@/app/actions/gamification';
import { LockedFeatureButton } from '@/components/LockedFeatureButton';
import { FEATURES } from '@/lib/features';
import type { GateDecision } from '@/lib/adaptive-coach/types';

interface FeedbackData {
  score: number;
  accuracy: number;
  strengths: string[];
  weaknesses: string[];
  tips?: string[];
  missed?: string[];
  isAcceptable: boolean;
}

interface FeedbackModalProps {
  feedback: FeedbackData;
  isOpen: boolean;
  onClose: () => void;
  onContinue?: () => void;
  probeEntitled: boolean;
  onStartProbe: () => void;
  xpEarned?: number;
  canAdvance?: boolean;
  tip?: string | null;
  gate?: GateDecision | null;
  /** Exact answer that was scored — shown so the user can see what earned the score. */
  userAnswer?: string | null;
}

export default function FeedbackModal({
  feedback,
  isOpen,
  onClose,
  onContinue,
  probeEntitled,
  onStartProbe,
  xpEarned = 0,
  canAdvance,
  tip,
  gate,
  userAnswer,
}: FeedbackModalProps) {
  const allowAdvance = canAdvance ?? feedback.isAcceptable;
  const isCoachedAdvance =
    gate?.action === 'teach_forward' || gate?.action === 'advance_budget';
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);
  const accuracyBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (feedback.isAcceptable && !isCoachedAdvance) {
        const handleStreakUpdate = async () => {
          try {
            const result = await updateStreak();
            if (result && 'error' in result && result.error) {
              console.error('Failed to update streak:', result.error);
            }
          } catch (error) {
            console.error('Error updating streak:', error);
          }
        };
        handleStreakUpdate();
      }

      // Animate score counting up
      let startTime: number;
      const duration = 1500;
      const startScore = 0;
      const endScore = feedback.score;

      // SQUASH: Root Cause: requestAnimationFrame calls within useEffect were not being canceled on unmount,
      // leading to memory leaks and state updates on unmounted components.
      // SQUASH: Fix: Store the animation frame IDs and clearTimeout, then clean them up in the useEffect return function.
      let animationFrameScoreId: number = 0;
      let animationFrameAccuracyId: number = 0;
      let accuracyTimeoutId: NodeJS.Timeout;

      const animateScore = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedScore(Math.floor(startScore + (endScore - startScore) * easeOutQuart));

        if (progress < 1) {
          animationFrameScoreId = requestAnimationFrame(animateScore);
        }
      };

      // Animate accuracy percentage
      let accuracyStartTime: number;
      const accuracyDuration = 1200;
      const startAccuracy = 0;
      const endAccuracy = feedback.accuracy;

      const animateAccuracy = (timestamp: number) => {
        if (!accuracyStartTime) accuracyStartTime = timestamp;
        const progress = Math.min((timestamp - accuracyStartTime) / accuracyDuration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedAccuracy(Math.floor(startAccuracy + (endAccuracy - startAccuracy) * easeOutQuart));

        if (progress < 1) {
          animationFrameAccuracyId = requestAnimationFrame(animateAccuracy);
        }
      };

      animationFrameScoreId = requestAnimationFrame(animateScore);
      accuracyTimeoutId = setTimeout(() => {
        animationFrameAccuracyId = requestAnimationFrame(animateAccuracy);
      }, 200);

      return () => {
        cancelAnimationFrame(animationFrameScoreId);
        cancelAnimationFrame(animationFrameAccuracyId);
        clearTimeout(accuracyTimeoutId);
      };
    } else {
      setAnimatedScore(0);
      setAnimatedAccuracy(0);
    }
  }, [isOpen, feedback, isCoachedAdvance]);

  const handleContinue = () => {
    if (allowAdvance && onContinue) {
      onContinue();
    }
    onClose();
  };

  const exportToPDF = async () => {
    const element = document.getElementById('feedback-content');
    if (!element) return;

    const canvas = await html2canvas(element);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF();
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    pdf.save('ultimate-sd-feedback.pdf');
  };

  // Determine color scheme based on score
  const getScoreColor = () => {
    if (feedback.score >= 8) return { primary: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30', gradient: 'from-green-500/20 to-emerald-500/10' };
    if (feedback.score >= 6) return { primary: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30', gradient: 'from-blue-500/20 to-cyan-500/10' };
    if (feedback.score >= 4) return { primary: 'text-yellow-600', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', gradient: 'from-yellow-500/20 to-amber-500/10' };
    return { primary: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/30', gradient: 'from-red-500/20 to-orange-500/10' };
  };

  const scoreColors = getScoreColor();
  const accuracyColor = feedback.accuracy >= 70 ? 'bg-green-500' : feedback.accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl w-full max-h-[90vh] overflow-y-auto p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-3xl font-bold flex items-center gap-3">
              <div className={`p-2 rounded-xl ${feedback.isAcceptable ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                {feedback.isAcceptable ? (
                  <Trophy className="h-7 w-7 text-green-600 dark:text-green-400" />
                ) : (
                  <Target className="h-7 w-7 text-orange-600 dark:text-orange-400" />
                )}
              </div>
              <span className={feedback.isAcceptable ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}>
                {feedback.isAcceptable
                  ? 'Great Job!'
                  : isCoachedAdvance
                    ? 'Coached advance'
                    : 'Keep Practicing'}
              </span>
            </DialogTitle>
            <DialogDescription className="sr-only">Feedback for your answer</DialogDescription>
          </DialogHeader>

          <div id="feedback-content" className="p-6 space-y-5">
            {userAnswer?.trim() ? (
              <Card className="border-2 border-sky-500/30 bg-sky-500/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sky-700 dark:text-sky-300 text-lg">
                    Your submission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm leading-relaxed whitespace-pre-wrap font-mono bg-background/60 border border-border/60 rounded-lg p-3 text-foreground">
                    {userAnswer.trim()}
                  </pre>
                </CardContent>
              </Card>
            ) : null}

            {tip && isCoachedAdvance && (
              <Card className="border-2 border-amber-500/30 bg-amber-500/5 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-lg">
                    <Lightbulb className="h-5 w-5" />
                    Coach tip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-foreground">{tip}</p>
                </CardContent>
              </Card>
            )}

            {/* XP Rewards Card - Enhanced */}
            {xpEarned > 0 && (
              <Card className={`glass border-2 border-amber-500/30 shadow-2xl bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent animate-slide-up overflow-hidden relative`}>
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 animate-shimmer bg-[length:200%_100%]" />
                <CardHeader className="pb-3 relative z-10">
                  <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xl">
                    <Sparkles className="h-6 w-6 animate-pulse" />
                    Step Rewards
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center border-4 border-amber-300 dark:border-amber-500 shadow-lg animate-float">
                        <Zap className="h-10 w-10 text-white" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="text-4xl font-bold bg-gradient-to-r from-amber-600 to-yellow-600 dark:from-amber-400 dark:to-yellow-400 bg-clip-text text-transparent">
                        +{xpEarned} XP
                      </div>
                      <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Keep up the momentum!
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Performance Score Card - Enhanced */}
            <Card className={`glass border-2 ${scoreColors.border} shadow-xl bg-gradient-to-br ${scoreColors.gradient} relative overflow-hidden ${isCoachedAdvance ? 'opacity-80' : ''}`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Award className={`h-6 w-6 ${scoreColors.primary}`} />
                  <span className={scoreColors.primary}>
                    {isCoachedAdvance ? 'Score (for reference)' : 'Performance Score'}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    {/* Score Circle Background */}
                    <div className={`absolute inset-0 rounded-full ${scoreColors.bg} blur-2xl opacity-50`} style={{ transform: 'scale(1.5)' }} />
                    <div className="relative">
                      <div className={`${isCoachedAdvance ? 'text-5xl' : 'text-8xl'} font-extrabold ${scoreColors.primary} transition-all duration-300`}>
                        {animatedScore}
                      </div>
                      <div className="text-sm text-muted-foreground mt-2 font-medium">out of 10</div>
                    </div>
                  </div>
                </div>

                {/* Accuracy Section */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Accuracy
                    </span>
                    <span className="font-bold text-lg">{animatedAccuracy}%</span>
                  </div>
                  <div className="relative w-full bg-muted/40 rounded-full h-4 overflow-hidden shadow-inner">
                    <div
                      ref={accuracyBarRef}
                      className={`h-full ${accuracyColor} rounded-full transition-all duration-1500 ease-out relative overflow-hidden`}
                      style={{
                        width: `${feedback.accuracy}%`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer bg-[length:200%_100%]" />
                    </div>
                  </div>
                  {/* Accuracy Label */}
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Needs Work</span>
                    <span>Excellent</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Strengths Section - Enhanced */}
            {feedback.strengths.length > 0 && (
              <Card className="glass border-2 border-green-500/30 shadow-lg animate-fade-in bg-gradient-to-br from-green-500/5 to-transparent" style={{ animationDelay: '200ms' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-400 text-lg">
                    <div className="p-1.5 rounded-lg bg-green-500/20 shrink-0">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                     <span className="flex-1 leading-tight">Strengths</span>
                    <span className="ml-auto text-xs font-normal text-muted-foreground shrink-0">
                      {feedback.strengths.length} {feedback.strengths.length === 1 ? 'point' : 'points'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feedback.strengths.map((s, i) => (
                      <li key={i} className="flex gap-3 text-sm group">
                        <div className="mt-0.5 shrink-0">
                          <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                            <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                          </div>
                        </div>
                        <span className="flex-1 leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Improvements Section - Enhanced */}
            {feedback.weaknesses.length > 0 && (
              <Card className="glass border-2 border-yellow-500/30 shadow-lg animate-fade-in bg-gradient-to-br from-yellow-500/5 to-transparent" style={{ animationDelay: '300ms' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400 text-lg">
                    <div className="p-1.5 rounded-lg bg-yellow-500/20 shrink-0">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                     <span className="flex-1 leading-tight">Areas for Improvement</span>
                    <span className="ml-auto text-xs font-normal text-muted-foreground shrink-0">
                      {feedback.weaknesses.length} {feedback.weaknesses.length === 1 ? 'point' : 'points'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feedback.weaknesses.map((w, i) => (
                      <li key={i} className="flex gap-3 text-sm group">
                        <div className="mt-0.5 shrink-0">
                          <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center group-hover:bg-yellow-500/30 transition-colors">
                            <AlertCircle className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                          </div>
                        </div>
                        <span className="flex-1 leading-relaxed">{w}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Missed Points Section - Enhanced */}
            {feedback.missed && feedback.missed.length > 0 && (
              <Card className="glass border-2 border-blue-500/30 shadow-lg animate-fade-in bg-gradient-to-br from-blue-500/5 to-transparent" style={{ animationDelay: '400ms' }}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-lg">
                    <div className="p-1.5 rounded-lg bg-blue-500/20 shrink-0">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                     <span className="flex-1 leading-tight">Key Points to Remember</span>
                    <span className="ml-auto text-xs font-normal text-muted-foreground shrink-0">
                      {feedback.missed.length} {feedback.missed.length === 1 ? 'point' : 'points'}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {feedback.missed.map((m, i) => (
                      <li key={i} className="flex gap-3 text-sm group">
                        <div className="mt-0.5 shrink-0">
                          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                            <Lightbulb className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                          </div>
                        </div>
                        <span className="flex-1 leading-relaxed">{m}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Footer Actions - Enhanced */}
          <div className={`flex flex-col-reverse sm:flex-row ${FEATURES.feedbackPdfExport ? 'justify-between' : 'justify-end'} items-center gap-4 px-6 py-4 border-t border-border/50 bg-muted/20`}>
            {FEATURES.feedbackPdfExport && (
              <Button 
                variant="outline" 
                onClick={exportToPDF} 
                className="w-full sm:w-auto hover:bg-muted transition-all hover:scale-105"
              >
                Export PDF
              </Button>
            )}
            {feedback.isAcceptable &&
              (probeEntitled ? (
                <Button variant="outline" onClick={onStartProbe}>
                  Defend your design
                </Button>
              ) : (
                <LockedFeatureButton
                  feature="aiProbe"
                  label="Defend your design"
                  tooltip="Available on the AI plan — an AI skeptic challenges your design like a real interviewer"
                />
              ))}
            <Button
              onClick={handleContinue}
              className={`w-full sm:w-auto gradient-bg hover:opacity-90 transition-all shadow-sm ${
                allowAdvance
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {allowAdvance
                ? (feedback.isAcceptable ? 'Continue to Next Step' : 'Continue with coach tip')
                : 'Try Again'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}