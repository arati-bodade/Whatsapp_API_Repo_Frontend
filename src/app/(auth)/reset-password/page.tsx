"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Lock, ArrowLeft, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react"
import userService from "@/services/userService"

function ResetPasswordContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const tokenFromUrl = searchParams.get("token")
    
    const [token, setToken] = useState(tokenFromUrl || "")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({})

    useEffect(() => {
        if (tokenFromUrl) {
            setToken(tokenFromUrl)
        }
    }, [tokenFromUrl])

    const validatePassword = (password: string) => {
        if (password.length < 8) return "Password must be at least 8 characters"
        if (!/(?=.*[a-z])/.test(password)) return "Password must contain at least one lowercase letter"
        if (!/(?=.*[A-Z])/.test(password)) return "Password must contain at least one uppercase letter"
        if (!/(?=.*\d)/.test(password)) return "Password must contain at least one number"
        if (!/(?=.*[@$!%*?&])/.test(password)) return "Password must contain at least one special character"
        return ""
    }

    const validateForm = () => {
        const errors: { [key: string]: string } = {}
        
        if (!token) {
            errors.token = "Reset token is required"
        }
        
        const passwordError = validatePassword(newPassword)
        if (passwordError) {
            errors.password = passwordError
        }
        
        if (newPassword !== confirmPassword) {
            errors.confirmPassword = "Passwords do not match"
        }
        
        setFieldErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        
        if (!validateForm()) {
            setError("Please fix the validation errors before submitting")
            return
        }
        
        setIsLoading(true)

        try {
            await userService.resetPassword(token, newPassword)
            setSuccess(true)
        } catch (err: any) {
            console.error("Password reset error:", err)
            setError(err.response?.data?.detail || "Failed to reset password. The token may be invalid or expired.")
        } finally {
            setIsLoading(false)
        }
    }

    if (success) {
        return (
            <div className="w-full max-w-[440px] flex flex-col items-center">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-500/30">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">Password Reset Successful</h1>
                    <p className="text-muted-foreground">
                        Your password has been successfully reset.
                    </p>
                </div>

                <div className="w-full bg-card rounded-[2rem] shadow-2xl border border-border p-8">
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground text-center">
                            You can now sign in with your new password.
                        </p>
                        <div className="pt-4">
                            <Link
                                href="/login"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Go to Login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full max-w-[440px] flex flex-col items-center">
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/30">
                    <Lock className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Reset Your Password</h1>
                <p className="text-muted-foreground">
                    Enter your new password below.
                </p>
            </div>

            <div className="w-full bg-card rounded-[2rem] shadow-2xl border border-border p-8">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">New Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter new password"
                                className={`w-full pl-11 pr-12 py-3.5 bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium ${fieldErrors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value)
                                    if (fieldErrors.password) {
                                        setFieldErrors({ ...fieldErrors, password: '' })
                                    }
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {fieldErrors.password && (
                            <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.password}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest ml-1">Confirm Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground group-focus-within:text-blue-600 transition-colors" />
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Confirm new password"
                                className={`w-full pl-11 pr-12 py-3.5 bg-background border border-border rounded-2xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all font-medium ${fieldErrors.confirmPassword ? 'border-red-500 focus:border-red-500' : ''}`}
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    if (fieldErrors.confirmPassword) {
                                        setFieldErrors({ ...fieldErrors, confirmPassword: '' })
                                    }
                                }}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="h-5 w-5" />
                                ) : (
                                    <Eye className="h-5 w-5" />
                                )}
                            </button>
                        </div>
                        {fieldErrors.confirmPassword && (
                            <p className="text-xs text-red-500 mt-1 ml-1">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 mt-4"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Resetting...
                            </>
                        ) : (
                            "Reset Password"
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <Link
                        href="/login"
                        className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-blue-50 to-indigo-100">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    )
}
