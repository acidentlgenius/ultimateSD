import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Box, Lock, Send, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SidecarVisualizer: React.FC = () => {
    const [sidecarEnabled, setSidecarEnabled] = useState(false);
    const [requests, setRequests] = useState<number[]>([]);
    const timeoutIds = useRef(new Set<NodeJS.Timeout>());

    // Clean up timeouts on unmount
    useEffect(() => {
        return () => {
            timeoutIds.current.forEach(clearTimeout);
            timeoutIds.current.clear();
        };
    }, []);

    const sendRequest = () => {
        const id = Date.now();
        setRequests(prev => [...prev, id]);
        const tId = setTimeout(() => {
            setRequests(prev => prev.filter(reqId => reqId !== id));
        }, 2000);
        timeoutIds.current.add(tId);
    };

    return (
        <Card className="w-full max-w-4xl p-6 bg-slate-900 border-indigo-500/30 shadow-2xl shadow-indigo-500/10">
            <div className="flex items-center justify-between mb-12">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
                        <Box className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white">Service Mesh: Sidecar Pattern</h2>
                        <p className="text-sm text-slate-400">Decoupling networking logic from application code</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="text-sm font-medium text-slate-300">Enable Sidecars (Envoy)</span>
                    <Switch
                        checked={sidecarEnabled}
                        onCheckedChange={setSidecarEnabled}
                        className="data-[state=checked]:bg-indigo-500"
                    />
                </div>
            </div>

            <div className="relative flex justify-between items-center px-12 py-12 bg-slate-800/30 rounded-xl border border-slate-700 border-dashed">

                {/* Service A */}
                <div className={`
           relative p-6 rounded-xl border-2 transition-all duration-300
           ${sidecarEnabled ? 'border-dashed border-indigo-500/30 bg-indigo-500/5' : 'border-slate-600 bg-slate-800'}
        `}>
                    {sidecarEnabled && (
                        <div className="absolute -top-3 left-4 bg-indigo-500 text-xs font-bold px-2 py-0.5 rounded text-white shadow-lg">
                            Pod A
                        </div>
                    )}
                    <div className="flex gap-4">
                        {/* App Container */}
                        <div className="bg-blue-600 p-4 rounded-lg shadow-lg flex flex-col items-center gap-2 z-10 w-24">
                            <Box className="w-8 h-8 text-white" />
                            <span className="text-xs font-bold text-white">Service A</span>
                        </div>

                        {/* Sidecar Container */}
                        <AnimatePresence>
                            {sidecarEnabled && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: -20 }}
                                    className="bg-purple-600 p-4 rounded-lg shadow-lg flex flex-col items-center gap-2 z-10 w-24 border border-purple-400"
                                >
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                    <span className="text-xs font-bold text-white">Proxy</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Traffic Visualizer */}
                <div className="flex-1 relative h-12 flex items-center justify-center">
                    <div className="w-full h-[2px] bg-slate-700 absolute"></div>
                    {requests.map(id => (
                        <motion.div
                            key={id}
                            initial={{ left: '0%', opacity: 1 }}
                            animate={{ left: '100%', opacity: 0 }}
                            transition={{ duration: 1.5, ease: "linear" }}
                            className="absolute top-1/2 -translate-y-1/2"
                        >
                            <div className={`p-2 rounded-full shadow-lg flex items-center gap-1 ${sidecarEnabled ? 'bg-green-500 text-black' : 'bg-slate-500 text-white'}`}>
                                {sidecarEnabled && <Lock className="w-3 h-3" />}
                                <span className="text-[10px] font-bold">REQ</span>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Service B */}
                <div className={`
           relative p-6 rounded-xl border-2 transition-all duration-300
           ${sidecarEnabled ? 'border-dashed border-indigo-500/30 bg-indigo-500/5' : 'border-slate-600 bg-slate-800'}
        `}>
                    {sidecarEnabled && (
                        <div className="absolute -top-3 left-4 bg-indigo-500 text-xs font-bold px-2 py-0.5 rounded text-white shadow-lg">
                            Pod B
                        </div>
                    )}
                    <div className="flex gap-4 flex-row-reverse">
                        {/* App Container */}
                        <div className="bg-amber-600 p-4 rounded-lg shadow-lg flex flex-col items-center gap-2 z-10 w-24">
                            <Box className="w-8 h-8 text-white" />
                            <span className="text-xs font-bold text-white">Service B</span>
                        </div>

                        {/* Sidecar Container */}
                        <AnimatePresence>
                            {sidecarEnabled && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.8, x: 20 }}
                                    animate={{ opacity: 1, scale: 1, x: 0 }}
                                    exit={{ opacity: 0, scale: 0.8, x: 20 }}
                                    className="bg-purple-600 p-4 rounded-lg shadow-lg flex flex-col items-center gap-2 z-10 w-24 border border-purple-400"
                                >
                                    <ShieldCheck className="w-8 h-8 text-white" />
                                    <span className="text-xs font-bold text-white">Proxy</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

            </div>

            <div className="mt-8 flex justify-center">
                <button
                    onClick={sendRequest}
                    className="bg-black dark:bg-white text-black px-6 py-3 rounded-full font-bold shadow-lg shadow-white/10 hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <Send className="w-4 h-4" /> Send Request
                </button>
            </div>

            <div className="mt-6 text-center text-sm text-slate-400 min-h-[40px]">
                {sidecarEnabled ? (
                    <span className="text-green-400 flex items-center justify-center gap-2">
                        <Lock className="w-4 h-4" /> Traffic is encrypted (mTLS) and routed via Proxies. Observability & Retries handled automatically.
                    </span>
                ) : (
                    <span>Legacy: Service A calls Service B directly. No built-in encryption, tracing, or retry logic.</span>
                )}
            </div>
        </Card>
    );
};

export default SidecarVisualizer;
