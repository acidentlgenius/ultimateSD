'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Lightbulb, TrendingUp, Award, Trophy, Sparkles, Zap, Target } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { updateStreak } from '@/app/actions/gamification';

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
  xpEarned?: number;
}

// Confetti component for celebrations
function Confetti({ show }: { show: boolean }) {
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: 50 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
            backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#a855f7'][Math.floor(Math.random() * 5)],
            width: '8px',
            height: '8px',
            borderRadius: '50%',
          }}
        />
      ))}
    </div>
  );
}

export default function FeedbackModal({ feedback, isOpen, onClose, onContinue, xpEarned = 0 }: FeedbackModalProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const accuracyBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (feedback.isAcceptable) {
        // If passed, update streak!
        updateStreak().catch(console.error);
        // Show confetti for successful evaluations
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      // Animate score counting up
      let startTime: number;
      const duration = 1500;
      const startScore = 0;
      const endScore = feedback.score;

      const animateScore = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setAnimatedScore(Math.floor(startScore + (endScore - startScore) * easeOutQuart));

        if (progress < 1) {
          requestAnimationFrame(animateScore);
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
          requestAnimationFrame(animateAccuracy);
        }
      };

      requestAnimationFrame(animateScore);
      setTimeout(() => requestAnimationFrame(animateAccuracy), 200);
    } else {
      setAnimatedScore(0);
      setAnimatedAccuracy(0);
      setShowConfetti(false);
    }
  }, [isOpen, feedback]);

  const handleContinue = () => {
    if (feedback.isAcceptable && onContinue) {
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
      <Confetti show={showConfetti} />
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
                {feedback.isAcceptable ? 'Great Job!' : 'Keep Practicing'}
              </span>
            </DialogTitle>
          </DialogHeader>

          <div id="feedback-content" className="p-6 space-y-5">
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
            <Card className={`glass border-2 ${scoreColors.border} shadow-xl bg-gradient-to-br ${scoreColors.gradient} relative overflow-hidden`}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Award className={`h-6 w-6 ${scoreColors.primary}`} />
                  <span className={scoreColors.primary}>Performance Score</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-8">
                  <div className="relative inline-block">
                    {/* Score Circle Background */}
                    <div className={`absolute inset-0 rounded-full ${scoreColors.bg} blur-2xl opacity-50`} style={{ transform: 'scale(1.5)' }} />
                    <div className="relative">
                      <div className={`text-8xl font-extrabold ${scoreColors.primary} transition-all duration-300`} style={{ 
                        textShadow: `0 0 20px ${scoreColors.primary.replace('text-', 'rgba(')}`
                      }}>
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
                    <div className="p-1.5 rounded-lg bg-green-500/20">
                      <CheckCircle className="h-5 w-5" />
                    </div>
                    Strengths
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
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
                    <div className="p-1.5 rounded-lg bg-yellow-500/20">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    Areas for Improvement
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
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
                    <div className="p-1.5 rounded-lg bg-blue-500/20">
                      <Lightbulb className="h-5 w-5" />
                    </div>
                    Key Points to Remember
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
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
          <div className="flex justify-between items-center gap-4 px-6 py-4 border-t border-border/50 bg-muted/20">
            <Button 
              variant="outline" 
              onClick={exportToPDF} 
              className="hover:bg-muted transition-all hover:scale-105"
            >
              Export PDF
            </Button>
            <Button 
              onClick={handleContinue} 
              className={`gradient-bg hover:opacity-90 transition-all hover:scale-105 shadow-lg ${
                feedback.isAcceptable 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
                  : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700'
              }`}
            >
              {feedback.isAcceptable ? 'Continue to Next Step' : 'Try Again'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}