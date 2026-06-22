import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowRight, RefreshCw, Hash, Database } from 'lucide-react';
import crypto from 'crypto'; // We'll mock this or use subtle crypto if client side issues arise

export default function EncodingVisualizer() {
    const [url, setUrl] = useState('https://www.google.com/search?q=system+design');
    const [counter, setCounter] = useState(10000000);

    // Base62 logic
    const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const base62Encode = (num: number) => {
        let result = '';
        if (num === 0) return '0';
        while (num > 0) {
            result = ALPHABET[num % 62] + result;
            num = Math.floor(num / 62);
        }
        return result;
    };

    // Hash logic (MD5ish truncation)
    const [hashResult, setHashResult] = useState('');

    const generateHash = async (text: string) => {
        // Simple mock hash for visualization if crypto not available or sync needed
        // In real app use window.crypto.subtle
        if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
            try {
                const msgBuffer = new TextEncoder().encode(text);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex.slice(0, 7); // First 7 chars
            } catch (e) {
                console.warn('Crypto subtle mismatch or error, falling back to mock', e);
            }
        }

        // Fallback mock hash (not secure, just for visual)
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(16).substring(0, 7);
    };

    useEffect(() => {
        generateHash(url + counter).then(setHashResult);
    }, [url, counter]);

    return (
        <div className="space-y-6 animate-fade-in">
            <Card className="p-6 border-2 border-primary/20 bg-primary/5">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                    <Database className="h-5 w-5 text-primary" />
                    Interactive Encoding Playground
                </h3>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Strategy 1: Counter + Base62 */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold text-base">Strategy 1: Base62 (Counter)</Label>
                            <div className="text-xs bg-muted px-2 py-1 rounded">No Collisions</div>
                        </div>

                        <div className="p-4 bg-background rounded-lg border shadow-sm space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Database Counter ID</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={counter}
                                        onChange={(e) => setCounter(parseInt(e.target.value) || 0)}
                                        className="font-mono text-sm"
                                    />
                                    <Button size="icon" variant="outline" aria-label="Refresh Counter" onClick={() => setCounter(c => c + 1)}>
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
                            </div>

                            <div className="bg-primary/10 p-3 rounded border border-primary/30 text-center">
                                <div className="text-xs text-primary mb-1 uppercase tracking-wider font-bold">TinyURL Path</div>
                                <div className="text-2xl font-mono font-bold text-primary">
                                    /{base62Encode(counter)}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pros: Shortest URLs, deterministic.<br />
                            Cons: Predictable (security risk), requires coordination (Zookeeper).
                        </p>
                    </div>

                    {/* Strategy 2: Hashing */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="font-bold text-base">Strategy 2: Hash + Truncate</Label>
                            <div className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 px-2 py-1 rounded">Potential Collisions</div>
                        </div>

                        <div className="p-4 bg-background rounded-lg border shadow-sm space-y-3">
                            <div>
                                <Label className="text-xs text-muted-foreground">Original URL</Label>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>

                            <div className="flex justify-center">
                                <ArrowRight className="h-5 w-5 text-muted-foreground rotate-90 md:rotate-0" />
                            </div>

                            <div className="bg-secondary p-3 rounded border text-center">
                                <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-bold">MD5 (First 7 chars)</div>
                                <div className="text-2xl font-mono font-bold">
                                    /{hashResult}
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Pros: Stateless (mostly).<br />
                            Cons: Longer URLs, collision handling needed.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
