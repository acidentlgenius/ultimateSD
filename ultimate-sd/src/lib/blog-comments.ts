import { prisma } from '@/lib/prisma';

export type BlogCommentItem = {
  id: string;
  content: string;
  authorId: string;
  authorName: string | null;
  authorImage: string | null;
  createdAt: Date;
};

export async function getCommentsForPost(blogPostId: string): Promise<BlogCommentItem[]> {
  const rows = await prisma.blogComment.findMany({
    where: { blogPostId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      content: true,
      authorId: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    content: row.content,
    authorId: row.authorId,
    authorName: row.author?.name ?? null,
    authorImage: row.author?.image ?? null,
    createdAt: row.createdAt,
  }));
}
