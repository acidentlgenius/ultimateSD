import { Loader2 } from 'lucide-react';

export default function WidgetLoader() {
  return (
    <div className="flex items-center justify-center p-12 border-2 border-dashed rounded-lg">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
