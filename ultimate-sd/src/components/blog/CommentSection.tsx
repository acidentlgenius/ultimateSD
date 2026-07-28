import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getCommentsForPost } from '@/lib/blog-comments';
import { CommentList } from './CommentList';
import { CommentForm } from './CommentForm';

export async function CommentSection({ blogPostId }: { blogPostId: string }) {
  const [session, comments] = await Promise.all([auth(), getCommentsForPost(blogPostId)]);

  let isAdmin = false;
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
    isAdmin = user?.role === 'ADMIN';
  }

  return (
    <section className="mt-16 border-t pt-10">
      <h2 className="mb-6 text-2xl font-bold tracking-tight">Comments ({comments.length})</h2>
      {session?.user?.id ? (
        <CommentForm blogPostId={blogPostId} />
      ) : (
        <p className="mb-6 text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>{' '}
          to leave a comment.
        </p>
      )}
      <CommentList comments={comments} currentUserId={session?.user?.id ?? null} isAdmin={isAdmin} />
    </section>
  );
}
