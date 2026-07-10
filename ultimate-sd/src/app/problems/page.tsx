import type { Metadata } from 'next';
import { auth } from '@/auth';
import { getUserProgressMap } from '@/app/actions/progress';
import { canAccessFeature } from '@/lib/feature-flags-server';
import { PROBLEMS } from '@/lib/problems';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { ProblemWithStatus } from '@/types';
import { ProblemExplorer } from '@/components/ProblemExplorer';

const PAGE_TITLE = 'System Design Practice Problems';
const PAGE_DESCRIPTION = `Browse ${PROBLEMS.length}+ system design interview problems — from TinyURL to WhatsApp to distributed caches. Filter by difficulty, topic, and company, then practice step by step with an AI interviewer.`;

export const metadata: Metadata = {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    alternates: { canonical: `${SITE_URL}/problems` },
    openGraph: {
        type: 'website',
        url: `${SITE_URL}/problems`,
        siteName: SITE_NAME,
        title: PAGE_TITLE,
        description: PAGE_DESCRIPTION,
    },
};

export default async function ProblemsPage() {
    const session = await auth();

    const designForgeEnabled = session?.user?.id
        ? await canAccessFeature(session.user.id, 'designForge')
        : false;

    let problemsWithStatus: ProblemWithStatus[] = PROBLEMS;
    if (session?.user?.id) {
        const progressMap = await getUserProgressMap();
        problemsWithStatus = PROBLEMS.map((p) => ({
            ...p,
            ...(progressMap.get(p.id) ?? {}),
        }));
    }

    return (
        <div className="min-h-screen bg-background">
            <header className="container mx-auto max-w-7xl px-4 pt-12 text-center md:pt-20">
                <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    System Design Problems
                </h1>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                    {PROBLEMS.length}+ real interview problems. Filter by difficulty, topic, or
                    company — then design, get AI feedback, and track your progress.
                </p>
            </header>
            <ProblemExplorer
                user={session?.user}
                problems={problemsWithStatus}
                showHeading={false}
                designForgeEnabled={designForgeEnabled}
            />
        </div>
    );
}
