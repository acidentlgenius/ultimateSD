'use client'

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setMessage("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.message || "An error occurred")
            } else {
                setMessage(data.message || "Password reset link sent to your email.")
            }
        } catch (err) {
            setError("An error occurred while sending the reset link.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-8 bg-background">
            <div className="w-full max-w-sm space-y-8 animate-fade-in">
                <div className="text-center space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Reset Password</h2>
                    <p className="text-muted-foreground">
                        Enter your email to receive a password reset link
                    </p>
                </div>

                <div className="glass-card p-8 border border-border/50 bg-card/50 backdrop-blur-xl">
                    {message ? (
                        <div className="space-y-4">
                            <div className="p-3 text-sm text-green-600 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900/50">
                                {message}
                            </div>
                            <Button asChild className="w-full" variant="outline">
                                <Link href="/login">Back to Sign In</Link>
                            </Button>
                        </div>
                    ) : (
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
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
                                {isLoading ? "Sending..." : "Send Reset Link"}
                            </Button>

                            <div className="mt-4 text-center text-sm">
                                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                                    Back to Sign In
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    )
}
