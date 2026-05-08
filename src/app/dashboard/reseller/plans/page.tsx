"use client"

import React, { useState } from "react"
import { LayoutGrid, Users, Wallet, Crown, Zap, List, Grid, TrendingDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { PlanCard, Plan as PlanTypeData } from "@/components/plans/PlanCard"
import { PlanTable } from "@/components/plans/PlanTable"
import { usePlans } from "@/hooks/usePlans"
import { usePlanStatus } from "@/hooks/usePlanStatus"
import { useRouter } from "next/navigation"
import creditService from "@/services/creditService"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

type PlanType = "all" | "reseller" | "user"

const overviewCards = [
    { id: "all", label: "Total Plans", icon: LayoutGrid, bg: "#EFF6FF", border: "#BFDBFE", text: "#1D4ED8", iconBg: "#DBEAFE" },
    { id: "reseller", label: "Reseller Plans", icon: Crown, bg: "#F5F3FF", border: "#DDD6FE", text: "#6D28D9", iconBg: "#EDE9FE" },
    { id: "price", label: "Avg Price", icon: TrendingDown, bg: "#FFFBEB", border: "#FDE68A", text: "#B45309", iconBg: "#FEF3C7", value: "₹0", noFilter: true },
]

export default function PlansPage() {
    const router = useRouter()
    const { plans, isLoading, error } = usePlans('ALL');
    const [viewMode, setViewMode] = useState<"card" | "table">("card")
    const [activePlanType, setActivePlanType] = useState<PlanType>("reseller")
    const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<any>(null)
    const [isChecking, setIsChecking] = useState(false)

    const { creditsRemaining } = usePlanStatus()

    const handlePurchaseInitiate = async (plan: any) => {
        setSelectedPlan(plan);
        setIsChecking(true);
        try {
            // Robust token retrieval
            const token = localStorage.getItem('token') || 
                          localStorage.getItem('resellerToken') || 
                          localStorage.getItem('accessToken');
            
            if (token) {
                const balanceData = await creditService.getUserCurrentBalance(token);
                if (balanceData && (balanceData.current_balance > 0 || (balanceData.available_credits && balanceData.available_credits > 0))) {
                    setShowUpgradeConfirm(true);
                    setIsChecking(false);
                    return;
                }
            }
        } catch (err) {
            console.error('Error checking balance:', err);
        }

        // Fallback or no balance
        if (creditsRemaining > 0) {
            setShowUpgradeConfirm(true);
        } else {
            router.push(`/plans/checkout?planName=${encodeURIComponent(plan.name)}`);
        }
        setIsChecking(false);
    }

    const handleUpgradeConfirm = () => {
        setShowUpgradeConfirm(false);
        if (selectedPlan) {
            router.push(`/plans/checkout?planName=${encodeURIComponent(selectedPlan.name)}`);
        }
    }

    const filtered = plans.filter(p => p.category === "reseller")

    // Dynamic counts based on fetched data
    const countMap: Record<string, string> = {
        all: isLoading ? "..." : plans.filter(p => p.category === "reseller").length.toString(),
        reseller: isLoading ? "..." : plans.filter(p => p.category === "reseller").length.toString(),
        price: isLoading ? "..." : (plans.filter(p => p.category === "reseller").length > 0
            ? `₹${Math.round(plans.filter(p => p.category === "reseller").reduce((acc, p) => acc + parseFloat(p.price.replace(/,/g, '')), 0) / plans.filter(p => p.category === "reseller").length).toLocaleString()}`
            : "₹0"),
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-8 p-8 pt-6 page-enter">

            {/* ── Header ── */}
            <div className="page-header">
                <div className="page-header-icon">
                    <Wallet className="h-5 w-5" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Pricing Plans</h2>
                    <p className="text-sm text-slate-500 mt-0.5">Manage and view all subscription tiers available on the platform</p>
                </div>
            </div>

            {/* ── Overview filter cards ── */}
            <div className="space-y-3">
                <p className="label">Plans Overview</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
                    {overviewCards.map((c) => {
                        const Icon = c.icon
                        const isActive = activePlanType === c.id
                        return (
                            <div
                                key={c.id}
                                onClick={() => !c.noFilter && setActivePlanType(c.id as PlanType)}
                                className={cn(
                                    "rounded-2xl p-5 border flex items-start justify-between gap-3 transition-all duration-200",
                                    !c.noFilter && "cursor-pointer hover:-translate-y-0.5 hover:shadow-lg",
                                    isActive && !c.noFilter && "ring-2 ring-offset-2"
                                )}
                                style={{
                                    background: c.bg,
                                    borderColor: isActive && !c.noFilter ? c.text : c.border,
                                    boxShadow: isActive && !c.noFilter
                                        ? `0 0 0 2px ${c.text}40, 0 4px 16px rgba(0,0,0,.08)`
                                        : undefined,
                                }}
                            >
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                                        style={{ color: c.text, opacity: .65 }}>{c.label}</p>
                                    <p className="text-2xl font-bold tracking-tight"
                                        style={{ color: c.text }}>{countMap[c.id]}</p>
                                    {isActive && !c.noFilter && (
                                        <p className="text-[10px] mt-1.5 font-semibold uppercase tracking-wider"
                                            style={{ color: c.text, opacity: .55 }}>Filtered ✓</p>
                                    )}
                                </div>
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: c.iconBg }}>
                                    <Icon className="h-5 w-5" style={{ color: c.text }} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Plans list ── */}
            <div className="space-y-5">
                {/* List header + view toggle */}
                <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="page-header-icon w-8 h-8">
                            <LayoutGrid className="h-4 w-4" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 capitalize">
                            {activePlanType === "all" ? "All Plans" : `${activePlanType} Plans`}
                            <span className="ml-2 text-xs text-slate-400 font-normal bg-slate-100 px-2 py-0.5 rounded-full">
                                {isLoading ? "..." : filtered.length} found
                            </span>
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                        {(["card", "table"] as const).map((v) => (
                            <button
                                key={v}
                                onClick={() => setViewMode(v)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    viewMode === v
                                        ? "bg-white text-slate-800 shadow-sm"
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                {v === "card"
                                    ? <><Grid className="h-3.5 w-3.5" />Card View</>
                                    : <><List className="h-3.5 w-3.5" />Table View</>
                                }
                            </button>
                        ))}
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-4 bg-white/50 backdrop-blur rounded-3xl border border-slate-100">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Fetching Latest Tiers...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 flex items-center gap-4">
                        <p className="font-bold">{error}</p>
                    </div>
                ) : (
                    <>
                        {viewMode === "card" ? (
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 stagger">
                                {filtered.map((plan) => (
                                    <PlanCard 
                                        key={plan.id} 
                                        plan={plan} 
                                        onPurchase={handlePurchaseInitiate}
                                    />
                                ))}
                            </div>
                        ) : (
                            <PlanTable 
                                plans={filtered} 
                                onPurchase={handlePurchaseInitiate}
                            />
                        )}

                        {/* Plan Upgrade Confirmation Dialog */}
                        <Dialog open={showUpgradeConfirm} onOpenChange={setShowUpgradeConfirm}>
                            <DialogContent className="max-w-md rounded-[2rem]">
                                <DialogHeader>
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-amber-50 rounded-full border border-amber-200">
                                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <DialogTitle className="text-lg font-semibold text-amber-900">
                                            Active Plan Already Exists
                                        </DialogTitle>
                                    </div>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                        <p className="text-amber-900 font-bold text-sm">
                                            You already have an active plan.
                                        </p>
                                        <p className="text-amber-700 text-xs mt-1 font-medium leading-relaxed">
                                            If you continue purchasing this new plan, all remaining credits from your current plan will be <span className="font-bold text-red-600">permanently lost</span> and will <span className="font-bold">NOT</span> be transferred to the new plan.
                                        </p>
                                    </div>
                                </div>
                                <DialogFooter className="gap-2 sm:gap-0">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowUpgradeConfirm(false)}
                                        className="flex-1 sm:flex-none border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpgradeConfirm}
                                        className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
                                    >
                                        Continue Purchase
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Loading Overlay when checking balance */}
                        {isChecking && (
                            <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1px] z-[100] flex items-center justify-center">
                                <div className="bg-white p-6 rounded-2xl shadow-2xl flex items-center gap-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                                    <p className="text-sm font-bold text-slate-700 uppercase tracking-widest">Checking Account Status...</p>
                                </div>
                            </div>
                        )}

                        {filtered.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                                <p className="text-sm text-slate-400 font-medium">No plans found for this category.</p>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
