import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock } from 'lucide-react';
import { getPublishedBlogPosts } from '@/lib/blog-posts';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { Badge } from '@/components/ui/badge';
import { BlogSearchInput } from '@/components/blog/BlogSearchInput';

const PAGE_TITLE = 'Blog';
const PAGE_DESCRIPTION =
  'Concept explainers and system design interview walkthroughs, written by the Ultimate SD team.';

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: `${SITE_URL}/blog` },
  openGraph: {
    type: 'website',
    url: `${SITE_URL}/blog`,
    siteName: SITE_NAME,
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const posts = await getPublishedBlogPosts(q);

  return (
    <div className="container mx-auto max-w-5xl px-4 py-12 md:py-20">
      <header className="mb-10 max-w-2xl">
        <h1 className="mb-4 text-4xl font-extrabold tracking-tight md:text-5xl">Blog</h1>
        <p className="mb-6 text-lg leading-relaxed text-muted-foreground">{PAGE_DESCRIPTION}</p>
        <BlogSearchInput />
      </header>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts found.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col rounded-xl border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              {post.isPremium && (
                <Badge className="mb-3 w-fit border-0 bg-primary/10 text-primary">Premium</Badge>
              )}
              <h2 className="mb-2 text-xl font-bold tracking-tight transition-colors group-hover:text-primary">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mb-6 line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {post.excerpt}
                </p>
              )}
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {post.readingTime ?? 1} min read
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
