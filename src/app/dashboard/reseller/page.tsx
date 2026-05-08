"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
    Loader2, 
    Wallet, 
    TrendingUp, 
    ShieldCheck, 
    LogOut, 
    AlertTriangle,
    CheckCircle2
} from "lucide-react"
import resellerService, { ResellerProfile } from "@/services/resellerService"
import userService, { UserAnalytics, BusinessUser } from "@/services/userService"
import creditService, { CreditDistribution } from "@/services/creditService"
import { 
    Dialog, 
    DialogContent 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ResellerDashboardData {
    profile: ResellerProfile;
    wallet: {
        total_credits: number;
        available_credits: number;
        used_credits: number;
    };
    role: string;
}

export default function ResellerDashboard() {
    const router = useRouter()
    const [data, setData] = useState<ResellerDashboardData | null>(null)
    const [analytics, setAnalytics] = useState<UserAnalytics | null>(null)
    const [topUsers, setTopUsers] = useState<BusinessUser[]>([])
    const [transactions, setTransactions] = useState<CreditDistribution[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchAllData = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            const profileData = await resellerService.getProfile(token)
            let initialAnalytics: any = null;
            
            try {
                const { analyticsService } = await import('@/services/analyticsService');
                if (profileData.reseller_id) {
                    const resellerAnalytics = await analyticsService.getResellerDashboard(profileData.reseller_id);
                    const normalizedData = {
                        ...profileData,
                        wallet: {
                            total_credits: resellerAnalytics.total_credits || profileData.wallet?.total_credits || 0,
                            used_credits: resellerAnalytics.used_credits || 0,
                            available_credits: resellerAnalytics.remaining_credits || profileData.wallet?.available_credits || 0
                        }
                    };
                    setData(normalizedData);
                    initialAnalytics = {
                        total_users: resellerAnalytics.business_users?.length || 0,
                        active_users: resellerAnalytics.business_users?.filter(u => u.credits_remaining > 0).length || 0,
                        inactive_users: resellerAnalytics.business_users?.filter(u => u.credits_remaining <= 0).length || 0,
                        messages_sent: resellerAnalytics.messages_sent || 0
                    };
                }
            } catch (e) {
                console.error("Analytics fallback", e)
                setData({ ...profileData, wallet: profileData.wallet || { total_credits: 0, available_credits: 0, used_credits: 0 } });
            }

            try {
                const userStats = await userService.getAnalytics(token);
                setAnalytics({ ...initialAnalytics, ...userStats });
            } catch (e) {
                if (initialAnalytics) setAnalytics(initialAnalytics);
            }

            const users = await userService.getMyUsers(token)
            setTopUsers([...users].sort((a, b) => b.wallet.credits_used - a.wallet.credits_used).slice(0, 5))

            if (profileData.user_id) {
                const history = await creditService.getResellerHistory(profileData.user_id, token, 0, 5)
                setTransactions(history)
            }
        } catch (err: any) {
            console.error("Dashboard error", err)
            setError("Failed to load dashboard data.")
            if (err.response?.status === 401) router.push("/login")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [router])

    const handleLogout = () => {
        localStorage.clear()
        router.push("/login")
    }

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500"><p>{error}</p></div>

    return (
        <div className="min-h-screen bg-slate-50 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Welcome, {data?.profile.name}</h1>
                        <p className="text-slate-500">{data?.profile.email} • <span className="uppercase text-xs font-black text-blue-600 tracking-widest">{data?.role}</span></p>
                    </div>
                    <Button variant="ghost" onClick={handleLogout} className="text-red-500 hover:bg-red-50 gap-2 font-bold">
                        <LogOut className="w-4 h-4" /> Sign Out
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-600 text-white p-6 rounded-3xl shadow-xl shadow-blue-500/20 relative overflow-hidden">
                        <Wallet className="absolute -right-4 -bottom-4 w-32 h-32 opacity-10 rotate-12" />
                        <p className="text-blue-100 font-bold text-xs uppercase tracking-widest mb-1">Total Credits</p>
                        <h3 className="text-4xl font-black">{Math.round(data?.wallet.total_credits ?? 0).toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 text-emerald-600 mb-2 font-bold text-xs uppercase tracking-widest">
                            <ShieldCheck className="w-4 h-4" /> Available Balance
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{Math.round(data?.wallet.available_credits ?? 0).toLocaleString()}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex items-center gap-3 text-purple-600 mb-2 font-bold text-xs uppercase tracking-widest">
                            <TrendingUp className="w-4 h-4" /> Credits Distributed
                        </div>
                        <h3 className="text-3xl font-black text-slate-900">{Math.round(data?.wallet.used_credits ?? 0).toLocaleString()}</h3>
                    </div>
                </div>


                {/* Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-50 pb-4">
                            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Top Sub-Users</h2>
                            <Button variant="ghost" onClick={() => router.push('/dashboard/reseller/users')} className="text-blue-600 font-black text-xs uppercase tracking-widest">View All</Button>
                        </div>
                        <div className="space-y-4">
                            {topUsers.map(user => (
                                <div key={user.busi_user_id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">{user.profile.name[0]}</div>
                                        <div>
                                            <p className="font-black text-slate-900 uppercase text-xs">{user.profile.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{user.business.business_name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-slate-900">{Math.round(user.wallet.credits_used).toLocaleString()}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Used</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6 border-b border-slate-50 pb-4">Recent Distributions</h2>
                        <div className="space-y-4">
                            {transactions.map(tx => (
                                <div key={tx.distribution_id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                                    <div>
                                        <p className="font-black text-slate-900 uppercase text-xs">{tx.to_business_name || "Allocation"}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(tx.shared_at).toLocaleDateString()}</p>
                                    </div>
                                    <p className="font-black text-emerald-600">+{Math.round(tx.credits_shared).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}
