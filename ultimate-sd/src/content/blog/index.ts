import { tinyUrlArticle } from "./tinyurl";
import { Article } from "@/lib/blog";

export const articles: Record<string, Article> = {
  [tinyUrlArticle.metadata.slug]: tinyUrlArticle,
};

export const getAllArticles = () => Object.values(articles);

export const getArticleBySlug = (slug: string) => articles[slug];
