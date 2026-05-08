"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, ShieldCheck, CheckCircle2, ArrowRight, Server } from "lucide-react"
import { adminLogin } from "@/config/api"
import { useAuth } from "@/context/AuthContext"

export default function AdminLoginPage() {
    const router = useRouter()
    const { login: authLogin } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [successMsg, setSuccessMsg] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccessMsg(null)
        setIsLoading(true)

        try {
            const data = await adminLogin(formData.email, formData.password)
            
            setSuccessMsg("Authentication successful. Redirecting...")
            
            // Success: Store token using AuthContext
            setTimeout(() => {
                authLogin(data.access_token, "admin", data.refresh_token)
                router.push("/dashboard/admin")
            }, 800)
            
        } catch (err: any) {
            console.error("Login failed:", err)
            setError(err.response?.data?.detail || "Invalid Admin Credentials")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="w-full max-w-[540px] perspective-1000">
            <div className="glass rounded-[2rem] shadow-2xl border border-white/20 p-8 md:p-12 space-y-8 animate-in fade-in zoom-in-95 duration-700 relative overflow-hidden">
                
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -ml-16 -mb-16" />

                {/* Header */}
                <div className="text-center space-y-3 relative">
                    <div className="inline-flex items-center justify-center p-4 bg-linear-to-tr from-indigo-600 to-blue-500 rounded-2xl shadow-xl shadow-indigo-500/20 mb-2 animate-bounce-slow">
                        <ShieldCheck className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Super Admin</h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <Server className="w-3 h-3 text-indigo-500" />
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Secure Infrastructure Access</p>
                        </div>
                    </div>
                </div>

                {successMsg && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-4 rounded-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-4 duration-300">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-bold">{successMsg}</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-4 rounded-2xl flex items-center gap-3 text-sm animate-in slide-in-from-top-4 duration-300">
                        <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 text-white" />
                        </div>
                        <p className="font-bold">{error}</p>
                    </div>
                )}

                <form className="space-y-6 relative" onSubmit={handleSubmit}>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">Work Email</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 transition-all focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder:text-slate-400"
                                    placeholder="Enter admin identifier"
                                    value={formData.email}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Access Key</label>
                                <Link href="#" className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider">
                                    Recovery
                                </Link>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-4 h-5 w-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    required
                                    className="w-full pl-12 pr-12 py-4 bg-white/50 border border-slate-200 rounded-2xl text-[15px] font-semibold text-slate-900 transition-all focus:outline-none focus:bg-white focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 placeholder:text-slate-400"
                                    placeholder="••••••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold py-4.5 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <span>Initialize Access</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="pt-4">
                    <div className="flex items-center justify-center gap-4 text-slate-400">
                        <div className="h-px flex-1 bg-linear-to-r from-transparent to-slate-200"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-center whitespace-nowrap">
                            Authorized Personnel Only
                        </p>
                        <div className="h-px flex-1 bg-linear-to-l from-transparent to-slate-200"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
