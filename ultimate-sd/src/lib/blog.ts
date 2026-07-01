import { ReactNode } from "react";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface ArticleMetadata {
  id: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
  readingTime: string;
  difficulty: Difficulty;
  tags: string[];
  coverImage?: string;
  featured?: boolean;
}

export type BlockType =
  | "markdown"
  | "code"
  | "callout"
  | "quiz"
  | "tradeoff"
  | "comparison"
  | "diagram"
  | "interviewNote"
  | "custom";

export interface BaseBlock {
  id: string;
  type: BlockType;
}

export interface MarkdownBlock extends BaseBlock {
  type: "markdown";
  content: string; // Markdown or raw HTML/text
}

export interface CodeBlock extends BaseBlock {
  type: "code";
  code: string;
  language: string;
  filename?: string;
  highlightLines?: number[];
}

export interface CalloutBlock extends BaseBlock {
  type: "callout";
  variant: "info" | "warning" | "tip" | "danger" | "success";
  title?: string;
  content: string;
}

export interface QuizBlock extends BaseBlock {
  type: "quiz";
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface TradeoffBlock extends BaseBlock {
  type: "tradeoff";
  title: string;
  pros: string[];
  cons: string[];
}

export interface ComparisonBlock extends BaseBlock {
  type: "comparison";
  title?: string;
  headers: string[];
  rows: string[][];
}

export interface DiagramBlock extends BaseBlock {
  type: "diagram";
  title?: string;
  diagramId: string; // Maps to a specific diagram or uses a placeholder
  description?: string;
}

export interface InterviewNoteBlock extends BaseBlock {
  type: "interviewNote";
  title?: string;
  content: string;
}

export interface CustomBlock extends BaseBlock {
  type: "custom";
  component: ReactNode; // For entirely custom React components injected directly
}

export type ArticleBlock =
  | MarkdownBlock
  | CodeBlock
  | CalloutBlock
  | QuizBlock
  | TradeoffBlock
  | ComparisonBlock
  | DiagramBlock
  | InterviewNoteBlock
  | CustomBlock;

export interface ArticleSection {
  id: string;
  title: string;
  blocks: ArticleBlock[];
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export interface Article {
  metadata: ArticleMetadata;
  sections: ArticleSection[];
}
