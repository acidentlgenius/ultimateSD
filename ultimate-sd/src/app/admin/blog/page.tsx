import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getAllBlogPostsForAdmin } from '@/lib/blog-posts';
import { Button } from '@/components/ui/button';
import { BlogAdminList } from './BlogAdminList';

export default async function AdminBlogPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== 'ADMIN') redirect('/');

  const posts = await getAllBlogPostsForAdmin();

  return (
    <div className="container mx-auto px-4 py-10 md:px-0">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Blog posts</h1>
        <Button asChild>
          <Link href="/admin/blog/new">New post</Link>
        </Button>
      </div>
      <BlogAdminList posts={posts} />
    </div>
  );
}
