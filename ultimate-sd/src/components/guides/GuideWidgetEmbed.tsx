"use client";

import { Sparkles } from 'lucide-react';
import { WIDGETS } from '@/components/widgets/registry';

interface GuideWidgetEmbedProps {
  widgetId: string;
  title: string;
  caption?: string;
}

export default function GuideWidgetEmbed({ widgetId, title, caption }: GuideWidgetEmbedProps) {
  const Widget = WIDGETS[widgetId];
  if (!Widget) return null;

  return (
    <figure className="not-prose my-10 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-semibold">{title}</span>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Interactive — try it
        </span>
      </div>
      <div className="p-4">
        <Widget />
      </div>
      {caption && (
        <figcaption className="border-t px-4 py-3 text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
