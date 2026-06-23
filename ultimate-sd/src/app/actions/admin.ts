'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { type PlanType } from '@/lib/plans';

async function requireAdmin() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { role: true }
    });

    if (user?.role !== 'ADMIN') {
        throw new Error('Not authorized');
    }

    return session.user.id;
}

export async function updateUserPlan(userId: string, planType: PlanType) {
    await requireAdmin();

    const planExpiresAt = planType !== 'free'
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        : null;

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                planType,
                planExpiresAt,
                planActivatedAt: planType !== 'free' ? new Date() : null,
                aiCredits: planType === 'ai' ? 500 : 0
            }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Failed to update user plan:', error);
        return { error: 'Failed to update user plan' };
    }
}

export async function revokeUserAccess(userId: string) {
    await requireAdmin();

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                planType: 'free',
                planExpiresAt: null,
                planActivatedAt: null,
                aiCredits: 0
            }
        });

        revalidatePath('/admin');
        return { success: true };
    } catch (error) {
        console.error('Failed to revoke access:', error);
        return { error: 'Failed to revoke access' };
    }
}
