'use client';

import { useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { LockedFeatureButton } from '@/components/LockedFeatureButton';
import {
  markPracticeAloudSeen,
  shouldShowPracticeAloudExplainer,
} from '@/lib/practice-aloud';

interface PracticeAloudToggleProps {
  enabled: boolean;
  entitled: boolean;
  onEnabledChange: (enabled: boolean) => void;
}

export function PracticeAloudToggle({ enabled, entitled, onEnabledChange }: PracticeAloudToggleProps) {
  const [showExplainer, setShowExplainer] = useState(false);

  useEffect(() => {
    setShowExplainer(shouldShowPracticeAloudExplainer());
  }, []);

  const handleToggle = (checked: boolean) => {
    if (checked) {
      markPracticeAloudSeen();
      setShowExplainer(false);
    }
    onEnabledChange(checked);
  };

  if (!entitled) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Mic className="h-3.5 w-3.5" />
            Practice aloud
          </Label>
          <LockedFeatureButton
            feature="voiceInterview"
            label="Off"
            tooltip="Available on the AI plan — answer out loud like a real interview"
            className="h-8 px-3 text-xs"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="practice-aloud" className="text-sm font-medium flex items-center gap-2">
          <Mic className="h-3.5 w-3.5" />
          Practice aloud
        </Label>
        <Switch id="practice-aloud" checked={enabled} onCheckedChange={handleToggle} />
      </div>
      {showExplainer && (
        <p className="text-xs text-muted-foreground">
          Answer out loud — the AI listens and responds like a mock interviewer.
        </p>
      )}
    </div>
  );
}
