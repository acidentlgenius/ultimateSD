"use client";

import { useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { CodeBlock as CodeBlockType } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function CodeBlock({ block }: { block: CodeBlockType }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(block.code);
    setCopied(true);
    toast.success("Code copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-6 overflow-hidden rounded-lg border bg-zinc-950 dark:bg-zinc-950/90 shadow-sm">
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
          <FileCode2 className="h-4 w-4" />
          {block.filename || block.language}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={copyToClipboard}
          title="Copy code"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <div className="overflow-x-auto p-4 text-sm">
        <pre className="font-mono text-zinc-100">
          <code className={`language-${block.language}`}>{block.code}</code>
        </pre>
      </div>
    </div>
  );
}
