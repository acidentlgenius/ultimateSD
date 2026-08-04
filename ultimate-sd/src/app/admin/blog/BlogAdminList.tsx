'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { deleteBlogPost } from '@/app/actions/blog';
import type { BlogPostSummary } from '@/lib/blog-posts';

export function BlogAdminList({ posts }: { posts: BlogPostSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this post permanently?')) return;
    setPendingId(id);
    startTransition(async () => {
      await deleteBlogPost(id);
      router.refresh();
    });
  };

  if (posts.length === 0) {
    return <p className="text-muted-foreground">No blog posts yet.</p>;
  }

  return (
    <div className="divide-y rounded-lg border">
      {posts.map((post) => (
        <div key={post.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={post.status === 'PUBLISHED' ? 'default' : 'outline'}>{post.status}</Badge>
              {post.isPremium && <Badge variant="outline">Premium</Badge>}
            </div>
            <p className="truncate font-medium">{post.title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/admin/blog/${post.id}/edit`}>Edit</Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isPending && pendingId === post.id}
              onClick={() => handleDelete(post.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
