import Link from 'next/link';
import { Home, BookOpen, Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 transition-all duration-300">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gradient-to-tr from-primary/80 to-purple-600/80 text-white shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-primary/40 group-hover:scale-105 group-hover:rotate-3">
            <BookOpen className="h-5 w-5 absolute inset-0 m-auto transition-transform duration-500 group-hover:rotate-12" />
            <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg leading-tight tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:to-primary transition-all duration-300">
              Ultimate SD
            </span>
            <span className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground group-hover:text-primary/80 transition-colors">
              AI System Design
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
              "hover:bg-primary/10 hover:text-primary",
              "text-muted-foreground"
            )}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          {/* Placeholder for future links like "Practice", "Resources" etc. */}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center px-3 py-1 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary shadow-sm">
            <Sparkles className="h-3 w-3 mr-1.5 animate-pulse" />
            <span className="hidden lg:inline">AI Powered Practice</span>
            <span className="lg:hidden">AI Beta</span>
          </div>
          <div className="h-6 w-px bg-border/50 mx-1" />
          <ThemeToggle />
          <UserMenu user={session?.user} />
        </div>
      </div>
    </header>
  );
}