import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserX, Database, CheckCircle, Search, Trash2, ShieldCheck, Server } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

interface DataStore {
    id: string;
    name: string;
    type: 'SQL' | 'NoSQL' | 'Logs';
    status: 'clean' | 'infected' | 'scanning' | 'purging';
    recordsFound: number;
}

const INITIAL_STORES: DataStore[] = [
    { id: 'db-users', name: 'User Profile DB', type: 'SQL', status: 'infected', recordsFound: 1 },
    { id: 'db-orders', name: 'Order History', type: 'SQL', status: 'infected', recordsFound: 5 },
    { id: 'db-logs', name: 'Access Logs', type: 'Logs', status: 'infected', recordsFound: 12 },
    { id: 'db-marketing', name: 'Marketing Leads', type: 'NoSQL', status: 'infected', recordsFound: 1 },
];

export default function PrivacyRequestManager() {
    const [stores, setStores] = useState<DataStore[]>(INITIAL_STORES);
    const [requestState, setRequestState] = useState<'idle' | 'scanning' | 'ready' | 'purging' | 'completed'>('idle');
    const [scanProgress, setScanProgress] = useState(0);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());
    const intervalId = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        return () => {
            if (intervalId.current) clearInterval(intervalId.current);
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    const startScan = () => {
        setRequestState('scanning');
        setScanProgress(0);

        // Simulate scan duration
        let progress = 0;
        intervalId.current = setInterval(() => {
            progress += 5;
            setScanProgress(progress);

            if (progress >= 30 && progress < 60) {
                setStores(prev => prev.map(s => ({ ...s, status: 'scanning' })));
            }

            if (progress >= 100) {
                if (intervalId.current) clearInterval(intervalId.current);

                setRequestState('ready');
                setStores(prev => prev.map(s => ({ ...s, status: 'infected' })));
                toast.info("PII Data Discovered", { description: "Found user data across 4 systems." });
            }
        }, 100);
    };

    const executePurge = () => {
        setRequestState('purging');

        // Animate purge one by one
        stores.forEach((store, index) => {
            const t1 = setTimeout(() => {
                setStores(prev => prev.map(s =>
                    s.id === store.id ? { ...s, status: 'purging' } : s
                ));

                const t2 = setTimeout(() => {
                    setStores(prev => prev.map(s =>
                        s.id === store.id ? { ...s, status: 'clean', recordsFound: 0 } : s
                    ));
                }, 800);
                timeoutIds.current.add(t2);

            }, index * 1000);
            timeoutIds.current.add(t1);
        });

        const t3 = setTimeout(() => {
            setRequestState('completed');
            toast.success("Right to Be Forgotten Executed", { description: "User data permanently removed." });
        }, stores.length * 1000 + 500);
        timeoutIds.current.add(t3);
    };

    const reset = () => {
        setStores(INITIAL_STORES);
        setRequestState('idle');
        setScanProgress(0);
    };

    return (
        <div className="w-full max-w-4xl p-6 bg-teal-50 border border-teal-100 rounded-xl shadow-sm text-teal-900 mx-auto">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-teal-100 rounded-full">
                        <ShieldCheck className="w-6 h-6 text-teal-700" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Privacy Compliance Center</h2>
                        <p className="text-sm text-teal-600">GDPR "Right to Erasure" Orchestrator</p>
                    </div>
                </div>

                <div className="flex gap-3">
                    {requestState === 'idle' && (
                        <Button onClick={startScan} className="bg-teal-600 hover:bg-teal-700">
                            <Search className="w-4 h-4 mr-2" /> Locate User Data
                        </Button>
                    )}
                    {requestState === 'ready' && (
                        <Button onClick={executePurge} variant="destructive">
                            <Trash2 className="w-4 h-4 mr-2" /> Purge All Data
                        </Button>
                    )}
                    {requestState === 'completed' && (
                        <Button onClick={reset} variant="outline" className="border-teal-200 hover:bg-teal-100">
                            Reset Simulation
                        </Button>
                    )}
                </div>
            </div>

            {requestState === 'scanning' && (
                <div className="mb-8">
                    <div className="flex justify-between text-xs font-semibold uppercase mb-2 text-teal-600">
                        <span>Scanning Infrastructure...</span>
                        <span>{scanProgress}%</span>
                    </div>
                    <Progress value={scanProgress} className="h-2 bg-teal-200" indicatorClassName="bg-teal-600" />
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stores.map((store) => (
                    <motion.div
                        key={store.id}
                        layout
                        className={`
              relative p-4 rounded-lg border-2 flex flex-col items-center text-center transition-colors
              ${store.status === 'clean' ? 'bg-black dark:bg-white border-teal-200' : 'bg-black dark:bg-white border-red-100'}
              ${store.status === 'purging' ? 'scale-95 border-red-400 bg-red-50' : ''}
              ${store.status === 'scanning' ? 'animate-pulse border-teal-300' : ''}
            `}
                    >
                        <div className={`mb-3 p-3 rounded-full ${store.status === 'clean' ? 'bg-teal-100 text-teal-600' : 'bg-red-100 text-red-600'}`}>
                            {store.status === 'clean' ? <CheckCircle className="w-6 h-6" /> : <Database className="w-6 h-6" />}
                        </div>

                        <h3 className="font-semibold text-sm mb-1">{store.name}</h3>
                        <span className="text-xs text-slate-400 mb-3">{store.type}</span>

                        {store.status !== 'clean' && requestState !== 'idle' && (
                            <div className="bg-red-50 text-red-700 text-xs px-2 py-1 rounded-full border border-red-100">
                                {store.recordsFound} PII Records
                            </div>
                        )}

                        {store.status === 'clean' && (
                            <span className="text-xs font-bold text-teal-600 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> VERIFIED
                            </span>
                        )}

                        {store.status === 'purging' && (
                            <span className="text-xs text-red-500 font-mono animate-pulse">DELETING...</span>
                        )}
                    </motion.div>
                ))}
            </div>

            {requestState === 'completed' && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-4"
                >
                    <div className="p-2 bg-emerald-100 rounded-full">
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-800">Compliance Report Generated</h4>
                        <p className="text-sm text-emerald-600">Confirmation ID: #GDPR-{Math.floor(Math.random() * 10000)} sent to requester.</p>
                    </div>
                </motion.div>
            )}

        </div>
    );
}
