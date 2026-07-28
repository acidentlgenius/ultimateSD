'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { addComment } from '@/app/actions/blog-comments';

export function CommentForm({ blogPostId }: { blogPostId: string }) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addComment(blogPostId, trimmed);
      if ('error' in result) {
        toast.error(result.error);
        return;
      }
      setContent('');
      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share your thoughts..."
        rows={3}
      />
      <Button type="submit" disabled={isPending || !content.trim()}>
        {isPending ? 'Posting…' : 'Post comment'}
      </Button>
    </form>
  );
}
