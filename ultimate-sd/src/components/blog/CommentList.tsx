'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { deleteComment } from '@/app/actions/blog-comments';
import type { BlogCommentItem } from '@/lib/blog-comments';

interface CommentListProps {
  comments: BlogCommentItem[];
  currentUserId: string | null;
  isAdmin: boolean;
}

export function CommentList({ comments, currentUserId, isAdmin }: CommentListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (commentId: string) => {
    if (!window.confirm('Delete this comment?')) return;
    startTransition(async () => {
      await deleteComment(commentId);
      router.refresh();
    });
  };

  if (comments.length === 0) {
    return <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment.</p>;
  }

  return (
    <ul className="space-y-6">
      {comments.map((comment) => {
        const canDelete = isAdmin || comment.authorId === currentUserId;
        return (
          <li key={comment.id} className="border-b pb-6 last:border-0">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{comment.authorName ?? 'Anonymous'}</p>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                </span>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(comment.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{comment.content}</p>
          </li>
        );
      })}
    </ul>
  );
}
