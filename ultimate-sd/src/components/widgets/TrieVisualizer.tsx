"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Network } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TrieNode = {
    char: string;
    isEnd: boolean;
    children: Record<string, TrieNode>;
};

export default function TrieVisualizer() {
    const [root, setRoot] = useState<TrieNode>({ char: '', isEnd: false, children: {} });
    const [wordInput, setWordInput] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [wordCount, setWordCount] = useState(0);

    const insert = () => {
        if (!wordInput) return;
        const newRoot = JSON.parse(JSON.stringify(root)); // Deep copy
        let node = newRoot;

        for (const char of wordInput.toLowerCase()) {
            if (!node.children[char]) {
                node.children[char] = { char, isEnd: false, children: {} };
            }
            node = node.children[char];
        }
        node.isEnd = true;
        setRoot(newRoot);
        setWordInput('');
        setWordCount(prev => prev + 1);
    };

    const getSuggestions = (prefix: string) => {
        setSearchInput(prefix);
        if (!prefix) {
            setSuggestions([]);
            return;
        }

        let node = root;
        for (const char of prefix.toLowerCase()) {
            if (!node.children[char]) {
                setSuggestions([]);
                return;
            }
            node = node.children[char];
        }

        // DFS to find all words from this node
        const results: string[] = [];
        const dfs = (n: TrieNode, currentWord: string) => {
            if (results.length >= 5) return;
            if (n.isEnd) results.push(currentWord);

            Object.keys(n.children).sort().forEach(char => {
                dfs(n.children[char], currentWord + char);
            });
        };

        dfs(node, prefix.toLowerCase());
        setSuggestions(results);
    };

    // Helper to render tree (simplified view)
    const renderTreeNodes = (node: TrieNode, depth = 0, path = ''): React.ReactNode => {
        if (depth > 2) return null; // Limit depth for visual sanity

        return (
            <div className="flex gap-2">
                {Object.values(node.children).map((child) => {
                    const isMatch = searchInput && (path + child.char).startsWith(searchInput.slice(0, depth + 1));
                    return (
                        <div key={child.char} className="flex flex-col items-center">
                            <div className={`
                w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border
                ${child.isEnd ? 'bg-indigo-500/20 border-indigo-500' : 'bg-background border-border'}
                ${isMatch ? 'ring-2 ring-green-500' : ''}
              `}>
                                {child.char}
                            </div>
                            {Object.keys(child.children).length > 0 && depth < 2 && (
                                <div className="w-px h-4 bg-border/50 my-1" />
                            )}
                            {depth < 2 && (
                                <div className="flex gap-4 border-t border-border/20 pt-2">
                                    {renderTreeNodes(child, depth + 1, path + child.char)}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-indigo-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Network className="h-5 w-5 text-indigo-500" />
                                Prefix Trie Visualizer
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Data structure optimized for prefix lookups.
                            </p>
                        </div>
                        <Badge variant="outline">Words: {wordCount}</Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* Build Trie */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">1. Insert Words</h4>
                            <div className="flex gap-2">
                                <Input
                                    value={wordInput}
                                    onChange={e => setWordInput(e.target.value)}
                                    placeholder="e.g. apple, app, cat..."
                                    className="h-9 font-mono"
                                    onKeyDown={e => e.key === 'Enter' && insert()}
                                />
                                <Button onClick={insert} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                    Add
                                </Button>
                            </div>

                            {/* Simplified Tree View */}
                            <div className="p-4 bg-muted/20 rounded border border-border/50 min-h-[150px] overflow-auto flex justify-center">
                                {Object.keys(root.children).length > 0 ? (
                                    <div className="flex gap-8">
                                        {renderTreeNodes(root)}
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground italic self-center">Tree is empty.</span>
                                )}
                            </div>
                        </div>

                        {/* Test Search */}
                        <div className="space-y-4">
                            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">2. Search Prefix</h4>
                            <div className="relative">
                                <Input
                                    value={searchInput}
                                    onChange={e => getSuggestions(e.target.value)}
                                    placeholder="Type to search..."
                                    className="h-9 pl-9"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs font-bold uppercase text-muted-foreground">Suggestions</div>
                                {suggestions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {suggestions.map(s => (
                                            <Badge key={s} variant="secondary" className="px-3 py-1 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20">
                                                {s}
                                            </Badge>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-xs text-muted-foreground italic">No matches.</div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </Card>
        </div>
    );
}
