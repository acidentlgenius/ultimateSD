"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { ArticleSection } from "@/lib/blog";

export function TableOfContents({ sections }: { sections: ArticleSection[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -80% 0px" } // Adjust as needed to trigger earlier/later
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Small offset for fixed header if you have one
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: offsetTop, behavior: "smooth" });
    }
  };

  if (sections.length === 0) return null;

  return (
    <nav className="sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto w-full text-sm">
      <h4 className="font-semibold mb-4 text-foreground/90 uppercase tracking-wider text-xs">On this page</h4>
      <ul className="space-y-2 border-l border-border/50">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => handleClick(e, section.id)}
              className={cn(
                "block py-1 pl-4 -ml-px border-l-2 transition-all hover:text-foreground",
                activeId === section.id
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground"
              )}
            >
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
