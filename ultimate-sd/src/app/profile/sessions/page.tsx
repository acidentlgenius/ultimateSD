import { Metadata } from 'next';
import { SessionsDashboard } from '@/components/profile/SessionsDashboard';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Offline Sessions | System Design AI',
  description: 'View your saved offline practice sessions.',
};

export default async function SessionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login?callbackUrl=/profile/sessions');
  }

  return (
    <div className="container max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-glow mb-2">
          Offline Sessions
        </h1>
        <p className="text-muted-foreground">
          View and resume practice sessions saved locally on this device. These are drafts you haven't fully submitted.
        </p>
      </div>

      <SessionsDashboard />
    </div>
  );
}
