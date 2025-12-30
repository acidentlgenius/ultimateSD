"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Trophy, Star } from "lucide-react";
import { User } from "next-auth";

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
        <div className="bg-card rounded-xl p-6 border shadow-sm mb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-primary/10">
                    <AvatarImage src={user.image || ""} alt={user.name || ""} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                        {user.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                </Avatar>

                <div className="flex-1 text-center md:text-left space-y-2 w-full">
                    <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                        <div>
                            <h1 className="text-2xl font-bold">{user.name}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="px-3 py-1 bg-amber-500/10 text-amber-600 border-amber-200 dark:border-amber-900">
                                <Flame className="w-4 h-4 mr-1 text-amber-500 fill-amber-500" />
                                {streak} Day Streak
                            </Badge>
                            <Badge variant="outline" className="px-3 py-1 bg-yellow-500/10 text-yellow-600 border-yellow-200 dark:border-yellow-900">
                                <Trophy className="w-4 h-4 mr-1 text-yellow-500" />
                                Level {level}
                            </Badge>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>XP Progress</span>
                            <span className="font-medium text-foreground">{currentXP} / {xpForNextLevel} XP</span>
                        </div>
                        <Progress value={xpProgress} className="h-2" />
                    </div>
                </div>
            </div>
        </div>
    );
}
