import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { FeatureKey } from '@/lib/plans';

interface LockedFeatureButtonProps {
  feature: FeatureKey;
  label: string;
  tooltip: string;
  className?: string;
}

export function LockedFeatureButton({
  feature,
  label,
  tooltip,
  className,
}: LockedFeatureButtonProps) {
  return (
    <div className="relative inline-block">
      <Button variant="outline" disabled className={className} title={tooltip}>
        {label}
      </Button>
      <Link
        href={`/pricing?feature=${feature}`}
        className="absolute inset-0"
        aria-label={`${label} — see plans`}
      />
    </div>
  );
}
