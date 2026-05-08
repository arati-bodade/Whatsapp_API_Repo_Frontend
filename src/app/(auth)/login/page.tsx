"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, CheckCircle, Briefcase, UserCheck, ShieldCheck, Zap, Globe, ArrowRight } from "lucide-react"
import resellerService from "@/services/resellerService"
import businessService from "@/services/businessService"
import { useAuth } from "@/context/AuthContext"

function LoginPageContent() {
    const router = useRouter()
    const { login: authLogin } = useAuth()
    const searchParams = useSearchParams()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [loginType, setLoginType] = useState<"reseller" | "business">("reseller")

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const [emailError, setEmailError] = useState<string | null>(null)

    useEffect(() => {
        if (searchParams.get("registered") === "true") {
            setSuccessMessage("Registration successful! Please sign in.")
        }
        const type = searchParams.get("type")
        if (type === "reseller" || type === "business") {
            setLoginType(type)
        }
    }, [searchParams])

    const validateEmailFormat = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setEmailError(null)
        setSuccessMessage(null)

        if (!validateEmailFormat(formData.email)) {
            setEmailError("Invalid email format")
            return
        }

        setIsLoading(true)

        try {
            let data;
            if (loginType === "reseller") {
                data = await resellerService.login(formData)
                authLogin(data.access_token, data.reseller.role, data.refresh_token)
                router.push("/dashboard/reseller/analytics")
            } else {
                data = await businessService.login(formData)
                authLogin(data.access_token, data.busi_user.role, data.refresh_token)
                router.push("/dashboard/user")
            }
        } catch (err: any) {
            if (err.response) {
                const status = err.response.status
                const errorMessage = err.response.data?.detail || "Invalid email or password."
                
                if (status === 404) {
                    setError(`${loginType === "reseller" ? "Reseller" : "User"} not found.`)
                } else if (status === 401) {
                    setError("Incorrect password. Please try again.")
                } else {
                    setError(errorMessage || "Login failed.")
                }
            } else {
                setError("Network error. Please try again.")
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-[#0F172A]">
            
            {/* Left Side: Cinematic Branding (60%) */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="hidden lg:flex lg:w-[60%] relative overflow-hidden flex-col justify-between p-12 bg-black"
            >
                {/* Background Image with Cinematic Ken Burns Effect */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <motion.img 
                        src="/images/login-hero.png" 
                        alt="Hero" 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            x: [0, -20, 0],
                            y: [0, 10, 0]
                        }}
                        transition={{ 
                            duration: 30, 
                            repeat: Infinity, 
                            ease: "linear" 
                        }}
                        className="w-full h-full object-cover opacity-60"
                    />
                    {/* Multi-layered Gradients for Depth */}
                    <div className="absolute inset-0 bg-linear-to-tr from-[#0F172A] via-[#0F172A]/50 to-transparent z-10" />
                    <div className="absolute inset-0 bg-linear-to-b from-transparent via-[#0F172A]/20 to-[#0F172A] z-10" />
                    
                    {/* Animated Light Particles */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0 }}
                                animate={{ 
                                    opacity: [0, 0.3, 0],
                                    y: [-100, 100],
                                    x: [0, (i % 2 === 0 ? 50 : -50)]
                                }}
                                transition={{
                                    duration: 10 + i * 2,
                                    repeat: Infinity,
                                    delay: i * 1.5,
                                    ease: "linear"
                                }}
                                className="absolute w-1 h-1 bg-emerald-400 rounded-full blur-xs"
                                style={{
                                    left: `${10 + i * 15}%`,
                                    top: "20%"
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Top Logo Section */}
                <div className="relative z-30">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-center gap-3"
                    >
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-white tracking-[0.2em] uppercase leading-tight">WhatsApp API</p>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Enterprise SaaS</p>
                        </div>
                    </motion.div>
                </div>

                {/* Bottom Content & Stats Section */}
                <div className="relative z-30 space-y-12">
                    <div className="max-w-xl">
                        <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-[10px] font-black text-white/60 tracking-widest uppercase mb-4"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Next Gen Infrastructure
                        </motion.span>
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="text-6xl font-black text-white tracking-tighter leading-[0.95]"
                        >
                            Powering Global <br />
                            <span className="text-emerald-400">Automation.</span>
                        </motion.h2>
                    </div>

                    {/* Stats Footer */}
                    <div className="flex items-center justify-between">
                        {[
                            { label: "Uptime SLA", val: "99.9%", icon: ShieldCheck },
                            { label: "Daily Reach", val: "1M+", icon: Globe },
                            { label: "Support", val: "24/7", icon: Zap }
                        ].map((stat, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.8 + (i * 0.1) }}
                                className="space-y-1"
                            >
                                <p className="text-2xl font-black text-white">{stat.val}</p>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{stat.label}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Right Side: Sign In Form (40%) */}
            <div className="w-full lg:w-[40%] h-full flex items-center justify-center p-8 bg-[#0F172A] relative">
                
                {/* Decorative glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-full max-w-[480px] z-10"
                >
                    <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-10 shadow-2xl relative overflow-hidden group">
                        
                        {/* Internal decorative line */}
                        <div className="absolute top-0 left-10 w-12 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_20px_rgba(16,185,129,0.5)]" />

                        <div className="mb-10">
                            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Sign in</h1>
                            <p className="text-white/40 text-sm font-medium">Enter your credentials to access your futuristic automation workspace.</p>
                        </div>

                        {/* Login Type Toggle */}
                        <div className="flex bg-white/5 p-1 rounded-2xl mb-8 border border-white/5 relative">
                            <button
                                onClick={() => setLoginType("reseller")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 z-10 ${
                                    loginType === "reseller" ? "text-white" : "text-white/40 hover:text-white/60"
                                }`}
                            >
                                <Briefcase className="w-4 h-4" /> RESELLER
                            </button>
                            <button
                                onClick={() => setLoginType("business")}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all duration-300 z-10 ${
                                    loginType === "business" ? "text-white" : "text-white/40 hover:text-white/60"
                                }`}
                            >
                                <UserCheck className="w-4 h-4" /> USER
                            </button>
                            
                            {/* Animated Background Slider */}
                            <motion.div 
                                className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-emerald-500 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                animate={{ x: loginType === "reseller" ? 0 : "100%" }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            />
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* Feedback Messages */}
                            <AnimatePresence mode="wait">
                                {(error || successMessage) && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className={`rounded-2xl p-4 flex items-center gap-3 border ${
                                            error ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                        }`}
                                    >
                                        {error ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle className="w-4 h-4 shrink-0" />}
                                        <p className="text-xs font-bold uppercase tracking-wide">{error || successMessage}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type="text"
                                        placeholder="test.user01@gmail.com"
                                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-[1.25rem] text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-bold text-sm"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-emerald-500 transition-colors" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/5 rounded-[1.25rem] text-white placeholder:text-white/10 focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.08] transition-all font-bold text-sm"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 focus:outline-none transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input type="checkbox" className="peer sr-only" />
                                        <div className="w-5 h-5 border-2 border-white/10 rounded-lg peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all shadow-[0_0_10px_rgba(16,185,129,0)] peer-checked:shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                        <CheckCircle className="absolute w-3.5 h-3.5 text-white top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                                    </div>
                                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest group-hover:text-white/60 transition-colors">Remember me</span>
                                </label>
                                <Link href="/forgot-password" className="text-[10px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest">
                                    Forgot password?
                                </Link>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-emerald-500 hover:bg-emerald-400 text-[#0F172A] font-black py-4 rounded-[1.25rem] shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2 mt-4 text-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Access Dashboard"
                                )}
                            </button>
                        </form>

                        <div className="mt-8 pt-8 border-t border-white/5 text-center">
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Now to the platform?</p>
                            <Link href="/register-user" className="text-[11px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center justify-center gap-1.5 group">
                                Create enterprise account <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Corner Logo/Icon */}
                <div className="absolute bottom-10 right-10 opacity-20">
                    <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center font-black text-white text-[10px]">N</div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-[#0F172A]">
                <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <LoginPageContent />
        </Suspense>
    )
}
