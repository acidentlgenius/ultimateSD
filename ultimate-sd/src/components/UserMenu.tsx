"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { User } from "next-auth"
import { Button } from "@/components/ui/button"
import { LogOut, User as UserIcon, ChevronDown, Settings, ShieldAlert, Sparkles } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserMenuProps {
    user?: User & { role?: string }
}

export function UserMenu({ user }: UserMenuProps) {
    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" aria-label="User menu" title="User menu" className="relative h-9 w-9 rounded-full ring-offset-background hover:bg-muted/50 focus:ring-2 focus:ring-primary/20 transition-all p-0 overflow-hidden">
                        <Avatar className="h-9 w-9 border border-border/50">
                            <AvatarImage src={user.image || ""} alt={user.name || ""} />
                            <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                {user.name?.slice(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                                {user.email}
                            </p>
                        </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {user.role === "ADMIN" && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin" className="cursor-pointer">
                                <ShieldAlert className="mr-2 h-4 w-4" />
                                <span>Admin Panel</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                        <Link href="/profile" className="cursor-pointer">
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/settings" className="cursor-pointer">
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href="/whats-new" className="cursor-pointer">
                            <Sparkles className="mr-2 h-4 w-4" />
                            <span>What&apos;s New</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/20 cursor-pointer"
                        onClick={() => signOut({ callbackUrl: "/" })}
                    >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex hover:bg-primary/10 hover:text-primary transition-colors">
                <Link href="/login">Sign in</Link>
            </Button>
            {/* Primary auth CTA stays visible on mobile — it must not live only inside the hamburger. */}
            <Button size="sm" asChild className="bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white shadow-md hover:shadow-lg transition-all border-0">
                <Link href="/signup">Get Started</Link>
            </Button>
        </div>
    )
}
