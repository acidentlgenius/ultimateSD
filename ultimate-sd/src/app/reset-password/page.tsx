'use client'

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Suspense } from "react"

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token")

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!token) {
            setError("Invalid or missing password reset token.")
        }
    }, [token])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/reset-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.message || "An error occurred")
            } else {
                setMessage(data.message || "Password reset successfully.")
                setTimeout(() => {
                    router.push("/login")
                }, 3000)
            }
        } catch (err) {
            setError("An error occurred during password reset.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!token) {
        return (
             <div className="flex min-h-screen items-center justify-center p-8 bg-background">
                <div className="w-full max-w-sm space-y-8 animate-fade-in text-center">
                     <h2 className="text-3xl font-bold tracking-tight">Invalid Token</h2>
                     <p className="text-red-500">{error}</p>
                     <Button asChild className="w-full" variant="outline">
                         <Link href="/login">Back to Sign In</Link>
                     </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-background">
            <div className="w-full max-w-sm space-y-8 animate-fade-in">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Set New Password</h2>
                    <p className="text-muted-foreground">
                        Enter your new password below
                    </p>
                </div>

                <div className="glass-card p-8 border border-border/50 bg-card/50 backdrop-blur-xl">
                    {message ? (
                        <div className="space-y-4">
                            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900/50">
                                {message}
                            </div>
                            <p className="text-sm text-muted-foreground text-center">Redirecting to login...</p>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    New Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Confirm New Password
                                </label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="bg-background/50"
                                />
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/50">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                variant="default"
                                disabled={isLoading}
                            >
                                {isLoading ? "Resetting..." : "Reset Password"}
                            </Button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    )
}
