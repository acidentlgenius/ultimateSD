import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Zap, Users, ShoppingCart, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const TOTAL_INVENTORY = 100;
const USER_SURGE = 150; // Total users trying to buy

const FlashSaleDemo: React.FC = () => {
    const [inventory, setInventory] = useState(TOTAL_INVENTORY);
    const [sold, setSold] = useState(0);
    const [queue, setQueue] = useState<number[]>([]); // User IDs in queue
    const [activeUsers, setActiveUsers] = useState(0);
    const [useLocking, setUseLocking] = useState(true);
    const [isSaleActive, setIsSaleActive] = useState(false);
    const [oversold, setOversold] = useState(0);

    const inventoryRef = useRef(TOTAL_INVENTORY); // For simulate race conditions
    const processingRef = useRef(false);

    const startSale = () => {
        setInventory(TOTAL_INVENTORY);
        setSold(0);
        setOversold(0);
        setQueue(Array.from({ length: USER_SURGE }, (_, i) => i + 1));
        setActiveUsers(USER_SURGE);
        setIsSaleActive(true);
        inventoryRef.current = TOTAL_INVENTORY;
        toast.success("Flash Sale Started! 🚀");
    };

    useEffect(() => {
        if (!isSaleActive || queue.length === 0) return;

        const interval = setInterval(() => {
            // Process a batch of users
            const batchSize = Math.floor(Math.random() * 5) + 1;
            const currentBatch = queue.slice(0, batchSize);

            if (currentBatch.length === 0) {
                setIsSaleActive(false);
                return;
            }

            setQueue(prev => prev.slice(batchSize));

            currentBatch.forEach(userId => {
                processPurchase(userId);
            });

        }, 500); // Batch every 500ms

        return () => clearInterval(interval);
    }, [isSaleActive, queue, useLocking, processPurchase]);

    const processPurchase = useCallback((userId: number) => {
        if (useLocking) {
            // Correct Safe Implementation usually involves DB locks or Redis constraints
            // We simulate it by checking state synchronously in this single-threaded JS environment
            // effectively, JS represents the single-threaded Redis execution model here.
            setInventory(prev => {
                if (prev > 0) {
                    setSold(s => s + 1);
                    return prev - 1;
                } else {
                    return prev;
                }
            });
        } else {
            // Simulate Race Condition
            // Read "stale" value
            const currentInv = inventoryRef.current;

            // Artificial delay allows other requests to read same stale value? 
            // In React state updates are batched, but let's force visual "overselling" logic

            // Ideally we'd use random chance of "race condition" here:
            if (inventoryRef.current > 0) {
                // "Commit"
                inventoryRef.current -= 1;
                setInventory(inventoryRef.current);
                setSold(s => s + 1);

                // Oops, did we go negative?
                if (inventoryRef.current < 0) {
                    setOversold(o => o + 1);
                }
            }
        }
    }, [useLocking]);

    const resetSale = () => {
        setInventory(TOTAL_INVENTORY);
        setSold(0);
        setOversold(0);
        setQueue([]);
        setActiveUsers(0);
        setIsSaleActive(false);
        inventoryRef.current = TOTAL_INVENTORY;
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-400" />
                        Flash Sale System
                        {oversold > 0 && <Badge variant="destructive" className="ml-auto">OVERSOLD BY {oversold}!</Badge>}
                    </CardTitle>
                    <CardDescription>
                        Simulate 150 users fighting for 100 items. Toggle Locking to prevent overselling.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Controls */}
                    <div className="flex items-center justify-between p-4 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-4">
                            <Button
                                onClick={startSale}
                                disabled={isSaleActive}
                                className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
                            >
                                <Zap className="w-4 h-4 mr-2" /> Start Sale
                            </Button>
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={useLocking}
                                    onCheckedChange={setUseLocking}
                                    disabled={isSaleActive}
                                    id="locking"
                                />
                                <label htmlFor="locking" className="text-sm font-medium text-slate-400 flex items-center gap-1">
                                    <Lock className="w-3 h-3" />
                                    {useLocking ? "Pessimistic Locking (Safe)" : "No Locking (Unsafe)"}
                                </label>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-slate-200">{inventory}</div>
                            <div className="text-xs text-slate-500 uppercase">Stock Left</div>
                        </div>
                    </div>

                    {/* Visuals */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Queue */}
                        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <Users className="w-4 h-4" /> Virtual Queue
                                </h4>
                                <Badge variant="outline">{queue.length} Waiting</Badge>
                            </div>
                            {/* Visualizing queuing dots */}
                            <div className="flex flex-wrap gap-1 h-32 overflow-hidden content-start">
                                <AnimatePresence>
                                    {queue.map((u, i) => (
                                        i < 50 && (
                                            <motion.div
                                                key={u}
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                exit={{ scale: 0 }}
                                                className="w-2 h-2 rounded-full bg-blue-500"
                                            />
                                        )
                                    ))}
                                </AnimatePresence>
                                {queue.length > 50 && <div className="text-xs text-slate-600">+{queue.length - 50} more...</div>}
                            </div>
                        </div>

                        {/* Sales */}
                        <div className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-medium text-slate-400 flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" /> Sales Processed
                                </h4>
                                <Badge variant="secondary" className="bg-emerald-900 text-emerald-300">{sold} Sold</Badge>
                            </div>
                            <Progress value={(sold / TOTAL_INVENTORY) * 100} className="h-4 bg-slate-800" indicatorClassName={oversold > 0 ? "bg-red-500" : "bg-emerald-500"} />
                            <div className="mt-2 text-xs text-center text-slate-500">
                                {sold}/{TOTAL_INVENTORY} Sold
                            </div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
};

export default FlashSaleDemo;
