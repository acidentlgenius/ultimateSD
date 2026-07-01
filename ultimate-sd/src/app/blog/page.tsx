import Link from "next/link";
import { Search, Clock, BookOpen, Star, ArrowRight } from "lucide-react";
import { getAllArticles } from "@/content/blog";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Interactive Learning & Blog | Ultimate System Design",
  description: "Learn system design through interactive articles and interview questions.",
};

export default function BlogLandingPage() {
  const articles = getAllArticles();

  // Sort or filter if needed in the future
  const featuredArticle = articles.find(a => a.metadata.featured) || articles[0];
  const otherArticles = articles.filter(a => a.metadata.id !== featuredArticle?.metadata.id);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-12 md:py-20">
      <div className="flex flex-col items-center text-center mb-16 space-y-4">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Interactive <span className="text-primary">Learning</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Master system design concepts through hands-on, interactive guides.
          No more boring walls of text.
        </p>

        <div className="w-full max-w-md mt-8 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search topics, questions, architectures..."
            className="pl-10 h-12 rounded-full bg-muted/50 border-muted"
            disabled // UI only for now
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {["System Design", "Backend", "Databases", "Caching", "Load Balancing"].map(tag => (
            <Badge key={tag} variant="secondary" className="hover:bg-primary/20 cursor-pointer rounded-full px-3 py-1">
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Featured Article */}
      {featuredArticle && (
        <div className="mb-20">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
            Featured
          </h2>
          <Link href={`/blog/${featuredArticle.metadata.slug}`}>
            <Card className="group overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md cursor-pointer">
              <div className="grid md:grid-cols-5 gap-6">
                <div className="md:col-span-2 bg-gradient-to-br from-primary/10 to-primary/5 p-8 flex items-center justify-center border-r">
                   <div className="w-full aspect-video bg-card rounded-lg shadow-sm border flex items-center justify-center flex-col gap-3 relative overflow-hidden">
                     {/* Decorative background */}
                     <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 dark:opacity-10"></div>
                     <BookOpen className="h-16 w-16 text-primary/80 relative z-10" />
                     <span className="font-mono text-sm text-muted-foreground relative z-10">System Architecture</span>
                   </div>
                </div>
                <div className="md:col-span-3 p-6 md:p-8 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-0">
                      {featuredArticle.metadata.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-4 w-4" /> {featuredArticle.metadata.readingTime}
                    </span>
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-4 group-hover:text-primary transition-colors">
                    {featuredArticle.metadata.title}
                  </h3>
                  <p className="text-muted-foreground text-lg mb-6 line-clamp-2">
                    {featuredArticle.metadata.description}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex gap-2">
                      {featuredArticle.metadata.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      )}

      {/* More Articles Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Latest Articles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {otherArticles.length > 0 ? (
            otherArticles.map(article => (
              <Link key={article.metadata.id} href={`/blog/${article.metadata.slug}`}>
                <Card className="h-full flex flex-col hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary">{article.metadata.difficulty}</Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {article.metadata.readingTime}
                      </span>
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors line-clamp-2">
                      {article.metadata.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {article.metadata.description}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="mt-auto pt-4 flex justify-between items-center border-t">
                    <span className="text-xs text-muted-foreground">{article.metadata.date}</span>
                    <span className="text-sm font-medium text-primary flex items-center">
                      Read <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))
          ) : (
             <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
               <p>More articles coming soon...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
