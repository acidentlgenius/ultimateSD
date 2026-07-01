import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, ArrowRight, Home, RotateCcw, Layout } from 'lucide-react';
import Link from 'next/link';
import { SystemDesignProblem } from '@/types';
import { FEATURES } from '@/lib/features';

interface CompletionUIProps {
  problem: SystemDesignProblem;
  onReview: () => void;
  onReset?: () => void;
}

export default function CompletionUI({ problem, onReview, onReset }: CompletionUIProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-yellow-500/20 blur-3xl rounded-full scale-150" />
        <div className="relative bg-gradient-to-br from-yellow-400 to-amber-600 p-4 rounded-2xl shadow-xl shadow-amber-500/20">
          <Trophy className="h-16 w-16 text-white" />
        </div>
      </div>

      <h2 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
        Problem Completed!
      </h2>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        Excellent work! You've successfully completed the system design for <strong>{problem.title}</strong>.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        <Card className="glass border-green-500/20 bg-green-500/5">
          <CardContent className="p-6 flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-green-500/10 rounded-full text-green-600 dark:text-green-400">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-green-700 dark:text-green-300">XP Earned</h3>
            <p className="text-sm text-green-600/80 dark:text-green-400/80">
              Your points have been added to your profile. Keep up the streak!
            </p>
          </CardContent>
        </Card>

        <Card className="glass border-primary/20 bg-primary/5">
          <CardContent className="p-6 flex flex-col items-center text-center gap-2">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Layout className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-primary">System Diagram</h3>
            <p className="text-sm text-primary/80">
              Your final architecture diagram has been saved.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button
          onClick={onReview}
          className="flex-1 gap-2"
          size="lg"
        >
          <ArrowRight className="h-4 w-4" />
          Review Steps
        </Button>
        <Button
          asChild
          variant="outline"
          size="lg"
          className="flex-1 gap-2"
        >
          <Link href="/">
            <Home className="h-4 w-4" />
            Return Home
          </Link>
        </Button>
      </div>

      {onReset && (
        <div className="mt-8 pt-8 border-t border-border/50 w-full max-w-md text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground hover:text-destructive"
          >
            <RotateCcw className="h-3 w-3 mr-2" />
            Reset Progress & Start Over
          </Button>
        </div>
      )}
    </div>
  );
}
