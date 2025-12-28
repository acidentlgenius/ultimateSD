import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import SettingsClient from './SettingsClient';
import { prisma } from '@/lib/prisma';

export default async function SettingsPage() {
    const session = await auth();

    if (!session?.user?.id) {
        redirect('/login?callbackUrl=/settings');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id }
    });

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="container mx-auto py-10 px-4 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your account settings and preferences.
                </p>
            </div>

            <SettingsClient user={user} />
        </div>
    );
}
