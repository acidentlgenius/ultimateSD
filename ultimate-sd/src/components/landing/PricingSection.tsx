"use client";

import { CheckCircle2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { motion } from "framer-motion";

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 bg-background relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                    >
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Invest in Your Career</h2>
                        <p className="text-lg text-muted-foreground">
                            Mastering system design is the highest ROI activity for a software engineer.
                            Start for free, upgrade for the ultimate edge.
                        </p>
                    </motion.div>
                </div>

                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {/* Free Plan */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Card className="relative h-full flex flex-col border-border bg-card/50 backdrop-blur-sm hover:border-primary/20 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-2xl">Free</CardTitle>
                                <CardDescription>Perfect for getting started</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">₹0</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-4">
                                    {[
                                        "Access to 3 core problems",
                                        "Basic system design concepts",
                                        "Community support",
                                        "Basic progress tracking"
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-muted-foreground shrink-0" />
                                            <span className="text-muted-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild variant="outline" className="w-full h-12 text-base" size="lg">
                                    <Link href="/login">Get Started Free</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    {/* Platform Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        <Card className="relative h-full flex flex-col border-border bg-card/50 backdrop-blur-sm hover:border-blue-500/20 transition-colors">
                            <CardHeader>
                                <CardTitle className="text-2xl">Platform Plan</CardTitle>
                                <CardDescription>Bring Your Own Key (BYOK)</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">₹299</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-4">
                                    {[
                                        "Unlock all 75+ FAANG problems",
                                        "Use your own OpenAI/Gemini keys",
                                        "Unlimited problem attempts",
                                        "Advanced architecture widgets",
                                        "Save diagram state"
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-blue-500 shrink-0" />
                                            <span className="text-foreground">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition-all hover:scale-[1.02]" size="lg">
                                    <Link href="/pricing">
                                        <Zap className="mr-2 h-4 w-4 fill-white" />
                                        Subscribe Platform
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>

                    {/* AI Plan */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Card className="relative h-full flex flex-col overflow-hidden border-indigo-500/50 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 ring-1 ring-indigo-500/20 hover:ring-indigo-500/50 transition-all shadow-xl shadow-indigo-500/10">
                            <div className="absolute top-0 right-0 bg-gradient-to-l from-indigo-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg shadow-sm">
                                POPULAR
                            </div>
                            <CardHeader>
                                <CardTitle className="text-2xl flex items-center gap-2">
                                    AI Plan <span className="text-sm font-normal text-muted-foreground bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">Everything</span>
                                </CardTitle>
                                <CardDescription>For serious system design learners</CardDescription>
                                <div className="mt-4">
                                    <span className="text-4xl font-bold">₹699</span>
                                    <span className="text-muted-foreground">/month</span>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-4">
                                    {[
                                        "Unlock all 75+ FAANG problems",
                                        "Generous AI feedback credits",
                                        "No API keys required",
                                        "Priority AI response time",
                                        "Premium solutions access",
                                        "Early access to new features"
                                    ].map((feature) => (
                                        <li key={feature} className="flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                <Button asChild className="w-full h-12 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.02]" size="lg">
                                    <Link href="/pricing">
                                        <Zap className="mr-2 h-4 w-4 fill-white" />
                                        Upgrade to AI
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
