'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useForgeCanvasRef } from './ForgeCanvasContext';

type ForgeExportMenuProps = {
  problemTitle: string;
};

export function ForgeExportMenu({ problemTitle }: ForgeExportMenuProps) {
  const forgeRef = useForgeCanvasRef();
  const [exporting, setExporting] = useState(false);

  const handleExportPng = async () => {
    setExporting(true);
    try {
      const blob = await forgeRef.current?.exportPng();
      if (!blob) {
        toast.error('Nothing to export yet — add content to the canvas first.');
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${problemTitle.replace(/\s+/g, '-').toLowerCase()}-forge.png`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Canvas exported as PNG');
    } catch {
      toast.error('Export failed — try again');
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={exporting} data-testid="forge-export">
          {exporting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-1 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPng}>Download PNG</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
