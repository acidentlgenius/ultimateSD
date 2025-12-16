"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Database, FileText, ArrowRight } from 'lucide-react';

const INITIAL_DOCS = [
    { id: 1, text: 'apple banana apple' },
    { id: 2, text: 'banana cherry' },
    { id: 3, text: 'apple date' }
];

type InvertedIndex = Record<string, number[]>;

export default function InvertedIndexVisualizer() {
    const [docs, setDocs] = useState(INITIAL_DOCS);
    const [query, setQuery] = useState('');
    const [index, setIndex] = useState<InvertedIndex>({});
    const [isIndexed, setIsIndexed] = useState(false);

    const buildIndex = () => {
        const newIndex: InvertedIndex = {};
        docs.forEach(doc => {
            const tokens = doc.text.split(/\s+/);
            tokens.forEach(token => {
                if (!newIndex[token]) newIndex[token] = [];
                if (!newIndex[token].includes(doc.id)) newIndex[token].push(doc.id);
            });
        });
        setIndex(newIndex);
        setIsIndexed(true);
    };

    const getResults = () => {
        if (!query) return [];
        return index[query] || [];
    };

    const results = getResults();

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-primary/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                Inverted Index Builder
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                See how a search engine indexes documents for fast retrieval.
                            </p>
                        </div>
                        <Button onClick={buildIndex} disabled={isIndexed}>
                            {isIndexed ? 'Indexed' : 'Build Index'}
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Documents */}
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Documents</h4>
                            {docs.map(doc => (
                                <div key={doc.id} className={`p-3 rounded border bg-background/50 ${results.includes(doc.id) ? 'border-primary ring-1 ring-primary' : 'border-border'}`}>
                                    <span className="font-mono text-xs text-muted-foreground mr-2">Doc {doc.id}:</span>
                                    "{doc.text}"
                                </div>
                            ))}
                        </div>

                        {/* Index Visualization */}
                        <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2"><Database className="h-4 w-4" /> Index (Token -&gt; DocIDs)</h4>
                            <div className="p-4 rounded bg-muted/50 font-mono text-xs max-h-[150px] overflow-y-auto">
                                {isIndexed ? (
                                    Object.entries(index).map(([token, ids]) => (
                                        <div key={token} className="flex justify-between py-1 border-b border-border/50 last:border-0 hover:bg-black/5">
                                            <span className={query === token ? 'font-bold text-primary' : ''}>{token}</span>
                                            <span className="text-muted-foreground">[{ids.join(', ')}]</span>
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground italic">Index is empty. Click Build Index.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-border/50" />

                    {/* Search Box */}
                    <div className="flex flex-col gap-3 items-center">
                        <h4 className="font-semibold text-sm">Test Search</h4>
                        <div className="flex gap-2 w-full max-w-sm">
                            <Input
                                placeholder="Search for a word (e.g. apple)..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                disabled={!isIndexed}
                            />
                        </div>
                        {query && isIndexed && (
                            <div className="text-xs text-muted-foreground">
                                Found in Docs: <Badge variant="outline">{results.length > 0 ? results.join(', ') : 'None'}</Badge>
                            </div>
                        )}
                    </div>

                </div>
            </Card>
        </div>
    );
}
