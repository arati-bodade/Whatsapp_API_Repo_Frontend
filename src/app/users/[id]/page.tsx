"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Shield, RefreshCw } from "lucide-react"

export default function UserDetailsPage({ params }: { params: { id: string } }) {
    // Mock Data for the specific user
    const user = {
        name: "rahul waghole",
        role: "Reseller",
        status: "Disconnected",
        initials: "RW",
        memberSince: "Mar 26, 2024",
        credits: {
            total: "13,930",
            used: "0",
            remaining: "13,930",
            balance: "₹0"
        },
        personal: {
            fullName: "rahul waghole",
            email: "rahulwaghole14@gmail.com",
            userId: "d1e0c262c9cd401099d186cb769e1652",
            mobile: "9881976526",
            country: "Not provided",
            address: "Not provided"
        },
        business: {
            companyName: "RSL Solution Pvt Ltd",
            orgType: "RSL Solution Pvt Ltd",
            erpType: "Other",
            bankName: "Indusind bank"
        },
        plan: {
            type: "MAP 8A",
            userType: "Reseller",
            expiry: "UNLIMITED",
            username: "rahulwaghole14@gmail.com"
        }
    }

    const SectionHeader = ({ title, onEdit }: { title: string, onEdit?: () => void }) => (
        <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                {title}
            </h3>
            {onEdit && (
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Edit
                </button>
            )}
        </div>
    )

    const Field = ({ label, value, className = "" }: { label: string, value: React.ReactNode, className?: string }) => (
        <div className={className}>
            <p className="text-xs uppercase text-gray-500 font-semibold mb-1">{label}</p>
            <div className="text-sm text-gray-900 font-medium wrap-break-word">{value}</div>
        </div>
    )

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header Profile Section */}
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white relative">
                            {user.initials}
                            <div className="absolute bottom-0 right-0 h-4 w-4 bg-red-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-red-500 text-sm font-medium">{user.status}</span>
                                <span className="text-blue-600 text-sm font-medium bg-blue-50 px-2 py-0.5 rounded">
                                    {user.role}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-gray-500">Member since</p>
                        <p className="text-sm font-semibold text-gray-900">{user.memberSince}</p>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-8 py-6 border-t border-b border-gray-300">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">TOTAL CREDITS</p>
                        <p className="text-2xl font-bold text-blue-600">{user.credits.total}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">USED CREDITS</p>
                        <p className="text-2xl font-bold text-purple-600">{user.credits.used}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">REMAINING</p>
                        <p className="text-2xl font-bold text-green-600">{user.credits.remaining}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-1">BALANCE</p>
                        <p className="text-2xl font-bold text-orange-500">{user.credits.balance}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column (Personal & Business) */}
                    <div className="lg:col-span-2 space-y-10">
                        {/* Personal Information */}
                        <div>
                            <SectionHeader title="Personal Information" onEdit={() => { }} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <Field label="FULL NAME" value={user.personal.fullName} />
                                <Field label="EMAIL ADDRESS" value={user.personal.email} />
                                <Field className="md:col-span-2" label="USER ID" value={user.personal.userId} />
                                <Field label="MOBILE NUMBER" value={user.personal.mobile} />
                                <Field label="COUNTRY" value={<span className="italic text-gray-500">{user.personal.country}</span>} />
                                <Field label="ADDRESS" value={<span className="italic text-gray-500">{user.personal.address}</span>} />
                            </div>
                        </div>

                        <div className="h-0.5 bg-gray-300 w-full my-10" />

                        {/* Business Information */}
                        <div>
                            <SectionHeader title="Business Information" onEdit={() => { }} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                <Field label="COMPANY NAME" value={user.business.companyName} />
                                <Field label="ORGANIZATION TYPE" value={user.business.orgType} />
                                <Field label="ERP TYPE" value={<span className="italic text-gray-500">{user.business.erpType}</span>} />
                                <Field label="BANK NAME" value={user.business.bankName} />
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Plan & Security) */}
                    <div className="space-y-6">
                        {/* Account Plan */}
                        <div className="bg-white rounded-xl border p-6 shadow-sm">
                            <SectionHeader title="Account Plan" />
                            <div className="space-y-6">
                                <Field label="PLAN TYPE" value={<span className="text-lg font-bold">{user.plan.type}</span>} />
                                <Field label="USER TYPE" value={user.plan.userType} />
                                <Field
                                    label="EXPIRY DATE"
                                    value={
                                        <div className="flex items-center gap-2 text-green-600 font-bold">
                                            <RefreshCw className="h-4 w-4" />
                                            {user.plan.expiry}
                                        </div>
                                    }
                                />
                                <Field label="USERNAME" value={user.plan.username} />
                            </div>
                        </div>

                        {/* Security */}
                        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
                            <div className="flex items-center gap-2 mb-6 text-gray-900 font-medium">
                                <Shield className="h-5 w-5 text-blue-600" />
                                Security
                            </div>

                            <div className="text-center py-4">
                                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                    <RefreshCw className="h-6 w-6 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-600 mb-6 px-4">
                                    Keep your account secure by updating your password regularly.
                                </p>
                                <Button className="w-full bg-blue-600 hover:bg-blue-700 font-medium mb-6">
                                    Change Password
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase text-gray-500 font-semibold">CURRENT PASSWORD</label>
                                <input
                                    type="password"
                                    value=".........."
                                    disabled
                                    className="w-full bg-white border rounded px-3 py-2 text-xl tracking-widest text-gray-700"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
