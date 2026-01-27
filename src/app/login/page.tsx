"use client"

import { useActionState } from "react"
import { authenticate } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info, CarFront, Lock } from "lucide-react"

export default function LoginPage() {
    const [errorMessage, dispatch, isPending] = useActionState(authenticate, undefined)

    return (
        <div className="flex h-screen w-full relative overflow-hidden bg-slate-900">
            {/* Abstract Background Elements */}
            <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-3xl" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-3xl opacity-50" />

            <div className="w-full h-full z-10 flex flex-col md:flex-row">
                {/* Left Side: Branding / Hero */}
                <div className="hidden md:flex flex-1 flex-col justify-center px-16 relative">
                    <div className="z-10 space-y-6">
                        <div className="h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                            <CarFront className="h-10 w-10 text-white" />
                        </div>
                        <h1 className="text-5xl font-bold tracking-tight text-white leading-tight">
                            VMS <span className="text-blue-500">Application</span>
                        </h1>
                        <p className="text-lg text-slate-400 max-w-md">
                            ระบบบริหารจัดการรถยนต์สำนักวิศวกรรม
                        </p>
                    </div>
                </div>

                {/* Right Side: Login Form */}
                <div className="flex-1 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl">
                        <div className="mb-8 text-center">
                            <div className="inline-flex md:hidden h-12 w-12 bg-blue-600 rounded-xl items-center justify-center mb-4">
                                <CarFront className="h-6 w-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
                            <p className="text-slate-400 text-sm mt-1">Sign in to your authorized account</p>
                        </div>

                        <form action={dispatch} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-slate-200">Employee ID / Username</Label>
                                <div className="relative">
                                    <Input
                                        id="username"
                                        name="username"
                                        placeholder="01615"
                                        required
                                        className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 pl-10 h-10 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                                    />
                                    <div className="absolute left-3 top-3 text-slate-500">
                                        <CarFront className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-200">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 pl-10 h-10 border-0 focus-visible:ring-1 focus-visible:ring-blue-500"
                                    />
                                    <div className="absolute left-3 top-3 text-slate-500">
                                        <Lock className="h-4 w-4" />
                                    </div>
                                </div>
                            </div>

                            {errorMessage && (
                                <div className="flex items-center gap-2 p-3 text-sm text-red-200 bg-red-500/20 rounded-lg border border-red-500/20">
                                    <Info className="h-4 w-4 shrink-0" />
                                    <p>{errorMessage}</p>
                                </div>
                            )}

                            <Button type="submit" disabled={isPending} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium h-11 text-base shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]">
                                {isPending ? "Signing in..." : "Access Dashboard"}
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
