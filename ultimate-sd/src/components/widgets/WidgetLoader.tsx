import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function WidgetLoader() {
  return (
    <Card className="h-[400px] w-full flex flex-col items-center justify-center p-6 bg-muted/20 border-2 border-dashed animate-pulse">
      <div className="flex flex-col items-center gap-4 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading visualization...</p>
      </div>
    </Card>
  );
}
