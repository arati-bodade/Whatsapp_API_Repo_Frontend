"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { PlansHeader, PlansOverview, PlanSection } from "@/components/plans/PlansComponents"
import { Crown, Loader2 } from "lucide-react"
import { usePlans } from "@/hooks/usePlans"

export default function ResellerPlansPage() {
    const { plans, isLoading, error } = usePlans('RESELLER');

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PlansHeader />

                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        Plans Overview
                    </h2>
                    <PlansOverview />
                </div>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing Tiers...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 bg-rose-50 text-rose-600 rounded-3xl border border-rose-100 flex items-center gap-4">
                        <p className="font-bold">{error}</p>
                    </div>
                ) : (
                    <PlanSection
                        title="Reseller Plans"
                        icon={<Crown className="h-5 w-5 text-purple-600" />}
                        plans={plans}
                    />
                )}
            </div>
        </DashboardLayout>
    )
}
