'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, ExternalLink, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getAllSessions, clearSessionState, formatStorageSize, getStorageInfo } from '@/lib/session-storage';
import { getProblemBySlug } from '@/lib/problems';

export function SessionDashboard() {
  const [sessions, setSessions] = useState<ReturnType<typeof getAllSessions>>([]);
  const [storageInfo, setStorageInfo] = useState<ReturnType<typeof getStorageInfo> | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    loadData();
    setIsMounted(true);
  }, []);

  const loadData = () => {
    setSessions(getAllSessions());
    setStorageInfo(getStorageInfo());
  };

  const handleClearSession = (slug: string) => {
    if (confirm('Are you sure you want to delete this saved session? This cannot be undone.')) {
      clearSessionState(slug);
      loadData();
    setIsMounted(true);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-pulse h-8 w-8 rounded-full bg-primary/20"></div>
      </div>
    );
  }

  if (!storageInfo?.available) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <HardDrive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Local Storage Unavailable</h3>
          <p className="text-muted-foreground">
            Your browser does not support local storage or it is disabled.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Local Storage Usage</CardTitle>
            <CardDescription>Drafts saved only on this device</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{formatStorageSize(storageInfo.used)}</div>
            <div className="text-sm text-muted-foreground">{storageInfo.sessionCount} sessions</div>
          </div>
        </CardHeader>
      </Card>

      {sessions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">No Saved Sessions</h3>
            <p className="text-muted-foreground mb-6">
              Start practicing a problem to automatically save your progress here.
            </p>
            <Link href="/problems">
              <Button>Browse Problems</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sessions.map((session) => {
            const problem = getProblemBySlug(session.problemSlug);
            const title = problem ? problem.title : session.problemSlug;

            return (
              <Card key={session.problemSlug} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg line-clamp-1">{title}</CardTitle>
                  <CardDescription>
                    {formatDistanceToNow(session.lastUpdated, { addSuffix: true })}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="text-sm">
                    <span className="font-semibold">{session.stepCount}</span> completed steps
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleClearSession(session.problemSlug)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Link href={`/practice/${session.problemSlug}`}>
                    <Button size="sm">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Resume
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
