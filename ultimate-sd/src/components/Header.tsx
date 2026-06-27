import Link from 'next/link';
import { Home, BookOpen, Sparkles, Map } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/MobileMenu";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4 relative z-10">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-purple-600 text-white shadow-lg shadow-primary/25 transition-all duration-300 group-hover:shadow-primary/40 group-hover:scale-105 group-hover:rotate-3 ring-1 ring-black/10 dark:ring-white/10">
            <BookOpen className="h-5 w-5 absolute inset-0 m-auto transition-transform duration-500 group-hover:rotate-12" />
            <div className="absolute inset-0 rounded-xl bg-black/10 dark:bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-xl leading-tight tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent group-hover:from-primary group-hover:to-purple-600 transition-all duration-300">
              Ultimate SD
            </span>
            <span className="text-xs uppercase tracking-[0.2em] font-bold text-muted-foreground/80 group-hover:text-primary/70 transition-colors">
              AI System Design
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex flex-1 justify-center">
        <nav className="flex items-center gap-1 bg-secondary/30 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm">
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
              "hover:bg-background/80 hover:text-primary hover:shadow-sm",
              "text-muted-foreground"
            )}
          >
            <Home className="h-4 w-4" />
            <span>Home</span>
          </Link>
          <Link
            href="/roadmap"
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
              "hover:bg-background/80 hover:text-primary hover:shadow-sm",
              "text-muted-foreground"
            )}
          >
            <Map className="h-4 w-4" />
            <span>Roadmap</span>
          </Link>
          <Link
            href="/pricing"
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
              "hover:bg-background/80 hover:text-primary hover:shadow-sm",
              "text-muted-foreground"
            )}
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Pricing</span>
          </Link>
        </nav>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-xs font-semibold text-primary shadow-glow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2 animate-pulse text-purple-500" />
            <span className="hidden lg:inline bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AI Powered Practice</span>
            <span className="lg:hidden text-primary">AI Beta</span>
          </div>

          <div className="h-6 w-px bg-border/40 mx-1" />
          <ThemeToggle />
          <UserMenu user={session?.user} />
          <MobileMenu user={session?.user} />
        </div>
      </div>
    </header >
  );
}