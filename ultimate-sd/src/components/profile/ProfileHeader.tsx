"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Sparkles, Zap, Crown } from "lucide-react";
import { User } from "next-auth";
import { motion } from "framer-motion";

interface ProfileHeaderProps {
    user: User & {
        xp?: number;
        level?: number;
        streak?: number;
    };
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
    const currentXP = user.xp || 0;
    const level = user.level || 1;
    const streak = user.streak || 0;

    // Calculate XP progress (assuming 1000 XP per level for now)
    const xpForNextLevel = level * 1000;
    const xpProgress = Math.min(100, (currentXP / xpForNextLevel) * 100);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-2xl border border-border/50 bg-background/50 backdrop-blur-xl shadow-xl dark:shadow-primary/5 mb-8"
        >
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 opacity-50 dark:opacity-30 blur-3xl" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">

                {/* Avatar Section */}
                <motion.div
                    className="relative group"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-500" />
                    <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-background relative">
                        <AvatarImage src={user.image || ""} alt={user.name || ""} className="object-cover" />
                        <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 text-primary">
                            {user.name?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                    </Avatar>

                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-background">
                        <Crown className="w-3 h-3 fill-current" />
                        Lvl {level}
                    </div>
                </motion.div>

                {/* User Info Section */}
                <div className="flex-1 text-center md:text-left space-y-4 w-full pt-2">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                {user.name}
                            </h1>
                            <p className="text-muted-foreground font-medium flex items-center justify-center md:justify-start gap-2">
                                {user.email}
                                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <motion.div whileHover={{ y: -2 }} className="cursor-help">
                                <Badge variant="outline" className="px-4 py-1.5 h-auto text-sm bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-600 border-orange-200 dark:border-orange-900/50 backdrop-blur-sm gap-2">
                                    <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
                                    <span className="font-semibold">{streak}</span> Day Streak
                                </Badge>
                            </motion.div>
                        </div>
                    </div>

                    <div className="space-y-2 bg-secondary/30 p-4 rounded-xl border border-border/50">
                        <div className="flex justify-between items-end text-sm">
                            <span className="text-muted-foreground font-medium flex items-center gap-2">
                                <Zap className="w-4 h-4 text-blue-500 fill-blue-500" />
                                Current Progress
                            </span>
                            <div className="text-right">
                                <span className="font-bold text-foreground text-lg">{currentXP}</span>
                                <span className="text-muted-foreground text-xs font-medium uppercase ml-1">/ {xpForNextLevel} XP</span>
                            </div>
                        </div>
                        <div className="h-3 w-full bg-secondary/50 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            />
                        </div>
                        <p className="text-xs text-center md:text-right text-muted-foreground pt-1">
                            {Math.round(xpForNextLevel - currentXP)} XP needed for Level {level + 1}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
