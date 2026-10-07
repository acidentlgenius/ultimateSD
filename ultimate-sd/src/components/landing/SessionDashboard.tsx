'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, BookOpen, ChevronRight, Trash2 } from 'lucide-react';
import { getAllSessions, clearSessionState } from '@/lib/session-storage';
import { formatDistanceToNow } from 'date-fns';

interface SessionInfo {
  problemSlug: string;
  lastUpdated: Date;
  stepCount: number;
}

export function SessionDashboard() {
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [mounted, setMounted] = useState(false);

  const loadSessions = () => {
    setSessions(getAllSessions());
  };

  useEffect(() => {
    setMounted(true);
    loadSessions();

    // Listen for storage changes in other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith('sd-practice-')) {
        loadSessions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleClear = (slug: string, e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (confirm('Are you sure you want to clear this saved session? This cannot be undone.')) {
      clearSessionState(slug);
      loadSessions();
    }
  };

  if (!mounted) return null;

  if (sessions.length === 0) {
    return (
      <Card className="bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 mt-8">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
          <BookOpen className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No saved offline sessions yet</p>
          <p className="text-sm mt-2">Start practicing a problem to automatically save your progress locally.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <h3 className="text-lg font-bold uppercase tracking-[0.2em] text-foreground flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Recent Offline Sessions
        </h3>
        <Badge variant="secondary" className="ml-2 font-mono">{sessions.length}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sessions.map((session) => (
          <Link
            key={session.problemSlug}
            href={`/problems/${session.problemSlug}`}
            className="group block"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-md hover:border-primary/30 bg-card group-hover:-translate-y-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg capitalize flex justify-between items-start">
                  <span className="truncate pr-4">{session.problemSlug.replace(/-/g, ' ')}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-2 -mr-2"
                    onClick={(e) => handleClear(session.problemSlug, e)}
                    title="Clear session"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
                <CardDescription>
                  {formatDistanceToNow(session.lastUpdated, { addSuffix: true })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mt-2">
                  <div className="text-sm font-medium">
                    <span className="text-primary font-bold">{session.stepCount}</span> steps completed
                  </div>
                  <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-medium">
                    Continue <ChevronRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
