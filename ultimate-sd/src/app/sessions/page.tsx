import { Metadata } from 'next';
import { SITE_NAME } from '@/lib/site';
import { SessionDashboard } from '@/components/SessionDashboard';

const PAGE_TITLE = 'Your Saved Practice Sessions';

export const metadata: Metadata = {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: 'View and manage all your saved offline practice sessions.',
};

export default function SessionsPage() {
    return (
        <div className="min-h-screen bg-background">
            <header className="container mx-auto max-w-7xl px-4 pt-12 text-center md:pt-20">
                <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-6xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Saved Sessions
                </h1>
                <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                    View and manage your in-progress local practice sessions.
                </p>
            </header>
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <SessionDashboard />
            </div>
        </div>
    );
}
