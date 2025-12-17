import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Banknote, Repeat, CheckCircle, AlertOctagon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface LedgerEntry {
    id: number;
    transactionId: string;
    account: string;
    type: 'debit' | 'credit';
    amount: number;
    timestamp: string;
}

const INITIAL_BALANCE = {
    Alice: 500,
    Bob: 0,
};

const PaymentLedger: React.FC = () => {
    const [balance, setBalance] = useState(INITIAL_BALANCE);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [amount, setAmount] = useState('50');
    const [requestId, setRequestId] = useState('req_123'); // Idempotency Key
    const [processedKeys, setProcessedKeys] = useState<Set<string>>(new Set());

    const handleTransfer = () => {
        const val = parseInt(amount);
        if (isNaN(val) || val <= 0) return;
        if (balance.Alice < val) {
            toast.error("Insufficient Funds!");
            return;
        }

        // Idempotency Check
        if (processedKeys.has(requestId)) {
            toast.warning("Duplicate Request Detected! (Idempotency Enforced)");
            return;
        }

        // Atomic Transaction Simulation
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];

        const debitEntry: LedgerEntry = {
            id: Date.now(),
            transactionId: requestId,
            account: 'Alice',
            type: 'debit',
            amount: val,
            timestamp,
        };

        const creditEntry: LedgerEntry = {
            id: Date.now() + 1,
            transactionId: requestId,
            account: 'Bob',
            type: 'credit',
            amount: val,
            timestamp,
        };

        setLedger(prev => [debitEntry, creditEntry, ...prev]);
        setBalance(prev => ({
            Alice: prev.Alice - val,
            Bob: prev.Bob + val,
        }));

        setProcessedKeys(prev => new Set(prev).add(requestId));
        toast.success("Transaction Proccessed Successfully");
    };

    const generateNewKey = () => {
        setRequestId(`req_${Math.floor(Math.random() * 1000)}`);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Transaction Input */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Banknote className="w-5 h-5 text-emerald-400" />
                            Payment Gateway
                        </CardTitle>
                        <CardDescription>
                            Transfer funds with idempotency.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 uppercase">From</label>
                            <div className="p-3 bg-slate-950 border border-slate-700 rounded flex justify-between">
                                <span className="text-slate-200 font-bold">Alice</span>
                                <span className="text-emerald-400">${balance.Alice}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs text-slate-500 uppercase">To</label>
                            <div className="p-3 bg-slate-950 border border-slate-700 rounded flex justify-between">
                                <span className="text-slate-200 font-bold">Bob</span>
                                <span className="text-emerald-400">${balance.Bob}</span>
                            </div>
                        </div>

                        <div className="pt-4 space-y-4 border-t border-slate-800">
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="bg-slate-950 border-slate-700 text-slate-200"
                                    placeholder="Amount"
                                />
                                <div className="relative flex-1">
                                    <Input
                                        value={requestId}
                                        onChange={(e) => setRequestId(e.target.value)}
                                        className={`bg-slate-950 border-slate-700 text-slate-200 pr-8 ${processedKeys.has(requestId) ? 'border-yellow-500/50 text-yellow-500' : ''}`}
                                        placeholder="Idempotency Key"
                                    />
                                    <div className="absolute right-2 top-2.5 cursor-pointer" onClick={generateNewKey} title="Generate new key">
                                        <Repeat className="w-4 h-4 text-slate-500 hover:text-white" />
                                    </div>
                                </div>
                            </div>

                            <Button onClick={handleTransfer} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                Transfer Funds
                            </Button>

                            {processedKeys.has(requestId) && (
                                <div className="flex items-center justify-center gap-2 text-xs text-yellow-500 bg-yellow-950/20 p-2 rounded">
                                    <AlertOctagon className="w-3 h-3" />
                                    Idempotency Key Used. Duplicate request will be rejected.
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Ledger */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-base">Double-Entry Ledger</CardTitle>
                        <CardDescription>Immutable record of all movements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-[300px] overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-slate-500">Time</TableHead>
                                        <TableHead className="text-slate-500">Acct</TableHead>
                                        <TableHead className="text-right text-slate-500">Debit</TableHead>
                                        <TableHead className="text-right text-slate-500">Credit</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <AnimatePresence>
                                        {ledger.map((entry) => (
                                            <motion.tr
                                                key={entry.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="border-slate-800/50"
                                            >
                                                <TableCell className="text-xs text-slate-500">{entry.timestamp}</TableCell>
                                                <TableCell className="font-mono text-xs text-slate-300">{entry.account}</TableCell>
                                                <TableCell className="text-right font-mono text-red-400">
                                                    {entry.type === 'debit' ? `$${entry.amount}` : '-'}
                                                </TableCell>
                                                <TableCell className="text-right font-mono text-emerald-400">
                                                    {entry.type === 'credit' ? `$${entry.amount}` : '-'}
                                                </TableCell>
                                            </motion.tr>
                                        ))}
                                    </AnimatePresence>
                                    {ledger.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-slate-600 py-8">
                                                No transactions yet
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PaymentLedger;
