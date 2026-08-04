import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NewBlogPostForm } from './NewBlogPostForm';

export default async function NewBlogPostPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  if (user?.role !== 'ADMIN') redirect('/');

  return (
    <div className="container mx-auto max-w-xl px-4 py-10 md:px-0">
      <h1 className="mb-6 text-3xl font-bold">New blog post</h1>
      <NewBlogPostForm />
    </div>
  );
}
