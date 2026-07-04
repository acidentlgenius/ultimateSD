import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Building2, Clock } from 'lucide-react';
import { getAllGuides, getGuideBySlug } from '@/content/guides';
import { PROBLEMS } from '@/lib/problems';
import { SITE_NAME, SITE_URL } from '@/lib/site';
import { markdownToHtml } from '@/lib/markdown';
import type { GuideBlock } from '@/lib/guides';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Callout } from '@/components/blog/Callout';
import { CodeBlock } from '@/components/blog/CodeBlock';
import { QuizCard } from '@/components/blog/QuizCard';
import { TradeoffCard } from '@/components/blog/TradeoffCard';
import { ComparisonTable } from '@/components/blog/ComparisonTable';
import { ArchitectureDiagram } from '@/components/blog/ArchitectureDiagram';
import { InterviewNote } from '@/components/blog/InterviewNote';
import GuideWidgetEmbed from '@/components/guides/GuideWidgetEmbed';

export async function generateStaticParams() {
  return getAllGuides().map((guide) => ({ slug: guide.metadata.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return { title: 'Guide Not Found' };

  const { seoTitle, description, keywords, publishedAt, updatedAt } = guide.metadata;
  const url = `${SITE_URL}/guides/${slug}`;

  return {
    title: seoTitle,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      siteName: SITE_NAME,
      title: seoTitle,
      description,
      publishedTime: publishedAt,
      modifiedTime: updatedAt,
    },
    twitter: {
      card: 'summary_large_image',
      title: seoTitle,
      description,
    },
  };
}

function renderBlock(block: GuideBlock) {
  switch (block.type) {
    case 'markdown':
      return (
        <div key={block.id} dangerouslySetInnerHTML={{ __html: markdownToHtml(block.content) }} />
      );
    case 'callout':
      return <Callout key={block.id} block={block} />;
    case 'code':
      return <CodeBlock key={block.id} block={block} />;
    case 'quiz':
      return <QuizCard key={block.id} block={block} />;
    case 'tradeoff':
      return <TradeoffCard key={block.id} block={block} />;
    case 'comparison':
      return <ComparisonTable key={block.id} block={block} />;
    case 'diagram':
      return <ArchitectureDiagram key={block.id} block={block} />;
    case 'interviewNote':
      return <InterviewNote key={block.id} block={block} />;
    case 'widget':
      return (
        <GuideWidgetEmbed
          key={block.id}
          widgetId={block.widgetId}
          title={block.title}
          caption={block.caption}
        />
      );
    case 'custom':
      return <div key={block.id}>{block.component}</div>;
    default:
      return null;
  }
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const { metadata, sections, faq } = guide;
  const problem = PROBLEMS.find((p) => p.slug === metadata.problemSlug);
  const url = `${SITE_URL}/guides/${metadata.slug}`;
  const relatedGuides = getAllGuides().filter((g) => g.metadata.slug !== metadata.slug);

  const jsonLd: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: metadata.title,
      description: metadata.description,
      datePublished: metadata.publishedAt,
      dateModified: metadata.updatedAt,
      author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      keywords: metadata.keywords.join(', '),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_URL}/guides` },
        { '@type': 'ListItem', position: 3, name: metadata.title, item: url },
      ],
    },
  ];
  if (faq.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    });
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Link
        href="/guides"
        className="mb-8 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        All guides
      </Link>

      <div className="flex flex-col gap-12 lg:flex-row">
        <article className="min-w-0 max-w-4xl flex-1">
          <header className="mb-12 border-b pb-8">
            <div className="mb-6 flex flex-wrap items-center gap-3">
              {problem && (
                <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/20">
                  {problem.difficulty}
                </Badge>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {metadata.readingTime}
              </div>
              <div className="ml-auto hidden text-sm text-muted-foreground sm:block">
                Updated {metadata.updatedAt}
              </div>
            </div>
            <h1 className="mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">
              {metadata.title}
            </h1>
            <p className="text-xl leading-relaxed text-muted-foreground">{metadata.description}</p>
            {problem && problem.companies.length > 0 && (
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4" />
                Commonly asked at {problem.companies.join(', ')}
              </div>
            )}
          </header>

          <div>
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="mb-16 scroll-mt-24">
                <h2 className="mb-6 border-b pb-4 text-2xl font-bold tracking-tight md:text-3xl">
                  {section.title}
                </h2>
                <div className="prose prose-zinc max-w-none dark:prose-invert">
                  {section.blocks.map(renderBlock)}
                </div>
              </section>
            ))}

            {faq.length > 0 && (
              <section id="faq" className="mb-16 scroll-mt-24">
                <h2 className="mb-6 border-b pb-4 text-2xl font-bold tracking-tight md:text-3xl">
                  Frequently asked questions
                </h2>
                <div className="space-y-6">
                  {faq.map((item) => (
                    <div key={item.question}>
                      <h3 className="mb-2 text-lg font-semibold">{item.question}</h3>
                      <p className="leading-relaxed text-muted-foreground">{item.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">Reading only gets you halfway</h2>
            <p className="mx-auto mb-6 max-w-xl text-muted-foreground">
              Practice {metadata.title.replace(/^Design /, 'designing ')} step by step with an AI
              interviewer that evaluates your answers — free, no credit card.
            </p>
            <Button asChild size="lg">
              <Link href={`/practice/${metadata.problemSlug}`}>
                Practice this problem free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </article>

        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-24">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <ul className="space-y-2 border-l pl-4 text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
              {faq.length > 0 && (
                <li>
                  <a href="#faq" className="text-muted-foreground transition-colors hover:text-primary">
                    FAQ
                  </a>
                </li>
              )}
            </ul>

            {relatedGuides.length > 0 && (
              <div className="mt-10 border-t pt-6">
                <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  More guides
                </p>
                <ul className="space-y-3 text-sm">
                  {relatedGuides.map((g) => (
                    <li key={g.metadata.slug}>
                      <Link
                        href={`/guides/${g.metadata.slug}`}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        {g.metadata.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
