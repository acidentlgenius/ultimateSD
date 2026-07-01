"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { ArticleSection } from "@/lib/blog";

interface SectionProps {
  section: ArticleSection;
  children: React.ReactNode;
}

export function Section({ section, children }: SectionProps) {
  const [isExpanded, setIsExpanded] = useState(
    section.defaultExpanded !== undefined ? section.defaultExpanded : true
  );

  const isCollapsible = section.collapsible !== false;

  return (
    <section id={section.id} className="scroll-mt-24 mb-16">
      <div
        className={cn(
          "flex items-center justify-between border-b pb-4 mb-6",
          isCollapsible && "cursor-pointer group hover:opacity-80 transition-opacity"
        )}
        onClick={() => {
          if (isCollapsible) setIsExpanded(!isExpanded);
        }}
      >
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
          {section.title}
        </h2>
        {isCollapsible && (
          <div className="text-muted-foreground p-1 rounded-full group-hover:bg-muted transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-6 w-6" />
            ) : (
              <ChevronDown className="h-6 w-6" />
            )}
          </div>
        )}
      </div>

      <div
        className={cn(
          "transition-all duration-300 ease-in-out origin-top",
          isExpanded ? "opacity-100 max-h-none block" : "opacity-0 max-h-0 hidden overflow-hidden"
        )}
      >
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          {children}
        </div>
      </div>
    </section>
  );
}
