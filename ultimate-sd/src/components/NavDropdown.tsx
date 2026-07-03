'use client';

import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { NavGroup } from '@/lib/navigation';

export function NavDropdown({ group }: { group: NavGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 outline-none',
          'hover:bg-background/80 hover:text-primary hover:shadow-sm',
          'text-muted-foreground data-[state=open]:bg-background/80 data-[state=open]:text-primary'
        )}
      >
        <group.icon className="h-4 w-4" />
        <span>{group.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" sideOffset={8}>
        {group.links.map((link) => (
          <DropdownMenuItem key={link.href} asChild>
            <Link href={link.href} className="flex items-center gap-2 cursor-pointer">
              <link.icon className="h-4 w-4 text-muted-foreground" />
              <span>{link.label}</span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
