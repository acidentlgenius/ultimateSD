'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, ArrowRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { WHATS_NEW_ENTRIES, WHATS_NEW_LAST_SEEN_KEY, getLatestEntry } from '@/lib/whats-new';

function readLastSeen(): string | null {
  try {
    return window.localStorage.getItem(WHATS_NEW_LAST_SEEN_KEY);
  } catch {
    return null;
  }
}

export function WhatsNewNotifier() {
  const [hasUnread, setHasUnread] = useState(false);
  const latest = getLatestEntry();

  useEffect(() => {
    if (latest && readLastSeen() !== latest.id) {
      setHasUnread(true);
    }
  }, [latest]);

  const markSeen = () => {
    if (!latest) return;
    try {
      window.localStorage.setItem(WHATS_NEW_LAST_SEEN_KEY, latest.id);
    } catch {
      // localStorage unavailable — dot just reappears next visit
    }
    setHasUnread(false);
  };

  if (!latest) return null;

  return (
    <DropdownMenu onOpenChange={(open) => open && markSeen()}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="What's new" title="What's new" className="relative">
          <Bell className="h-5 w-5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-80">
        <DropdownMenuLabel>What&apos;s New</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WHATS_NEW_ENTRIES.slice(0, 3).map((entry) => (
          <DropdownMenuItem key={entry.id} asChild>
            <Link href="/whats-new" className="flex flex-col items-start gap-0.5 cursor-pointer py-2">
              <span className="text-sm font-medium">{entry.title}</span>
              <span className="text-xs text-muted-foreground line-clamp-2">{entry.description}</span>
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/whats-new" className="flex items-center gap-1 cursor-pointer text-sm font-semibold text-primary">
            See all updates <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
