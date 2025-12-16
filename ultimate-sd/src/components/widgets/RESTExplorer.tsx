"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, ArrowUpRight, ArrowDownLeft, Server, FileJson } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Method = 'GET' | 'POST' | 'DELETE' | 'PUT';
type Endpoint = '/users' | '/users/1' | '/posts';

type ResponseData = {
    status: number;
    data: any;
    time: number;
};

export default function RESTExplorer() {
    const [method, setMethod] = useState<Method>('GET');
    const [endpoint, setEndpoint] = useState<Endpoint>('/users');
    const [response, setResponse] = useState<ResponseData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [reqId, setReqId] = useState(0);

    const sendRequest = async () => {
        setIsLoading(true);
        setResponse(null);
        const currentReqId = reqId + 1;
        setReqId(currentReqId);

        await new Promise(r => setTimeout(r, 600));

        let resData: ResponseData = { status: 200, data: {}, time: Date.now() };

        if (endpoint === '/users' && method === 'GET') {
            resData = { status: 200, data: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }], time: 45 };
        } else if (endpoint === '/users' && method === 'POST') {
            resData = { status: 201, data: { id: 3, name: 'NewUser' }, time: 120 };
        } else if (endpoint === '/users/1' && method === 'GET') {
            resData = { status: 200, data: { id: 1, name: 'Alice' }, time: 30 };
        } else if (endpoint === '/users/1' && method === 'DELETE') {
            resData = { status: 204, data: null, time: 80 };
        } else {
            resData = { status: 405, data: { error: 'Method Not Allowed' }, time: 20 };
        }

        setResponse(resData);
        setIsLoading(false);
    };

    return (
        <div className="space-y-6 animate-fade-in text-sm">
            <Card className="p-6 border-2 border-blue-500/20 bg-card/50 backdrop-blur-sm">
                <div className="flex flex-col gap-6">

                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-blue-500" />
                                REST Explorer
                            </h3>
                            <p className="text-xs text-muted-foreground mt-1">
                                Standard HTTP Verbs & Resources.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                        <select
                            value={method}
                            onChange={(e) => setMethod(e.target.value as Method)}
                            className="bg-card px-2 py-1 rounded text-xs font-bold w-20"
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                            <option value="PUT">PUT</option>
                            <option value="DELETE">DELETE</option>
                        </select>
                        <div className="flex-1 bg-card px-3 py-1.5 rounded text-xs px-2 font-mono flex items-center gap-1">
                            <span className="text-slate-500">https://api.example.com</span>
                            <select
                                value={endpoint}
                                onChange={(e) => setEndpoint(e.target.value as Endpoint)}
                                className="bg-transparent text-blue-400 outline-none w-full"
                            >
                                <option value="/users">/users</option>
                                <option value="/users/1">/users/1</option>
                                <option value="/posts">/posts</option>
                            </select>
                        </div>
                        <Button onClick={sendRequest} disabled={isLoading} size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs px-4">
                            Send
                        </Button>
                    </div>

                    <div className="flex gap-4 min-h-[160px]">

                        {/* Visual Flow */}
                        <div className="flex items-center justify-between flex-1 px-8 relative">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                    <Globe className="h-8 w-8 text-slate-400" />
                                </div>
                                <div className="text-[10px] text-muted-foreground">Client</div>
                            </div>

                            {/* Request Animation */}
                            <AnimatePresence>
                                {isLoading && (
                                    <motion.div
                                        key={`req-${reqId}`}
                                        initial={{ x: -100, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 100, opacity: 0 }}
                                        className="absolute left-1/2 -ml-4 top-1/3 p-1 bg-blue-500 rounded-full text-white z-10"
                                    >
                                        <ArrowUpRight className="h-4 w-4" />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Lines */}
                            <div className="absolute left-24 right-24 top-1/2 border-t border-dashed border-slate-700" />

                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700">
                                    <Server className="h-8 w-8 text-slate-400" />
                                </div>
                                <div className="text-[10px] text-muted-foreground">Server</div>
                            </div>
                        </div>

                        {/* Response Panel */}
                        <div className="w-[200px] border-l border-slate-800 pl-4 flex flex-col gap-2">
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">Response</div>
                            {isLoading ? (
                                <div className="text-xs text-blue-500 animate-pulse">Waiting...</div>
                            ) : response ? (
                                <div className="space-y-2 animate-in fade-in slide-in-from-right-4">
                                    <Badge variant={response.status >= 400 ? 'destructive' : 'default'} className="text-[10px]">
                                        {response.status} {response.status === 200 ? 'OK' : response.status === 201 ? 'Created' : response.status === 204 ? 'No Content' : 'Error'}
                                    </Badge>
                                    <div className="text-[10px] text-slate-500">{response.time}ms</div>
                                    {response.data && (
                                        <pre className="text-[10px] font-mono text-green-400 bg-slate-950 p-2 rounded overflow-auto max-h-[100px]">
                                            {JSON.stringify(response.data, null, 2)}
                                        </pre>
                                    )}
                                </div>
                            ) : (
                                <div className="text-[10px] text-slate-600">No request sent.</div>
                            )}
                        </div>

                    </div>

                </div>
            </Card>
        </div>
    );
}
