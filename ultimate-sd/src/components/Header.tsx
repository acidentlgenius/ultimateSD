import Image from 'next/image';
import Link from 'next/link';
import { Sparkles } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';

import { auth } from "@/auth";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { MobileMenu } from "@/components/MobileMenu";
import { NAV_ITEMS, isNavGroup } from '@/lib/navigation';
import { NavDropdown } from '@/components/NavDropdown';
import { WhatsNewNotifier } from '@/components/WhatsNewNotifier';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/5 dark:border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/40 transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <div className="container mx-auto px-4 h-16 grid grid-cols-[1fr_auto_1fr] items-center relative z-10">
        <Link href="/" className="flex items-center gap-3 group justify-self-start min-w-0">
          <div className="relative w-10 h-10 shrink-0 overflow-hidden rounded-xl shadow-lg shadow-primary/25 ring-1 ring-black/10 transition-all duration-300 group-hover:scale-105 group-hover:shadow-primary/40 dark:ring-white/10">
            <Image
              src="/icon.png"
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
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
        <nav className="hidden lg:flex items-center gap-1 justify-self-center bg-secondary/30 p-1 rounded-full border border-black/5 dark:border-white/5 backdrop-blur-md shadow-sm shrink-0">
          {NAV_ITEMS.map((item) =>
            isNavGroup(item) ? (
              <NavDropdown key={item.label} group={item} />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300",
                  "hover:bg-background/80 hover:text-primary hover:shadow-sm",
                  "text-muted-foreground"
                )}
              >
                <item.icon className={cn("h-4 w-4", item.label === 'Pricing' && "h-3.5 w-3.5 text-amber-500")} />
                <span>{item.label}</span>
              </Link>
            )
          )}
        </nav>

        <div className="flex items-center gap-3 justify-self-end min-w-0">
          <div className="hidden xl:flex items-center whitespace-nowrap px-4 py-1.5 rounded-full bg-gradient-to-r from-primary/10 to-purple-500/10 border border-primary/20 text-xs font-semibold text-primary shadow-glow-sm">
            <Sparkles className="h-3.5 w-3.5 mr-2 animate-pulse text-purple-500" />
            <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">AI Powered Practice</span>
          </div>

          <div className="h-6 w-px bg-border/40 mx-1" />
          <WhatsNewNotifier />
          <ThemeToggle />
          <UserMenu user={session?.user} />
          <MobileMenu user={session?.user} />
        </div>
      </div>
    </header>
  );
}
