"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignupPage() {
    const router = useRouter()
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const res = await fetch("/api/auth/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            })

            if (res.ok) {
                router.push("/login")
            } else {
                const data = await res.json()
                setError(data.message || "Something went wrong")
                setIsLoading(false)
            }
        } catch (err) {
            setError("An error occurred during signup")
            setIsLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full">
            {/* Left Side - Visuals */}
            <div className="hidden lg:flex w-1/2 bg-slate-900 relative overflow-hidden items-center justify-center p-12">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/40 via-blue-900/40 to-slate-900/40" />
                    <div className="absolute top-1/3 right-1/4 w-72 h-72 bg-pink-600/20 rounded-full blur-[80px] animate-pulse" />
                    <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '2s' }} />
                </div>

                <div className="relative z-10 text-white max-w-lg space-y-6">
                    <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-sm font-medium border border-white/20 mb-4 animate-fade-in">
                        Join the Community
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight animate-slide-up">
                        Design Better <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-indigo-400">Systems</span>
                    </h1>
                    <p className="text-lg text-slate-300 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        Create, share, and learn from a vast library of system design templates and interactive guides.
                    </p>

                    <div className="grid grid-cols-2 gap-4 pt-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div className="p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-pink-500/20 flex items-center justify-center text-pink-400 mb-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                            </div>
                            <h3 className="font-semibold text-sm">AI Assistance</h3>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-colors">
                            <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <h3 className="font-semibold text-sm">Verified Solutions</h3>
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
                        <h2 className="text-3xl font-bold tracking-tight">Create an account</h2>
                        <p className="text-muted-foreground">
                            Get started with your account today
                        </p>
                    </div>

                    <div className="glass-card p-8 border border-border/50 bg-card/50 backdrop-blur-xl">
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium leading-none">
                                    Full Name
                                </label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="bg-background/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium leading-none">
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
                                <label htmlFor="password" className="text-sm font-medium leading-none">
                                    Password
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
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Creating account...</span>
                                    </div>
                                ) : (
                                    "Sign up"
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/login" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
