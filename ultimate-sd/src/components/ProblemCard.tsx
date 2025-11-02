'use client';

import Link from 'next/link';
import { SystemDesignProblem } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { tokens } from '@/styles/tokens';
import { ArrowRight, Building2, TrendingUp } from 'lucide-react';

interface ProblemCardProps {
  problem: SystemDesignProblem;
}

export default function ProblemCard({ problem }: ProblemCardProps) {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return tokens.colors.difficulty.easy;
      case 'Medium': return tokens.colors.difficulty.medium;
      case 'Hard': return tokens.colors.difficulty.hard;
      default: return tokens.colors.info;
    }
  };

  return (
    <Link 
      href={`/practice/${problem.slug}`} 
      aria-label={`Practice ${problem.title}`} 
      className="block group"
    >
      <Card className="h-full p-6 card-hover border-2 border-border hover:border-primary/50 bg-card/50 backdrop-blur-sm transition-all duration-300 relative overflow-hidden">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="relative z-10">
          <CardHeader className="pb-3 px-0">
            <div className="flex items-start justify-between gap-3">
              <CardTitle className="text-lg leading-tight text-card-foreground group-hover:text-primary transition-colors flex-1">
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
          
          <CardContent className="pt-0 px-0">
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {problem.description}
            </p>
            
            {/* Companies section */}
            {problem.companies.length > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                  {problem.companies.slice(0, 3).map(c => (
                    <Badge key={c} variant="outline" className="text-xs bg-background/50">
                      {c}
                    </Badge>
                  ))}
                  {problem.companies.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-background/50">
                      +{problem.companies.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Footer with category and CTA */}
            <div className="flex items-center justify-between pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="font-medium">{problem.category}</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
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