'use client';

/**
 * ConditionalHeader — hides the Header on routes that don't need it.
 *
 * Pattern: Header is a Server Component (async, calls auth()). We can't
 * use usePathname() there. Instead this thin Client Component wrapper
 * receives the pre-rendered <Header /> as `children` and conditionally
 * renders it based on the current pathname.
 */

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const HIDDEN_ON = [
  /^\/practice\/.+/, // question practice pages
];

export function ConditionalHeader({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hidden = HIDDEN_ON.some((pattern) => pattern.test(pathname));
  if (hidden) return null;
  return <>{children}</>;
}
