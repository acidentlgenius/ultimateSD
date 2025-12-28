'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function updateProfile(formData: FormData) {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }

    const name = formData.get('name');
    const username = formData.get('username');
    const bio = formData.get('bio');
    const isPublicString = formData.get('isPublic');

    console.log('[updateProfile] Received:', { name, username, bio, isPublicString });

    if (typeof name !== 'string' || name.trim().length === 0) {
        return { error: 'Name is required' };
    }

    if (name.length > 50) {
        return { error: 'Name is too long' };
    }

    let validUsername: string | null = null;
    if (typeof username === 'string' && username.trim().length > 0) {
        const u = username.trim();
        if (u.length < 3 || u.length > 20) {
            return { error: 'Username must be between 3 and 20 characters' };
        }
        if (!/^[a-zA-Z0-9_-]+$/.test(u)) {
            return { error: 'Username can only contain letters, numbers, underscores, and dashes' };
        }
        validUsername = u;
    }

    const validBio = typeof bio === 'string' ? bio.trim() : null;
    const isPublic = isPublicString === 'true';

    const data = {
        name: name.trim(),
        username: validUsername,
        bio: validBio,
        isPublic: isPublic,
    };

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: {
                name: data.name,
                username: data.username,
                bio: data.bio,
                isPublic: data.isPublic,
            } as any,
        });

        revalidatePath('/settings');
        return { success: true };
    } catch (error: any) {
        console.error('Failed to update profile:', error);
        if (error.code === 'P2002') {
            return { error: 'Username is already taken' };
        }
        return { error: 'Failed to update profile' };
    }
}

// Removed upgradeToPro - premium features are now free for all users

export async function deleteAccount() {
    const session = await auth();
    if (!session?.user?.id) {
        throw new Error('Not authenticated');
    }

    try {
        // Delete the user. Cascading deletes should handle related data if relations are configured correctly,
        // otherwise we might need to manually delete related records first depending on schema.
        // Assuming standard Prisma NextAuth schema where cascade delete is common.
        await prisma.user.delete({
            where: { id: session.user.id },
        });
    } catch (error) {
        console.error('Failed to delete account:', error);
        return { error: 'Failed to delete account' };
    }

    // Use redirect outside of try/catch as it throws an error in Next.js
    redirect('/');
}


