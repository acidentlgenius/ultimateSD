import React from 'react';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function WidgetLoader() {
  return (
    <Card className="p-12 flex flex-col items-center justify-center border-2 border-dashed border-muted bg-muted/10 h-[400px]">
      <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-4" />
      <p className="text-sm text-muted-foreground font-medium">Loading visualization...</p>
    </Card>
  );
}
