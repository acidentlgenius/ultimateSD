"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

interface ProModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const features = [
    "Unlimited solution access",
    "Advanced system design patterns",
    "Expert-curated answers",
    "Priority support",
    "Early access to new features"
];

export function ProModal({ isOpen, onClose }: ProModalProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg text-white">
                            <Sparkles className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                            Unlock Pro Access
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-base">
                        Upgrade to Pro to access all solutions and accelerate your system design mastery.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid gap-3">
                        {features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button asChild size="lg" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200">
                        <Link href="/pricing">Upgrade Now</Link>
                    </Button>
                    <Button variant="ghost" onClick={onClose} className="w-full">
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
