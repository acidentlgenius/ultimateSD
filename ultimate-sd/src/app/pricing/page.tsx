import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/auth";
import Link from "next/link";

export default async function PricingPage() {
    const session = await auth();

    return (
        <div className="min-h-screen bg-background pt-24 pb-12">
            <div className="container px-4 mx-auto max-w-5xl">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        All features are now free! Start practicing system design today.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan */}
                    <Card className="relative border-border bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-2xl">Free</CardTitle>
                            <CardDescription>Essential features for beginners</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">$0</span>
                                <span className="text-muted-foreground">/month</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {[
                                    "Access to basic problems",
                                    "Limited practice sessions",
                                    "Community support",
                                    "Basic progress tracking"
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                                        <span className="text-muted-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button asChild variant="outline" className="w-full" size="lg">
                                <Link href={session ? "/practice" : "/login"}>
                                    {session ? "Continue Free" : "Get Started"}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* All Features Plan */}
                    <Card className="relative overflow-hidden border-primary/50 bg-gradient-to-br from-primary/5 to-purple-500/5">
                        <CardHeader>
                            <CardTitle className="text-2xl">All Features</CardTitle>
                            <CardDescription>Everything is now free for everyone!</CardDescription>
                            <div className="mt-4">
                                <span className="text-4xl font-bold">Free</span>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3">
                                {[
                                    "Unlimited solution access",
                                    "All practice problems",
                                    "Expert-curated answers",
                                    "AI-powered feedback",
                                    "Progress tracking",
                                    "All features unlocked"
                                ].map((feature) => (
                                    <li key={feature} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-5 w-5 text-primary" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            <Button asChild className="w-full" size="lg">
                                <Link href={session ? "/" : "/login"}>
                                    {session ? "Start Practicing" : "Get Started"}
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
