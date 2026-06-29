'use client';

import { type KeyboardEvent, type MouseEvent } from 'react';
import { getProblemTags, TAG_CATEGORY_STYLES, type ProblemTag } from '@/lib/problem-tags';
import { cn } from '@/lib/utils';

interface ProblemTagBadgeProps {
  tag: ProblemTag;
  className?: string;
  onClick?: () => void;
}

const badgeClassName =
  'inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-colors';

export function ProblemTagBadge({ tag, className, onClick }: ProblemTagBadgeProps) {
  const sharedClassName = cn(
    badgeClassName,
    TAG_CATEGORY_STYLES[tag.category],
    onClick && 'hover:opacity-80 cursor-pointer',
    className
  );

  if (!onClick) {
    return (
      <span title={tag.label} className={sharedClassName}>
        {tag.label}
      </span>
    );
  }

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClick();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
  };

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={tag.label}
      className={sharedClassName}
    >
      {tag.label}
    </span>
  );
}

interface ProblemTagListProps {
  slug: string;
  legacyTags?: string[];
  limit?: number;
  className?: string;
  onTagClick?: (tagId: string) => void;
}

export function ProblemTagList({
  slug,
  legacyTags,
  limit,
  className,
  onTagClick,
}: ProblemTagListProps) {
  const tags = getProblemTags(slug, legacyTags);
  const visible = limit ? tags.slice(0, limit) : tags;
  const hiddenCount = limit && tags.length > limit ? tags.length - limit : 0;

  if (visible.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {visible.map((tag) => (
        <ProblemTagBadge
          key={tag.id}
          tag={tag}
          onClick={onTagClick ? () => onTagClick(tag.id) : undefined}
        />
      ))}
      {hiddenCount > 0 && (
        <span className="text-[10px] font-medium text-muted-foreground self-center">
          +{hiddenCount}
        </span>
      )}
    </div>
  );
}
