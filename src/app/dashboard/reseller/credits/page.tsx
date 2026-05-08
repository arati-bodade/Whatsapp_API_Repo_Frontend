"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import creditService, { CreditDistribution } from "@/services/creditService"
import resellerService, { ResellerProfile } from "@/services/resellerService"
import { Loader2, Send, History, RefreshCcw, AlertCircle, CheckCircle2 } from "lucide-react"

export default function CreditDistributionPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null)
    const [history, setHistory] = useState<CreditDistribution[]>([])
    const [businessUsers, setBusinessUsers] = useState<any[]>([])

    // Form State
    const [selectedBusinessId, setSelectedBusinessId] = useState("")
    const [amount, setAmount] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        setMessage(null)
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            // 1. Get Reseller Profile (for balance)
            const profile = await resellerService.getProfile(token)
            setResellerProfile(profile)

            // 2. Get Business Users (for dropdown)
            // We need a specific endpoint to list MY business users for dropdown
            // If creditService.getMyBusinessUsers isn't implemented optimally, we fallback or ensure it works.
            // Let's assume we implemented it in creditService as a wrapper to business endpoint
            const users = await creditService.getMyBusinessUsers(token)
            setBusinessUsers(users)

            // 3. Get History
            // Assuming reseller ID is in token, so we just pass token
            // We need the reseller ID for the query? 
            // The service method `getResellerHistory` typically uses just token if backend supports it. 
            // Our implementation of getResellerHistory in frontend service might have asked for ID.
            // Let's check creditService.ts implementation we just wrote.
            // getResellerHistory(reseller_id, token, ...)
            // We need reseller_id. We have it from profile fetch!

            // Wait, profile fetch might be after this? No, we await it.
            // Actually, let's look at profile object.
            // profile.user_id should be there.

            if (profile && profile.user_id) {
                const hist = await creditService.getResellerHistory(profile.user_id, token)
                setHistory(hist)
            }

        } catch (error: any) {
            console.error("Error loading data", error)
            setMessage({ type: 'error', text: "Failed to load data. Please try refreshing." })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [router])

    const handleDistribute = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBusinessId || !amount) {
            setMessage({ type: 'error', text: "Please select a user and enter amount." })
            return
        }

        const credits = parseInt(amount)
        if (isNaN(credits) || credits <= 0) {
            setMessage({ type: 'error', text: "Please enter a valid positive number of credits." })
            return
        }

        // Basic frontend validation
        if (resellerProfile?.wallet?.available_credits !== undefined && credits > resellerProfile.wallet.available_credits) {
            setMessage({ type: 'error', text: "Insufficient available credits." })
            return
        }

        setIsSubmitting(true)
        setMessage(null)
        try {
            const token = localStorage.getItem("token")
            if (!token) throw new Error("No token")

            await creditService.distributeCredits({
                to_business_user_id: selectedBusinessId,
                credits_shared: credits
            }, token)

            setMessage({ type: 'success', text: "Credits distributed successfully!" })
            setAmount("")
            setSelectedBusinessId("")

            // Refresh data to show new balance and history
            await fetchData()

        } catch (error: any) {
            console.error(error)
            const errorMsg = error.response?.data?.detail || "Failed to distribute credits."
            setMessage({ type: 'error', text: errorMsg })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading && !resellerProfile) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <RefreshCcw className="w-6 h-6" /> Credit Distribution
            </h1>

            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Balance Card */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Your Available Credits</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-blue-600">
                            {Math.round(resellerProfile?.wallet?.available_credits ?? 0)}
                        </span>
                        <span className="text-gray-400 text-sm">credits</span>
                    </div>
                </div>

                {/* Total Distributed Card (Optional, maybe specific endpoint later) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Distributed</h3>
                    <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-800">
                            {Math.round(resellerProfile?.wallet?.used_credits ?? 0)}
                        </span>
                        <span className="text-gray-400 text-sm">credits</span>
                    </div>
                </div>
            </div>

            {/* Distribution Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Send className="w-5 h-5 text-blue-600" /> Share Credits
                    </h2>
                </div>
                <div className="p-6">
                    {message && (
                        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleDistribute} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Select Business User</label>
                            <select
                                value={selectedBusinessId}
                                onChange={(e) => setSelectedBusinessId(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                                required
                            >
                                <option value="">Select a user...</option>
                                {businessUsers.map((user: any) => (
                                    <option key={user.busi_user_id} value={user.busi_user_id}>
                                        {user.business?.business_name || user.profile?.name || "Unknown Business"} ({user.profile?.email || user.email})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Amount to Share</label>
                            <input
                                type="number"
                                min="1"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Enter credits..."
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            Distribute Credits
                        </button>
                    </form>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <History className="w-5 h-5 text-gray-600" /> Recent Distributions
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">To Business</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Credits Shared</th>
                                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Distribution ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-gray-500">
                                        No distributions found. Start sharing credits!
                                    </td>
                                </tr>
                            ) : (
                                history.map((item) => (
                                    <tr key={item.distribution_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4 text-sm text-gray-600">
                                            {new Date(item.shared_at).toLocaleString()}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{item.to_business_name || "Unknown Business"}</div>
                                            <div className="text-xs text-gray-500">{item.to_business_user_id}</div>
                                        </td>
                                        <td className="p-4 text-sm font-semibold text-green-600 text-right">
                                            +{item.credits_shared}
                                        </td>
                                        <td className="p-4 text-xs text-gray-400 font-mono text-right">
                                            {item.distribution_id}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    )
}
