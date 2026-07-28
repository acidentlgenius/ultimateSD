'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createBlogPost } from '@/app/actions/blog';

export function NewBlogPostForm() {
  const [title, setTitle] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    startTransition(async () => {
      try {
        const { id } = await createBlogPost(title.trim());
        router.push(`/admin/blog/${id}/edit`);
      } catch {
        toast.error('Failed to create draft');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <Button type="submit" disabled={isPending || !title.trim()}>
        {isPending ? 'Creating…' : 'Create draft'}
      </Button>
    </form>
  );
}
