import { prisma } from '@/lib/prisma';

/** "DRAFT" | "PUBLISHED" */
export type BlogPostStatus = string;

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: BlogPostStatus;
  isPremium: boolean;
  readingTime: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

export type BlogPostDetail = BlogPostSummary & {
  content: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
  authorName: string | null;
  createdAt: Date;
};

const summarySelect = {
  id: true,
  slug: true,
  title: true,
  excerpt: true,
  coverImage: true,
  status: true,
  isPremium: true,
  readingTime: true,
  publishedAt: true,
  updatedAt: true,
} as const;

const detailSelect = {
  ...summarySelect,
  content: true,
  seoTitle: true,
  seoDescription: true,
  authorId: true,
  createdAt: true,
  author: { select: { name: true } },
} as const;

type SummaryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  status: string;
  isPremium: boolean;
  readingTime: number | null;
  publishedAt: Date | null;
  updatedAt: Date;
};

type DetailRow = SummaryRow & {
  content: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  authorId: string;
  createdAt: Date;
  author: { name: string | null } | null;
};

function toSummary(row: SummaryRow): BlogPostSummary {
  return { ...row, status: row.status as BlogPostStatus };
}

function toDetail(row: DetailRow): BlogPostDetail {
  const { author, ...rest } = row;
  return { ...toSummary(rest), ...rest, authorName: author?.name ?? null };
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

type TiptapNode = { text?: string; content?: TiptapNode[] };

function extractText(node: TiptapNode): string {
  const own = node.text ?? '';
  const children = node.content?.map(extractText).join(' ') ?? '';
  return `${own} ${children}`;
}

export function estimateReadingTime(content: unknown): number {
  if (!content || typeof content !== 'object') return 1;
  const text = extractText(content as TiptapNode);
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount === 0) return 1;
  return Math.max(1, Math.round(wordCount / 200));
}

export async function getPublishedBlogPosts(searchQuery?: string): Promise<BlogPostSummary[]> {
  const trimmed = searchQuery?.trim();
  let rows: any[] = [];
  try {
    rows = await prisma.blogPost.findMany({
    where: {
      status: 'PUBLISHED',
      ...(trimmed
        ? {
            OR: [
              { title: { contains: trimmed, mode: 'insensitive' as const } },
              { excerpt: { contains: trimmed, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    },
    orderBy: { publishedAt: 'desc' },
    select: summarySelect,
  });
  } catch (error) {
    console.error('Failed to fetch blog posts:', error);
    return [];
  }
  return rows.map(toSummary);
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  const row = await prisma.blogPost.findUnique({ where: { slug }, select: detailSelect });
  return row ? toDetail(row) : null;
}

export async function getBlogPostById(id: string): Promise<BlogPostDetail | null> {
  const row = await prisma.blogPost.findUnique({ where: { id }, select: detailSelect });
  return row ? toDetail(row) : null;
}

export async function getAllBlogPostsForAdmin(): Promise<BlogPostSummary[]> {
  const rows = await prisma.blogPost.findMany({
    orderBy: { updatedAt: 'desc' },
    select: summarySelect,
  });
  return rows.map(toSummary);
}
