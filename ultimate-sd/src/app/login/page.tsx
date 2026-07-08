"use client"

import { Suspense, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get("callbackUrl") ?? "/"
    const verified = searchParams.get("verified") === "1"
    const verificationError = searchParams.get("error")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [successMessage, setSuccessMessage] = useState(
        verified ? "Email verified successfully. You can sign in now." : ""
    )
    const [resendMessage, setResendMessage] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isResending, setIsResending] = useState(false)

    const handleResendVerification = async () => {
        if (!email) {
            setResendMessage("Enter your email address first.")
            return
        }

        setResendMessage("")
        setIsResending(true)

        try {
            const res = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, callbackUrl: callbackUrl !== "/" ? callbackUrl : undefined }),
            })
            const data = await res.json()
            setResendMessage(data.message || "Verification email sent.")
        } catch {
            setResendMessage("Failed to resend verification email.")
        } finally {
            setIsResending(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            })

            if (result?.error) {
                setError("Invalid email or password. If you haven't verified your email yet, check your inbox or resend the link below.")
                setIsLoading(false)
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (err) {
            setError("An error occurred during login")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-pink-500/30 blur-3xl" />
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] animate-pulse" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
                </div>

                <div className="relative z-10 text-white max-w-lg space-y-6">
                    <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium border border-white/20 mb-4 animate-fade-in">
                        System Design Practice
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight animate-slide-up">
                        Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Craft</span>
                    </h1>
                    <p className="text-lg text-slate-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Practice system design with interactive simulations, structured problems, and AI feedback.
                    </p>

                    <div className="pt-8 space-y-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="flex items-center space-x-4 p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-semibold">Interactive Practice</h3>
                                <p className="text-sm text-slate-400">Real-time collaboration tools</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
                <div className="absolute top-0 right-0 p-8">
                    <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Back to Home</Link>
                </div>

                <div className="w-full max-w-sm space-y-8 animate-fade-in">
                    <div className="text-center space-y-2">
                        <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Sign in to continue practicing system design problems
                        </p>
                    </div>

                    <div className="glass-card p-8 border border-border/50 bg-card/50 backdrop-blur-xl">
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

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="password" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Password
                                    </label>
                                    <Link href="/forgot-password" className="text-sm font-medium text-primary hover:text-primary/80">
                                        Forgot password?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="bg-background/50"
                                />
                            </div>

                            {successMessage && (
                                <div className="p-3 text-sm text-green-700 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900/50">
                                    {successMessage}
                                </div>
                            )}

                            {verificationError === "invalid_token" && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/50">
                                    This verification link is invalid or has expired. Request a new one below.
                                </div>
                            )}

                            {verificationError === "verification_failed" && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/50">
                                    We couldn't verify your email. Please try again or contact support.
                                </div>
                            )}

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-900/50">
                                    {error}
                                </div>
                            )}

                            {(error || verificationError === "invalid_token") && (
                                <div className="space-y-2">
                                    {resendMessage && (
                                        <div className="p-3 text-sm text-muted-foreground bg-muted/50 rounded-md border border-border">
                                            {resendMessage}
                                        </div>
                                    )}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full"
                                        disabled={isResending}
                                        onClick={handleResendVerification}
                                    >
                                        {isResending ? "Sending..." : "Resend verification email"}
                                    </Button>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                variant="default"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Signing in...</span>
                                    </div>
                                ) : (
                                    "Sign in"
                                )}
                            </Button>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            type="button"
                            className="w-full"
                            onClick={() => signIn("google", { callbackUrl })}
                        >
                            <svg className="mr-2 h-4 w-4" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
                            </svg>
                            Google
                        </Button>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-muted-foreground">
                                Don't have an account?{' '}
                                <Link href={`/signup${callbackUrl !== '/' ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`} className="font-semibold text-primary hover:text-primary/80 transition-colors">
                                    Sign up
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
