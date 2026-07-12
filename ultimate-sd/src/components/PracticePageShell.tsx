'use client';

import { useEffect } from 'react';

/** Hides the global site header while on /practice/* routes. */
export function PracticePageShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.body.dataset.practicePage = 'true';
    return () => {
      delete document.body.dataset.practicePage;
    };
  }, []);

  return children;
}
