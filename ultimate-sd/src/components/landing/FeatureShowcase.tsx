"use client";

import { motion } from "framer-motion";
import FlashSaleDemo from "@/components/widgets/FlashSaleDemo";
import SecretVault from "@/components/widgets/SecretVault";
import GraphQLPlayground from "@/components/widgets/GraphQLPlayground";

export function FeatureShowcase() {
    return (
        <div id="features" className="py-24 bg-muted/30">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Simulation is the New Learning</h2>
                        <p className="text-lg text-muted-foreground">
                            Don't just read about distributed systems. <strong>Break them.</strong> Fix them. Optimize them.
                            Our interactive widgets let you experience the trade-offs firsthand.
                        </p>
                    </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Feature 1: Flash Sale */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="group relative rounded-2xl border bg-card p-2 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-red-500 opacity-20 blur group-hover:opacity-40 transition duration-500 rounded-2xl" />
                        <div className="relative h-full bg-card rounded-xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-border/50">
                                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                    <span className="text-2xl">⚡️</span> Handle the thundering herd
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Simulate millions of users competing for limited inventory. Learn race conditions, locking strategies, and queueing.
                                </p>
                            </div>
                            <div className="flex-1 p-6 bg-muted/10 items-center justify-center flex">
                                {/* We scale it down slightly to fit nicely if needed, or just standard render */}
                                <div className="w-full max-w-md pointer-events-none md:pointer-events-auto">
                                    <FlashSaleDemo />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 2: Secret Vault */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="group relative rounded-2xl border bg-card p-2 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-20 blur group-hover:opacity-40 transition duration-500 rounded-2xl" />
                        <div className="relative h-full bg-card rounded-xl overflow-hidden flex flex-col">
                            <div className="p-6 border-b border-border/50">
                                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                    <span className="text-2xl">🔒</span> Secure by Design
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Visualize encryption, key management, and secure storage implementation details.
                                </p>
                            </div>
                            <div className="flex-1 p-6 bg-muted/10 items-center justify-center flex">
                                <div className="w-full max-w-md pointer-events-none md:pointer-events-auto">
                                    <SecretVault />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Feature 3: API Explorer (Full Width) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                        className="lg:col-span-2 group relative rounded-2xl border bg-card p-2 shadow-sm transition-shadow hover:shadow-md"
                    >
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 opacity-20 blur group-hover:opacity-40 transition duration-500 rounded-2xl" />
                        <div className="relative h-full bg-card rounded-xl overflow-hidden flex flex-col md:flex-row">
                            <div className="p-6 md:w-1/3 border-b md:border-b-0 md:border-r border-border/50 flex flex-col justify-center">
                                <h3 className="text-xl font-semibold mb-2 flex items-center gap-2">
                                    <span className="text-2xl">🔌</span> API First Engineering
                                </h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Master GraphQL and REST patterns. Understand schemas, resolvers, and over-fetching issues visually.
                                </p>
                                <ul className="space-y-2 text-sm">
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Interactive Schema Explorer
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Query Builder
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                        Real-time Response Validation
                                    </li>
                                </ul>
                            </div>
                            <div className="flex-1 p-6 bg-muted/10 items-center justify-center flex min-h-[400px]">
                                <div className="w-full h-full pointer-events-none md:pointer-events-auto overflow-hidden">
                                    <GraphQLPlayground />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}
