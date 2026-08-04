'use client';

import { useEffect, useState } from 'react';
import {
  formatLaunchOfferCountdown,
  getLaunchOfferCountdown,
  type LaunchOfferCountdown,
} from '@/lib/launch-offer';

interface LaunchOfferCountdownProps {
  className?: string;
  prefix?: string;
}

export function LaunchOfferCountdown({ className, prefix = 'Ends in' }: LaunchOfferCountdownProps) {
  // Defer first paint until mount so SSR HTML does not disagree with the
  // ticking client clock by a second (React hydration mismatch).
  const [countdown, setCountdown] = useState<LaunchOfferCountdown | null>(null);

  useEffect(() => {
    const tick = () => setCountdown(getLaunchOfferCountdown());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!countdown || countdown.ended) return null;

  return (
    <span className={className}>
      {prefix} {formatLaunchOfferCountdown(countdown)}
    </span>
  );
}
