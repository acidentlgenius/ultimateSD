'use client';

import Link from 'next/link';
import { ProblemWithStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { tokens } from '@/styles/tokens';
import { ArrowRight, Building2, TrendingUp, CheckCircle, Clock, RotateCcw, Lock } from 'lucide-react';

interface ProblemCardProps {
  problem: ProblemWithStatus;
  featured?: boolean;
  locked?: boolean;
  index?: number;
  badge?: string;
}

export default function ProblemCard({ problem, featured, locked, index, badge }: ProblemCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return tokens.colors.difficulty.easy;
      case 'Medium': return tokens.colors.difficulty.medium;
      case 'Hard': return tokens.colors.difficulty.hard;
      default: return tokens.colors.info;
    }
  };

  const statusInfo = {
    'COMPLETED': { icon: CheckCircle, color: 'text-green-500', text: 'Completed' },
    'REVIEW_NEEDED': { icon: RotateCcw, color: 'text-amber-500', text: 'Review Due' },
    'IN_PROGRESS': { icon: Clock, color: 'text-blue-500', text: 'In Progress' },
    'NOT_STARTED': null
  };

  const status = problem.status && statusInfo[problem.status] ? statusInfo[problem.status] : null;
  const StatusIcon = status?.icon;

  return (
    <Link
      href={`/practice/${problem.slug}`}
      aria-label={`Practice ${problem.title}`}
      className="block group h-full"
    >
      <Card className={`h-full p-6 card-hover border-2 bg-card/50 backdrop-blur-sm transition-all duration-300 relative overflow-hidden flex flex-col ${featured ? 'border-primary/20 shadow-primary/5' : 'border-border hover:border-primary/50'}`}>
        {/* Decorative gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${featured ? 'from-primary/10' : 'from-primary/5'} via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative z-10 flex flex-col h-full">
          <CardHeader className="pb-3 px-0 pt-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                {(badge) && (
                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors">
                    {badge}
                  </Badge>
                )}
                {status && (
                  <Badge variant="outline" className={`gap-1 pr-2 ${status.color ? status.color.replace('text-', 'border-').replace('500', '200') + ' bg-' + status.color.replace('text-', '').replace('500', '50') : ''}`}>
                    {StatusIcon && <StatusIcon className={`h-3 w-3 ${status.color}`} />}
                    <span className={`text-[10px] ${status.color}`}>{status.text}</span>
                  </Badge>
                )}
              </div>
              {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
            </div>

            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors flex-1 line-clamp-2">
                {problem.title}
              </CardTitle>
              <Badge
                variant="secondary"
                style={{ backgroundColor: getDifficultyColor(problem.difficulty), color: 'white' }}
                className="text-xs font-semibold shrink-0 shadow-sm"
              >
                {problem.difficulty}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-0 px-0 flex-1 flex flex-col">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed flex-1">
              {problem.description}
            </p>

            {/* Companies section */}
            {problem.companies.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {Array.from(new Set(problem.companies)).slice(0, 3).map(c => (
                    <Badge key={c} variant="outline" className="text-xs bg-background/50">
                      {c}
                    </Badge>
                  ))}
                  {Array.from(new Set(problem.companies)).length > 3 && (
                    <Badge variant="outline" className="text-xs bg-background/50">
                      +{Array.from(new Set(problem.companies)).length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Progress Bar */}
            {(problem.progress && problem.progress > 0 && problem.status !== 'COMPLETED') && (
              <div className="mb-4 space-y-1">
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>Progress</span>
                  <span>{Math.round(problem.progress)}%</span>
                </div>
                <Progress value={problem.progress} className="h-1.5" />
              </div>
            )}

            {/* Footer with category and CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-medium">{problem.category}</span>
              </div>
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 shadow-sm ${featured ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'}`}>
                <span>Practice</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}