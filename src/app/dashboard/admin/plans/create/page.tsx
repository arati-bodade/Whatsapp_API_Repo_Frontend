"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { 
    PlusCircle, 
    ArrowLeft, 
    Coins, 
    Percent, 
    IndianRupee, 
    Calendar, 
    Shield, 
    PackagePlus,
    CheckCircle2,
    Loader2,
    Sparkles,
    Zap
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { createPlan, getPlans, updatePlan } from "@/config/api"
import { emitPlanUpdate } from "@/lib/planEvents"

export default function CreatePlanPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
            </div>
        }>
            <CreatePlanForm />
        </Suspense>
    )
}

function CreatePlanForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const editId = searchParams.get('edit')
    const isEdit = !!editId

    const [isLoading, setIsLoading] = useState(false)
    const [showSuccess, setShowSuccess] = useState(false)

    const [planData, setPlanData] = useState({
        name: "",
        credits: "",
        rate: "",
        price: "",
        validity: "1 Month",
        category: "BUSINESS"
    })

    const [errors, setErrors] = useState<Record<string, string>>({})

    const validateForm = () => {
        const newErrors: Record<string, string> = {}
        
        // Name validation
        if (!planData.name.trim()) {
            newErrors.name = "Plan name is required"
        }
        
        // Credits validation - must be positive
        const creditsValue = parseFloat(planData.credits.replace(/,/g, ''))
        if (isNaN(creditsValue) || creditsValue <= 0) {
            newErrors.credits = "Credits must be a positive number"
        }
        
        // Price validation - must be positive
        const priceValue = parseFloat(planData.price)
        if (isNaN(priceValue) || priceValue <= 0) {
            newErrors.price = "Price must be a positive number"
        }
        
        // Rate validation - must be positive
        const rateValue = parseFloat(planData.rate)
        if (isNaN(rateValue) || rateValue <= 0) {
            newErrors.rate = "Rate must be a positive number"
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    // Fetch plan details if in edit mode
    useEffect(() => {
        if (isEdit && editId) {
            const fetchPlan = async () => {
                setIsLoading(true)
                try {
                    const allPlans = await getPlans()
                    const plan = allPlans.find((p: any) => p.plan_id === editId)
                    
                    if (plan) {
                        const reverseDays = (days: number) => {
                            if (days >= 3650) return "Unlimited";
                            if (days >= 365) return "1 Year";
                            if (days === 180) return "6 Months";
                            if (days === 90) return "3 Months";
                            return "1 Month";
                        }

                        setPlanData({
                            name: plan.name,
                            credits: plan.credits_offered.toString(),
                            rate: plan.deduction_value.toString(),
                            price: plan.price.toString(),
                            validity: reverseDays(plan.validity_days),
                            category: plan.plan_category
                        })
                    }
                } catch (error) {
                    console.error("Failed to fetch plan for editing:", error)
                } finally {
                    setIsLoading(false)
                }
            }
            fetchPlan()
        }
    }, [isEdit, editId])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!validateForm()) {
            return
        }
        
        setIsLoading(true)
        
        try {
            // Helper to parse validity string to days
            const getDays = (val: string) => {
                const num = parseInt(val)
                if (val === "Unlimited") return 3650
                if (val.includes("Month")) return num * 30
                if (val.includes("Year")) return 365
                return 30
            }

            const payload = {
                name: planData.name,
                price: parseFloat(planData.price),
                credits_offered: parseInt(planData.credits.replace(/,/g, '')),
                validity_days: getDays(planData.validity),
                deduction_value: parseFloat(planData.rate),
                plan_category: planData.category
            }

            if (isEdit && editId) {
                await updatePlan(editId, payload)
            } else {
                await createPlan(payload)
            }
            
            // Broadcast update to other tabs/dashboards
            emitPlanUpdate()
            
            setShowSuccess(true)
            setTimeout(() => {
                setShowSuccess(false)
                router.push("/dashboard/admin/plans")
            }, 2000)
        } catch (error) {
            console.error(isEdit ? "Failed to update plan:" : "Failed to create plan:", error)
            alert(isEdit ? "Failed to update plan." : "Failed to create plan.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 p-6 lg:p-12 font-['Inter']">
            {/* Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-200 blur-[120px] rounded-full" />
                <div className="absolute top-[60%] -right-[10%] w-[35%] h-[50%] bg-emerald-200 blur-[100px] rounded-full" />
            </div>

            <div className="relative max-w-5xl mx-auto">
                {/* Custom Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12"
                >
                    <div className="flex items-center gap-6">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => router.back()}
                            className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 hover:scale-110 transition-all text-slate-400 hover:text-indigo-600"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Admin Suite</span>
                                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Plan Configuration</span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-3">
                                <Zap className="w-9 h-9 text-indigo-600" />
                                {isEdit ? "Update Plan" : "Create New Plan"}
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/50 backdrop-blur-md dark:bg-slate-900/50 p-2 rounded-2xl border border-white dark:border-slate-800 shadow-lg px-4 py-2">
                         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Master Admin</span>
                         <div className="h-4 w-px bg-slate-200 mx-2" />
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                         <span className="text-[10px] font-black text-slate-400 uppercase">Live Ready</span>
                    </div>
                </motion.div>

                {/* Form Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="border-none shadow-[0_32px_64px_-16px_rgba(0,0,0,0.04)] bg-white dark:bg-slate-900 rounded-[3rem] overflow-hidden border border-white/50 dark:border-slate-800/50">
                        <CardHeader className="p-10 pb-0 border-none">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-1 bg-indigo-600 rounded-full" />
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Plan Details</p>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                        {isEdit ? "Modify Infrastructure" : "Setup Infrastructure"}
                                    </CardTitle>
                                    <p className="text-sm font-medium text-slate-400 mt-1">
                                        {isEdit ? "Update your subscription model and pricing tier" : "Configure your new subscription model and pricing tier"}
                                    </p>
                                </div>
                                <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-inner group">
                                    <Sparkles className="w-7 h-7 text-indigo-500 transition-transform group-hover:rotate-12" />
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="p-10 pt-10">
                            <form onSubmit={handleSubmit} className="space-y-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                                    
                                    {/* Plan Name */}
                                    <FormField 
                                        label="Plan Identity" 
                                        icon={<PlusCircle className="w-4 h-4" />}
                                        input={
                                            <div>
                                                <Input 
                                                    required
                                                    placeholder="e.g. Platinum Plus"
                                                    value={planData.name}
                                                    onChange={(e) => setPlanData({...planData, name: e.target.value})}
                                                    className={`h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10 transition-all text-lg placeholder:text-slate-300 ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                                                />
                                                {errors.name && <p className="text-red-500 text-xs mt-2 font-semibold">{errors.name}</p>}
                                            </div>
                                        }
                                    />

                                    {/* Plan Category */}
                                    <FormField 
                                        label="Target Category" 
                                        icon={<Shield className="w-4 h-4" />}
                                        input={
                                            <Select 
                                                value={planData.category}
                                                onValueChange={(val) => setPlanData({...planData, category: val})}
                                            >
                                                <SelectTrigger className="h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10">
                                                    <SelectValue placeholder="Select Category" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl">
                                                    <SelectItem value="RESELLER" className="font-bold py-4 focus:bg-indigo-50 dark:focus:bg-indigo-900/40 cursor-pointer">Reseller Membership</SelectItem>
                                                    <SelectItem value="BUSINESS" className="font-bold py-4 focus:bg-emerald-50 dark:focus:bg-emerald-900/40 cursor-pointer">User Plan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        }
                                    />

                                    {/* Credits */}
                                    <FormField 
                                        label="Stock Credits" 
                                        icon={<Coins className="w-4 h-4" />}
                                        input={
                                            <div className="relative group">
                                                <Input 
                                                    required
                                                    type="number"
                                                    min="0"
                                                    step="1"
                                                    placeholder="100,000"
                                                    value={planData.credits}
                                                    onChange={(e) => setPlanData({...planData, credits: e.target.value})}
                                                    className={`h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white px-6 transition-all focus:ring-4 focus:ring-indigo-500/10 ${errors.credits ? 'border-red-500 focus:border-red-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase rounded-lg">Units</div>
                                                {errors.credits && <p className="text-red-500 text-xs mt-2 font-semibold">{errors.credits}</p>}
                                            </div>
                                        }
                                    />

                                    {/* Validity */}
                                    <FormField 
                                        label="Service Life" 
                                        icon={<Calendar className="w-4 h-4" />}
                                        input={
                                            <Select 
                                                value={planData.validity}
                                                onValueChange={(val) => setPlanData({...planData, validity: val})}
                                            >
                                                <SelectTrigger className="h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 border-slate-100 dark:border-slate-800 font-bold text-slate-900 dark:text-white focus:ring-4 focus:ring-indigo-500/10">
                                                    <SelectValue placeholder="Validity" />
                                                </SelectTrigger>
                                                <SelectContent className="rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                    {["1 Month", "3 Months", "6 Months", "1 Year", "Unlimited"].map(v => (
                                                        <SelectItem key={v} value={v} className="font-bold py-3 cursor-pointer">{v}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        }
                                    />

                                    {/* Plan Price */}
                                    <FormField 
                                        label="Direct Pricing" 
                                        icon={<IndianRupee className="w-4 h-4" />}
                                        input={
                                            <div className="relative group">
                                                <div className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">₹</div>
                                                <Input 
                                                    required
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    placeholder="4,999"
                                                    value={planData.price}
                                                    onChange={(e) => setPlanData({...planData, price: e.target.value})}
                                                    className={`h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white pl-12 pr-6 transition-all focus:ring-4 focus:ring-indigo-500/10 ${errors.price ? 'border-red-500 focus:border-red-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                                                />
                                                {errors.price && <p className="text-red-500 text-xs mt-2 font-semibold">{errors.price}</p>}
                                            </div>
                                        }
                                    />

                                    {/* Rate */}
                                    <FormField 
                                        label="Unit Costing" 
                                        icon={<Percent className="w-4 h-4" />}
                                        input={
                                            <div>
                                                <Input 
                                                    required
                                                    type="number"
                                                    min="0"
                                                    step="0.001"
                                                    placeholder="0.12"
                                                    value={planData.rate}
                                                    onChange={(e) => setPlanData({...planData, rate: e.target.value})}
                                                    className={`h-16 rounded-2xl bg-slate-50/50 dark:bg-slate-800/80 font-black text-slate-900 dark:text-white px-6 transition-all focus:ring-4 focus:ring-indigo-500/10 ${errors.rate ? 'border-red-500 focus:border-red-500' : 'border-slate-100 dark:border-slate-800 focus:border-indigo-500'}`}
                                                />
                                                {errors.rate && <p className="text-red-500 text-xs mt-2 font-semibold">{errors.rate}</p>}
                                            </div>
                                        }
                                    />
                                </div>

                                {/* Action Section with a slightly more centered/bold button */}
                                <div className="pt-12 border-t border-slate-50 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                                            <Zap className="w-7 h-7 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider mb-1">Instant Deployment</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                                Plan details are encrypted and synced across all nodes instantly.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <Button 
                                        type="submit"
                                        disabled={isLoading || showSuccess}
                                        className={`h-20 px-16 rounded-[1.5rem] font-black uppercase tracking-[0.25em] text-xs transition-all relative overflow-hidden group shadow-2xl ${
                                            showSuccess 
                                            ? 'bg-emerald-600 text-white shadow-emerald-200 dark:shadow-none' 
                                            : 'bg-indigo-600 hover:bg-black text-white shadow-indigo-200 dark:shadow-none'
                                        }`}
                                    >
                                        <span className="relative z-10 flex items-center gap-4">
                                            {isLoading ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : showSuccess ? (
                                                <><CheckCircle2 className="w-6 h-6" /> Plan Activated</>
                                            ) : isEdit ? (
                                                <><CheckCircle2 className="w-6 h-6" /> Plan Updated</>
                                            ) : (
                                                "Create New Plan"
                                            )}
                                        </span>
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}

function FormField({ label, icon, input }: { label: string, icon: React.ReactNode, input: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <label className="flex items-center gap-3 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">
                <span className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-indigo-500 shadow-sm">{icon}</span>
                {label}
            </label>
            {input}
        </div>
    )
}
