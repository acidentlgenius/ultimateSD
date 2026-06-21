"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles, Key } from "lucide-react";
import Link from "next/link";

interface ProModalProps {
    isOpen: boolean;
    onClose: () => void;
    problemTitle?: string;
}

const platformFeatures = [
    "Unlock all 75+ FAANG problems",
    "Use your own Gemini API key (BYOK)",
    "Unlimited problem attempts",
    "Advanced widgets & diagram save",
];

const aiFeatures = [
    "Everything in Platform plan",
    "500 AI credits / month included",
    "No API key setup required",
];

export function ProModal({ isOpen, onClose, problemTitle }: ProModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg text-white">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                            Unlock Premium Problems
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        {problemTitle
                            ? `"${problemTitle}" is part of our premium library. Choose a plan to continue.`
                            : 'Upgrade to access the full problem library and AI-powered feedback.'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid sm:grid-cols-2 gap-4 py-2">
                    <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-blue-600">
                            <Key className="h-4 w-4" /> Platform · ₹299/mo
                        </div>
                        <ul className="space-y-2">
                            {platformFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                        <div className="flex items-center gap-2 font-semibold text-indigo-600">
                            <Sparkles className="h-4 w-4" /> AI Plan · ₹699/mo
                        </div>
                        <ul className="space-y-2">
                            {aiFeatures.map((feature) => (
                                <li key={feature} className="flex items-start gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                                    <span>{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white">
                        <Link href="/pricing">View Plans & Subscribe</Link>
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="w-full">
                        Continue with Free Problems
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
