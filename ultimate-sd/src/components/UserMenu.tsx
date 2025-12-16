"use client"

import Link from "next/link"
import { signOut } from "next-auth/react"
import { User } from "next-auth"
import { Button } from "@/components/ui/button"
import { LogOut, User as UserIcon } from "lucide-react"

interface UserMenuProps {
    user?: User
}

export function UserMenu({ user }: UserMenuProps) {
    if (user) {
        return (
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <UserIcon className="h-4 w-4" />
                    <span>{user.name || user.email}</span>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => signOut({ callbackUrl: "/" })}
                >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign out
                </Button>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
            </Button>
        </div>
    )
}
