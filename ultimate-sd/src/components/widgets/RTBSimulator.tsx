import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gavel, DollarSign, TrendingUp, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bidder {
    id: string;
    name: string;
    bid: number; // Max bid in CPM
    ctr_pred: number; // Predicted CTR %
    color: string;
}

const RTBSimulator: React.FC = () => {
    const [bidders, setBidders] = useState<Bidder[]>([
        { id: '1', name: 'Nike', bid: 5.00, ctr_pred: 0.8, color: 'text-blue-400' },
        { id: '2', name: 'Adidas', bid: 4.50, ctr_pred: 1.2, color: 'text-green-400' },
        { id: '3', name: 'Puma', bid: 6.00, ctr_pred: 0.5, color: 'text-yellow-400' },
    ]);

    const [winner, setWinner] = useState<any | null>(null);
    const [isAuctioning, setIsAuctioning] = useState(false);

    // Randomize bids slightly for variety
    const randomize = () => {
        setBidders(prev => prev.map(b => ({
            ...b,
            bid: Number((Math.random() * 5 + 2).toFixed(2)),
            ctr_pred: Number((Math.random() * 2).toFixed(2))
        })));
        setWinner(null);
    };

    const runAuction = () => {
        setIsAuctioning(true);
        setWinner(null);

        // Calculate eCPM = Bid * CTR * 10 (scaling factor)
        const results = bidders.map(b => ({
            ...b,
            ecpm: b.bid * b.ctr_pred * 10
        })).sort((a, b) => b.ecpm - a.ecpm);

        setTimeout(() => {
            const win = results[0];
            const runnerUp = results[1];

            // Second price auction: Pay runner up's eCPM / CTR (simulated) or just runner up's price
            // Simplified: Price to pay is just enough to beat runner up
            const clearingPrice = runnerUp.ecpm / (win.ctr_pred * 10);

            setWinner({
                ...win,
                clearingPrice: clearingPrice.toFixed(2)
            });
            setIsAuctioning(false);
        }, 1500);
    };

    return (
        <Card className="w-full max-w-4xl p-6 bg-slate-900 border-yellow-500/30 shadow-2xl shadow-yellow-500/10">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                        <Gavel className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Real-Time Bidding (RTB)</h2>
                        <p className="text-sm text-slate-400">Vickrey Auction Simulator</p>
                    </div>
                </div>
                <Button
                    variant="outline"
                    onClick={randomize}
                    className="gap-2"
                >
                    <Users className="w-4 h-4" />
                    Shuffle Bidders
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {bidders.map((bidder) => (
                    <div key={bidder.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700 relative overflow-hidden">
                        <div className="flex justify-between items-start mb-2">
                            <span className={`font-bold ${bidder.color}`}>{bidder.name}</span>
                            <Badge variant="outline" className="border-slate-600 text-slate-400">DSP {bidder.id}</Badge>
                        </div>
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Max Bid (CPM)</span>
                                <span className="text-white">${bidder.bid.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Pred. CTR</span>
                                <span className="text-white">{bidder.ctr_pred}%</span>
                            </div>
                        </div>
                        {winner?.id === bidder.id && (
                            <div className="absolute inset-0 bg-yellow-500/10 border-2 border-yellow-500 rounded-lg pointer-events-none flex items-center justify-center">
                                <span className="bg-yellow-500 text-black font-bold px-3 py-1 rounded-full text-xs shadow-lg uppercase tracking-wider">Winning Bid</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex flex-col items-center">
                <Button
                    size="lg"
                    onClick={runAuction}
                    disabled={isAuctioning}
                    className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-400 hover:to-amber-500 text-black font-bold px-8 shadow-yellow-900/50 shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                    {isAuctioning ? (
                        <span className="flex items-center gap-2">
                            <TrendingUp className="animate-spin w-4 h-4" /> Running Auction...
                        </span>
                    ) : (
                        'Start Auction'
                    )}
                </Button>

                <AnimatePresence>
                    {winner && !isAuctioning && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8 w-full bg-slate-800/50 border border-slate-700 rounded-xl p-6 text-center"
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">
                                Winner: <span className={winner.color}>{winner.name}</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-8 max-w-sm mx-auto mt-4">
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">eCPM Score</p>
                                    <p className="text-xl font-mono text-white">{(winner.ecpm).toFixed(2)}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Clearing Price</p>
                                    <p className="text-xl font-mono text-green-400 flex items-center justify-center gap-1">
                                        <DollarSign className="w-4 h-4" />
                                        {winner.clearingPrice}
                                    </p>
                                </div>
                            </div>
                            <p className="mt-4 text-xs text-slate-500">
                                Winning Logic: Highest eCPM wins, but pays slightly more than the 2nd highest eCPM (Second-Price Auction Principle).
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default RTBSimulator;
