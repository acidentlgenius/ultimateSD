'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { Menu, X, BookOpen, LogIn, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { User } from 'next-auth';
import { flattenNavLinks } from '@/lib/navigation';

interface MobileMenuProps {
  user?: User;
}

export function MobileMenu({ user }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Close menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuItems = flattenNavLinks();

  return (
    <div className="lg:hidden ml-2">
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleMenu}
        aria-label="Toggle menu"
        title="Toggle menu"
        className="relative z-50"
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Portal to body: the header's backdrop-filter makes it the containing
          block for fixed descendants, which would confine the drawer to the
          header box. */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={toggleMenu}
                data-testid="mobile-menu-backdrop"
                className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
              />

            {/* Menu Content */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-3/4 max-w-[300px] bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl"
            >
              <div className="flex flex-col h-full pt-20 px-6 pb-6">
                <div className="flex flex-col space-y-2">
                  {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center gap-4 px-4 py-3 rounded-xl text-lg font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary/10 text-primary"
                            : "hover:bg-muted text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {!user && (
                  <div className="mt-8 pt-8 border-t border-border flex flex-col gap-4">
                    <Button asChild variant="outline" className="w-full justify-start h-12 text-base font-medium">
                      <Link href="/login" className="w-full">
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild className="w-full justify-start h-12 text-base font-medium bg-gradient-to-r from-primary to-purple-600">
                      <Link href="/signup" className="w-full">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Get Started
                      </Link>
                    </Button>
                  </div>
                )}

                <div className="mt-auto border-t border-border pt-6">
                   <div className="flex items-center gap-2 px-4 text-sm font-medium text-muted-foreground">
                      <BookOpen className="h-4 w-4" />
                      <span>Ultimate SD</span>
                   </div>
                   <p className="px-4 mt-2 text-xs text-muted-foreground/60">
                     Master System Design
                   </p>
                </div>
              </div>
            </motion.div>
          </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
