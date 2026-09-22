'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Sparkles, Wand2 } from 'lucide-react';
import Link from 'next/link';

export default function CustomProblemPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const params = new URLSearchParams({
      title: title.trim(),
      description: description.trim(),
    });

    router.push(`/custom/practice?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border bg-card/30 backdrop-blur-md p-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="hover:bg-muted/50" aria-label="Back to home">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm text-white">
              <Wand2 className="h-4 w-4" />
            </div>
            <h1 className="font-bold text-lg hidden sm:block">Design Your Own Problem</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-8 mt-8">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-3">Custom System Design Challenge</h2>
          <p className="text-muted-foreground">
            Got an interview coming up for a specific company or domain? Define your own system design problem and practice it with our AI assistant.
          </p>
        </div>

        <Card className="p-6 bg-card/50 border-border/50 backdrop-blur-xl shadow-xl shadow-black/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

          <form onSubmit={handleStart} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                Problem Title <span className="text-red-500">*</span>
              </label>
              <Input
                id="title"
                placeholder="e.g., Design a Real-time Collaborative Code Editor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg py-6 bg-background/50 focus-visible:ring-primary/20"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-semibold flex items-center justify-between">
                <span>Description / Key Constraints</span>
                <span className="text-xs text-muted-foreground font-normal">Optional</span>
              </label>
              <Textarea
                id="description"
                placeholder="e.g., The system should support up to 50 concurrent users editing the same document. It needs to handle offline sync via CRDTs or Operational Transformation. Assume 1M DAU globally."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[160px] resize-none bg-background/50 focus-visible:ring-primary/20 leading-relaxed"
              />
              <p className="text-xs text-muted-foreground mt-2">
                Providing more context helps the AI evaluate your design more accurately against your specific constraints.
              </p>
            </div>

            <div className="pt-4 border-t border-border/40">
              <Button
                type="submit"
                size="lg"
                className="w-full h-14 text-base font-bold shadow-lg transition-transform hover:-translate-y-0.5"
                disabled={!title.trim()}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Start Custom Practice
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
