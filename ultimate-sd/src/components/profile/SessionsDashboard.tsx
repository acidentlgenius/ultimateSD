'use client';

import { useEffect, useState } from 'react';
import { getAllSessions, clearSessionState } from '@/lib/session-storage';
import { getProblemBySlug } from '@/lib/problems';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Trash2, Clock, PlayCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SessionDisplay {
  problemSlug: string;
  problemTitle: string;
  lastUpdated: Date;
  stepCount: number;
}

export function SessionsDashboard() {
  const [sessions, setSessions] = useState<SessionDisplay[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    loadSessions();
  }, []);

  const loadSessions = () => {
    const rawSessions = getAllSessions();
    const displaySessions = rawSessions.map(session => {
      const problem = getProblemBySlug(session.problemSlug);
      return {
        ...session,
        problemTitle: problem ? problem.title : 'Unknown Problem',
      };
    });
    setSessions(displaySessions);
  };

  const handleClear = (slug: string) => {
    if (confirm('Are you sure you want to delete this saved session? This cannot be undone.')) {
      clearSessionState(slug);
      loadSessions();
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <Card className="glass-card">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-secondary p-3">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-xl font-semibold">No active sessions</h3>
          <p className="mb-6 max-w-sm text-muted-foreground">
            You don't have any saved practice sessions on this device right now.
          </p>
          <Button asChild>
            <Link href="/problems">
              Browse Problems <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {sessions.map((session) => (
        <Card key={session.problemSlug} className="glass-card flex flex-col transition-all hover:border-primary/50">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <Badge variant="outline" className="mb-2">
                Draft
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleClear(session.problemSlug)}
                title="Delete session"
                aria-label="Delete session"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <CardTitle className="line-clamp-2 text-lg">
              {session.problemTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-4">
            <div className="flex flex-col gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  Last updated {formatDistanceToNow(new Date(session.lastUpdated), { addSuffix: true })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <PlayCircle className="h-4 w-4" />
                <span>{session.stepCount} steps saved</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full" variant="secondary">
              <Link href={`/practice/${session.problemSlug}`}>
                Resume Practice
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
