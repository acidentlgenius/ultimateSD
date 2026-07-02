import { Suspense } from 'react';
import { getUserProgressMap } from '@/app/actions/progress';
import { progressMapToSlugStatuses } from '@/lib/roadmap-progress';
import { RoadmapClient } from './RoadmapClient';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/auth';
import { canAccessFeature } from '@/lib/feature-flags-server';

function RoadmapFallback() {
  return (
    <div className="min-h-screen bg-background relative">
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
      </div>
      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="mb-12 md:mb-16">
          <Link href="/">
            <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Button>
          </Link>
          <div className="text-center max-w-2xl mx-auto animate-pulse">
            <div className="h-6 w-48 bg-muted rounded-full mx-auto mb-4" />
            <div className="h-12 w-full bg-muted rounded-lg mb-6" />
            <div className="h-5 w-3/4 bg-muted rounded mx-auto mb-8" />
            <div className="h-12 w-96 max-w-full bg-muted rounded-2xl mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function RoadmapPage() {
  const session = await auth();
  const [progressMap, fresherTrackEnabled] = await Promise.all([
    getUserProgressMap(),
    canAccessFeature(session?.user?.id ?? null, 'fresherTrack'),
  ]);
  const progressBySlug = progressMapToSlugStatuses(progressMap);

  return (
    <Suspense fallback={<RoadmapFallback />}>
      <RoadmapClient
        progressBySlug={progressBySlug}
        fresherTrackEnabled={fresherTrackEnabled}
      />
    </Suspense>
  );
}
