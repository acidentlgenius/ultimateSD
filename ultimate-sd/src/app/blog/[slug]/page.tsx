import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Clock } from 'lucide-react';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { getBlogPostBySlug } from '@/lib/blog-posts';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { BlogContentRenderer } from '@/components/blog/BlogContentRenderer';
import { CommentSection } from '@/components/blog/CommentSection';

async function isCurrentUserAdmin(): Promise<boolean> {
  const session = await auth();
  if (!session?.user?.id) return false;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { role: true } });
  return user?.role === 'ADMIN';
}

async function loadVisiblePost(slug: string) {
  const post = await getBlogPostBySlug(slug);
  if (!post) return null;
  if (post.status !== 'PUBLISHED' && !(await isCurrentUserAdmin())) return null;
  return post;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadVisiblePost(slug);
  if (!post) return { title: 'Post Not Found' };

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || '';
  const url = `${SITE_URL}/blog/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title,
      description,
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      images: post.coverImage ? [post.coverImage] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await loadVisiblePost(slug);
  if (!post) notFound();

  const url = `${SITE_URL}/blog/${slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: { '@type': 'Person', name: post.authorName ?? SITE_NAME },
    publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/blog"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        All posts
      </Link>

      {post.status !== 'PUBLISHED' && (
        <div className="mb-8 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-4 py-2 text-sm text-amber-700 dark:text-amber-400">
          <span>This post is a draft. Only admins can see this preview.</span>
          <Link href={`/admin/blog/${post.id}/edit`} className="font-medium underline hover:no-underline">
            Back to editor
          </Link>
        </div>
      )}

      <article>
        <header className="mb-10 border-b pb-8">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">{post.title}</h1>
          {post.excerpt && (
            <p className="mb-4 text-xl leading-relaxed text-muted-foreground">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {post.readingTime ?? 1} min read
            {post.authorName && <span>· By {post.authorName}</span>}
          </div>
        </header>

        <BlogContentRenderer content={post.content} />
      </article>

      <CommentSection blogPostId={post.id} />
    </div>
  );
}
