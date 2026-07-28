import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getBlogPostById } from '@/lib/blog-posts';
import { BlogPostForm } from './BlogPostForm';

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== 'ADMIN') redirect('/');

  const post = await getBlogPostById(id);
  if (!post) notFound();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 md:px-0">
      <BlogPostForm post={post} />
    </div>
  );
}
