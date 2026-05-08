"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { PlansHeader, PlansOverview, PlanSection, Plan } from "@/components/plans/PlansComponents"
import { Crown, User } from "lucide-react"
import { useState } from "react"

import { resellerPlans, userPlans } from "@/data/plansData"

export default function PlansPage() {
    const [viewMode, setViewMode] = useState<'card' | 'table'>('card')

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <PlansHeader />

                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        Plans Overview
                    </h2>
                    <PlansOverview />

                    <div className="flex justify-end mt-4">
                        <div className="flex bg-gray-100 rounded-lg p-1 text-sm">
                            <button
                                onClick={() => setViewMode('card')}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${viewMode === 'card' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-layout-grid"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                                Card View
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`flex items-center gap-1 px-3 py-1 rounded-md font-medium transition-all ${viewMode === 'table' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-table"><path d="M12 3v18" /><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M3 9h18" /></svg>
                                Table View
                            </button>
                        </div>
                    </div>
                </div>

                <PlanSection
                    title="Reseller Plans"
                    icon={<Crown className="h-5 w-5 text-purple-600" />}
                    plans={resellerPlans}
                    hideToggle={true}
                />

                <PlanSection
                    title="User Plans"
                    icon={<User className="h-5 w-5 text-green-600" />}
                    plans={userPlans}
                    hideToggle={true}
                />
            </div>
        </DashboardLayout>
    )
}
