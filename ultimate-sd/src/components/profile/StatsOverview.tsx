"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Target, Zap, BrainCircuit, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

interface StatsOverviewProps {
    stats: {
        totalSolved: number;
        activeDays: number;
        avgScore: number | null;
    };
}

const statsData = [
    {
        label: "Problems Solved",
        valueKey: "totalSolved",
        icon: CheckCircle2,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
        borderColor: "group-hover:border-green-500/50",
        desc: "Total completed designs"
    },
    {
        label: "Average Score",
        valueKey: "avgScore",
        icon: Target,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
        borderColor: "group-hover:border-blue-500/50",
        desc: "Across all submissions",
        isPercent: true
    },
    {
        label: "Current Streak",
        valueKey: "activeDays",
        icon: Zap,
        color: "text-amber-500",
        bgColor: "bg-amber-500/10",
        borderColor: "group-hover:border-amber-500/50",
        desc: "Consecutive days active"
    },
    {
        label: "Focus Area",
        value: "System Design",
        icon: BrainCircuit,
        color: "text-purple-500",
        bgColor: "bg-purple-500/10",
        borderColor: "group-hover:border-purple-500/50",
        desc: "Primary learning track"
    }
];

export function StatsOverview({ stats }: StatsOverviewProps) {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
        >
            {statsData.map((stat, idx) => {
                const rawValue = stat.value || stats[stat.valueKey as keyof typeof stats];
                const displayValue = stat.isPercent
                    ? (rawValue ? `${Math.round(Number(rawValue))}%` : 'N/A')
                    : rawValue;

                return (
                    <motion.div key={stat.label} variants={item}>
                        <Card className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg border-border/50 hover:-translate-y-1 ${stat.borderColor}`}>
                            <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${stat.color}`}>
                                <stat.icon className="w-16 h-16 transform translate-x-4 -translate-y-4 rotate-12" />
                            </div>

                            <CardContent className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color} ring-1 ring-inset ring-black/5 dark:ring-white/10`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-3xl font-bold tracking-tight">{displayValue}</h3>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                </div>
                                <p className="text-xs text-muted-foreground/60 mt-3 pt-3 border-t border-border/50">
                                    {stat.desc}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>
                );
            })}
        </motion.div>
    );
}
