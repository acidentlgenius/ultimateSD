import { notFound } from "next/navigation";
import { Clock, ArrowLeft, ArrowUp } from "lucide-react";
import Link from "next/link";
import { getArticleBySlug, getAllArticles } from "@/content/blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { ProgressBar } from "@/components/blog/ProgressBar";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { Section } from "@/components/blog/Section";
import { Callout } from "@/components/blog/Callout";
import { CodeBlock } from "@/components/blog/CodeBlock";
import { QuizCard } from "@/components/blog/QuizCard";
import { TradeoffCard } from "@/components/blog/TradeoffCard";
import { ComparisonTable } from "@/components/blog/ComparisonTable";
import { ArchitectureDiagram } from "@/components/blog/ArchitectureDiagram";
import { InterviewNote } from "@/components/blog/InterviewNote";
import { ArticleBlock } from "@/lib/blog";

export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.metadata.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: "Article Not Found" };

  return {
    title: `${article.metadata.title} | Ultimate System Design`,
    description: article.metadata.description,
  };
}

function renderBlock(block: ArticleBlock) {
  switch (block.type) {
    case "markdown":
      return (
        <div
          key={block.id}
          className="my-4 whitespace-pre-wrap font-medium"
          dangerouslySetInnerHTML={{ __html: block.content }}
        />
      );
    case "callout":
      return <Callout key={block.id} block={block} />;
    case "code":
      return <CodeBlock key={block.id} block={block} />;
    case "quiz":
      return <QuizCard key={block.id} block={block} />;
    case "tradeoff":
      return <TradeoffCard key={block.id} block={block} />;
    case "comparison":
      return <ComparisonTable key={block.id} block={block} />;
    case "diagram":
      return <ArchitectureDiagram key={block.id} block={block} />;
    case "interviewNote":
      return <InterviewNote key={block.id} block={block} />;
    case "custom":
      return <div key={block.id}>{block.component}</div>;
    default:
      return null;
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const { metadata, sections } = article;

  return (
    <>
      <ProgressBar />
      <div className="container mx-auto max-w-7xl px-4 py-8">

        {/* Breadcrumb / Back button */}
        <Link href="/blog" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all articles
        </Link>

        <div className="flex flex-col lg:flex-row gap-12">

          {/* Main Content Area */}
          <article className="flex-1 max-w-4xl min-w-0">
            <header className="mb-12 pb-8 border-b">
              <div className="flex items-center gap-3 mb-6 flex-wrap">
                <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                  {metadata.difficulty}
                </Badge>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {metadata.readingTime}
                </div>
                <div className="text-sm text-muted-foreground ml-auto hidden sm:block">
                  Last updated: {metadata.date}
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                {metadata.title}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {metadata.description}
              </p>

              <div className="flex gap-2 mt-8 flex-wrap">
                {metadata.tags.map(tag => (
                  <Badge key={tag} variant="outline">{tag}</Badge>
                ))}
              </div>
            </header>

            <div className="space-y-16">
              {sections.map((section) => (
                <Section key={section.id} section={section}>
                  {section.blocks.map(renderBlock)}
                </Section>
              ))}
            </div>

            {/* Footer / Next steps */}
            <div className="mt-16 pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
               <p className="text-muted-foreground">
                 Finished reading? Try building it!
               </p>
               <Button asChild>
                 <Link href="/practice">Go to Practice</Link>
               </Button>
            </div>
          </article>

          {/* Right Sidebar (TOC) */}
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="sticky top-24">
              <TableOfContents sections={sections} />

              <div className="mt-12 pt-8 border-t border-border/50">
                 <Link href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors">
                   <ArrowUp className="mr-2 h-4 w-4" />
                   Back to top
                 </Link>
              </div>
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
