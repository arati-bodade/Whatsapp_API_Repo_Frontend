"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { UserPlus, User, Mail, Phone, Lock, Building2, MapPin, TabletSmartphone, ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import businessService from "@/services/businessService"

export default function CreateBusinessPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [formData, setFormData] = useState({
        profile: {
            name: "",
            username: "",
            email: "",
            phone: "",
            password: "",
        },
        business: {
            business_name: "",
            business_description: "",
            erp_system: "",
            gstin: "",
        },
        address: {
            full_address: "",
            pincode: "",
            country: "",
        },
        wallet: {
            credits_allocated: 0
        }
    })

    const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            profile: { ...formData.profile, [e.target.name]: e.target.value }
        })
    }

    const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            business: { ...formData.business, [e.target.name]: e.target.value }
        })
    }

    const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            address: { ...formData.address, [e.target.name]: e.target.value }
        })
    }

    const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            wallet: { ...formData.wallet, credits_allocated: parseInt(e.target.value) || 0 }
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsLoading(true)

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            let resellerId = localStorage.getItem("reseller_id") || localStorage.getItem("user_id")

            // Fix: Handle 'undefined' string values
            if (resellerId === 'undefined') resellerId = null;

            if (!token || !resellerId) {
                router.push("/login")
                return
            }

            const submissionData = {
                ...formData,
                parent_reseller_id: resellerId,
                role: "business_owner",
                status: "active",
                whatsapp_mode: "unofficial",
                profile: {
                    ...formData.profile,
                    username: formData.profile.email.split('@')[0] // Auto-generate username from email
                }
            }

            await businessService.register(submissionData, token)
            router.push("/users")
        } catch (err: any) {
            console.error("Registration error:", err)
            setError(err.response?.data?.detail || "Failed to create business user.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Dashboard
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <span className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                                <UserPlus className="w-6 h-6" />
                            </span>
                            Create Business User
                        </h1>
                        <p className="text-gray-500 mt-1 ml-14">Register a new business client under your reseller account.</p>
                    </div>

                    {error && (
                        <div className="mx-8 mt-8 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <p className="text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="p-8 space-y-8">
                        {/* Personal Info */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" /> Personal Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="John Doe"
                                        value={formData.profile.name}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="john@business.com"
                                        value={formData.profile.email}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                                    <input
                                        type="text"
                                        name="phone"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="+91 9876543210"
                                        value={formData.profile.phone}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Choose a secure password"
                                        value={formData.profile.password}
                                        onChange={handleProfileChange}
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Business Info */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-500" /> Business Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
                                    <input
                                        type="text"
                                        name="business_name"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Business Name Ltd."
                                        value={formData.business.business_name}
                                        onChange={handleBusinessChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">GSTIN / Tax ID</label>
                                    <input
                                        type="text"
                                        name="gstin"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="22AAAAA0000A1Z5"
                                        value={formData.business.gstin}
                                        onChange={handleBusinessChange}
                                    />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
                                    <input
                                        type="text"
                                        name="full_address"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Full business address"
                                        value={formData.address.full_address}
                                        onChange={handleAddressChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Credits Allocation */}
                        <div className="space-y-6">
                            <h3 className="font-bold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                                <TabletSmartphone className="w-5 h-5 text-blue-500" /> Initial Allocation
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Credits to Allocate</label>
                                    <input
                                        type="number"
                                        name="credits_allocated"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="0"
                                        value={formData.wallet.credits_allocated}
                                        onChange={handleWalletChange}
                                    />
                                    <p className="text-xs text-gray-500">Credits will be deducted from your wallet.</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-xl font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 transition-all hover:-translate-y-0.5 flex items-center gap-2"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    "Create Business"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
