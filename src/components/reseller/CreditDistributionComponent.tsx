"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import creditService, { CreditDistribution } from "@/services/creditService"
import resellerService, { ResellerProfile } from "@/services/resellerService"
import { Loader2, Send, History, AlertCircle, CheckCircle2 } from "lucide-react"
import { usePlanStatus } from "@/hooks/usePlanStatus"

interface CreditDistributionComponentProps {
    preSelectedUser?: {
        id: string;
        name: string;
        business_name: string;
    } | null;
}

export default function CreditDistributionComponent({ preSelectedUser }: CreditDistributionComponentProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [resellerProfile, setResellerProfile] = useState<ResellerProfile | null>(null)
    const [history, setHistory] = useState<CreditDistribution[]>([])
    const [businessUsers, setBusinessUsers] = useState<any[]>([])

    // Form State
    const [selectedBusinessId, setSelectedBusinessId] = useState(preSelectedUser?.id || "")
    const [amount, setAmount] = useState("")
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const { isValid, refreshPlanStatus } = usePlanStatus()

    useEffect(() => {
        if (preSelectedUser?.id) {
            setSelectedBusinessId(preSelectedUser.id)
        }
    }, [preSelectedUser])

    const fetchData = async () => {
        setIsLoading(true)
        setMessage(null)
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                // In a component, maybe we don't redirect hard, but for now it's fine
                window.location.href = "/login"
                return
            }

            const profile = await resellerService.getProfile(token)
            setResellerProfile(profile)

            const users = await creditService.getMyBusinessUsers(token)
            setBusinessUsers(users)

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
    }, [])

    const handleDistribute = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!selectedBusinessId || !amount) {
            setMessage({ type: 'error', text: "Please select a user and enter amount." })
            return
        }

        // NEW: Check if reseller has credits to share (using hooks status)
        if (!isValid) {
            setMessage({ type: 'error', text: "Your reseller account is restricted. Please purchase credits first." })
            return
        }

        const credits = parseInt(amount)
        if (isNaN(credits) || credits <= 0) {
            setMessage({ type: 'error', text: "Please enter a valid positive number of credits." })
            return
        }

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
            // We might keep the selected user if it's preSelected mode, or clear it.
            // Requirement said "pre-filled based on the row clicked", doesn't explicitly need clearing if modal stays open?
            // But usually modal closes or user stays.
            // If I clear selection, it might be confusing if they want to distribute again to same user.
            // I will keep selected user but clear amount.
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
            <div className="flex items-center justify-center p-8 min-h-[300px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Top Stats Bar */}
            <div className="flex items-center justify-between bg-secondary/50 p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em]">Available Balance</span>
                    <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-bold text-blue-600">
                            {resellerProfile?.wallet?.available_credits ?? 0}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">credits</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.14em]">Total Distributed</span>
                    <div className="flex justify-end items-baseline gap-1 mt-1">
                        <span className="text-2xl font-bold text-foreground">
                            {resellerProfile?.wallet?.used_credits ?? 0}
                        </span>
                        <span className="text-xs text-muted-foreground font-semibold">credits</span>
                    </div>
                </div>
            </div>

            {/* Distribution Form */}
            <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <Send className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-bold text-foreground">Share Credits</h3>
                </div>

                {message && (
                    <div className={`p-3 rounded-lg flex items-center gap-2.5 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                        {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleDistribute} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight pl-1">Business User</label>
                        {preSelectedUser ? (
                            <div className="w-full h-11 px-4 border border-border rounded-xl bg-secondary/50 flex items-center text-sm text-foreground cursor-not-allowed">
                                <span className="font-bold mr-2">{preSelectedUser.business_name || "Unknown Business"}</span>
                                <span className="text-muted-foreground text-xs">({preSelectedUser.name})</span>
                            </div>
                        ) : (
                            <select
                                value={selectedBusinessId}
                                onChange={(e) => setSelectedBusinessId(e.target.value)}
                                className="w-full h-11 px-4 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm transition-all"
                                required
                            >
                                <option value="" className="bg-card text-foreground">Select a business user...</option>
                                {businessUsers.map((user: any) => (
                                    <option key={user.busi_user_id} value={user.busi_user_id} className="bg-card text-foreground">
                                        {user.business?.business_name || user.profile?.name} ({user.profile?.email})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight pl-1">Amount to Distribute</label>
                        <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full h-11 px-4 border border-border bg-background text-foreground rounded-xl focus:ring-2 focus:ring-blue-500/30 outline-none text-sm transition-all font-semibold"
                            placeholder="e.g. 500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
                    >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        Distribute Credits
                    </button>
                </form>
            </div>

            {/* History */}
            <div className="bg-card text-card-foreground p-6 rounded-2xl border border-border shadow-sm space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-border">
                    <History className="w-5 h-5 text-muted-foreground" />
                    <h3 className="text-lg font-bold text-foreground">Recent Transactions</h3>
                </div>
 
                <div className="rounded-xl overflow-hidden border border-border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-secondary/70 text-[10px] uppercase text-muted-foreground font-bold tracking-widest border-b border-border">
                            <tr>
                                <th className="px-5 py-4">Date</th>
                                <th className="px-5 py-4">Recipient</th>
                                <th className="px-5 py-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border bg-transparent">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-5 py-10 text-center text-muted-foreground italic text-xs">
                                        No recent distributions found
                                    </td>
                                </tr>
                            ) : (
                                history.slice(0, 5).map((item) => (
                                    <tr key={item.distribution_id} className="hover:bg-secondary/30 transition-colors">
                                        <td className="px-5 py-4 text-muted-foreground whitespace-nowrap text-xs">
                                            {new Date(item.shared_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </td>
                                        <td className="px-5 py-4 text-foreground font-bold truncate max-w-[140px]" title={item.to_business_name}>
                                            {item.to_business_name || "Unknown"}
                                        </td>
                                        <td className="px-5 py-4 text-right font-black text-green-600 text-sm">
                                            +{item.credits_shared}
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
