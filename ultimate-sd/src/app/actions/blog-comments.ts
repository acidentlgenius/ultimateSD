'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import type { BlogCommentItem } from '@/lib/blog-comments';

export async function addComment(
  blogPostId: string,
  content: string
): Promise<{ success: true; comment: BlogCommentItem } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const trimmed = content.trim();
  if (!trimmed) {
    return { error: 'Comment cannot be empty' };
  }

  const created = await prisma.blogComment.create({
    data: { blogPostId, authorId: session.user.id, content: trimmed },
    select: {
      id: true,
      content: true,
      authorId: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
      blogPost: { select: { slug: true } },
    },
  });

  revalidatePath(`/blog/${created.blogPost.slug}`);

  return {
    success: true,
    comment: {
      id: created.id,
      content: created.content,
      authorId: created.authorId,
      authorName: created.author?.name ?? null,
      authorImage: created.author?.image ?? null,
      createdAt: created.createdAt,
    },
  };
}

export async function deleteComment(commentId: string): Promise<{ success: true } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const comment = await prisma.blogComment.findUnique({
    where: { id: commentId },
    select: { authorId: true, blogPost: { select: { slug: true } } },
  });
  if (!comment) {
    return { error: 'Comment not found' };
  }

  let isAdmin = false;
  if (comment.authorId !== session.user.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });
    isAdmin = user?.role === 'ADMIN';
  }

  if (comment.authorId !== session.user.id && !isAdmin) {
    return { error: 'Not authorized' };
  }

  await prisma.blogComment.delete({ where: { id: commentId } });
  revalidatePath(`/blog/${comment.blogPost.slug}`);
  return { success: true };
}
