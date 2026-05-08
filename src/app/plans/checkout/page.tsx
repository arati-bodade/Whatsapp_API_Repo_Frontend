"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import axios from '@/config/axios'
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
    Loader2, 
    Wallet, 
    Building2, 
    Mail, 
    Phone, 
    FileText, 
    ShoppingCart, 
    Users, 
    Crown,
    AlertTriangle 
} from "lucide-react"
import Script from "next/script"
import { resellerPlans, userPlans } from "@/data/plansData"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import creditService from "@/services/creditService"
import { businessService } from "@/services/businessService"
import { usePlans } from "@/hooks/usePlans"
import { usePlanStatus } from "@/hooks/usePlanStatus"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

declare global {
    interface Window {
        Razorpay: any;
    }
}

function CheckoutContent() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const planName = searchParams.get('planName')
    const [isLoading, setIsLoading] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        mobile: "",
        company: "",
        gstin: "",
        filede: "", // 🔥 FIX: Enable filede field
        allocate_to_user_id: "self"
    })
    
    // 🔥 FIX: Track field validation state for UI highlighting
    const [fieldErrors, setFieldErrors] = useState<{
        name?: string,
        email?: string,
        mobile?: string,
        company?: string
    }>({})
    const [businessUsers, setBusinessUsers] = useState<any[]>([])
    const [userRole, setUserRole] = useState<string | null>(null)
    const [showUpgradeConfirm, setShowUpgradeConfirm] = useState(false)
    const [isSelfPurchase, setIsSelfPurchase] = useState(true) // Default to true for all users
    const [isSubUser, setIsSubUser] = useState(false) // Track if user is a sub-user under reseller
    const [resellerInfo, setResellerInfo] = useState<any>(null) // Store reseller info for sub-users
    const [showInsufficientDialog, setShowInsufficientDialog] = useState(false)
    const [insufficientData, setInsufficientData] = useState<any>(null)
    
    const [billingData, setBillingData] = useState({
        grossAmount: 0,
        gstAmount: 0,
        totalAmount: 0,
        credits: 0
    })

    // Fetch dynamic plans from the backend
    const { plans: allPlans, isLoading: isPlansLoading } = usePlans('ALL')
    
    // Check for active plan status
    const { creditsRemaining, planName: currentPlanName, isValid: hasActivePlan } = usePlanStatus()

    // 🔥 FIX: Add typo correction for common plan name misspellings
    const correctPlanName = (name: string | null) => {
        if (!name) return name
        
        let corrected = name.toLowerCase().trim()
        
        // Common typo corrections
        if (corrected.includes('reseler')) {
            corrected = corrected.replace(/reseler/g, 'reseller')
        }
        if (corrected.includes('golden')) {
            corrected = corrected.replace(/golden/g, 'Golden')
        }
        if (corrected.includes('member')) {
            corrected = corrected.replace(/member/g, 'Member')
        }
        
        return corrected
    }
    
    const correctedPlanName = correctPlanName(planName)
    
    // Find the plan details (case-insensitive and trim for robust matching)
    const selectedPlan = allPlans.find(p => p.name.toLowerCase().trim() === correctedPlanName?.toLowerCase().trim())
    
    // Check if this is a reseller-specific plan
    const isResellerPlan = resellerPlans.some(p => p.name === selectedPlan?.name)
    const isResellerStarterPlan = selectedPlan?.name === "STARTER" || selectedPlan?.name === "Reseller Starter" || planName === "Reseller%20Starter"

    // Initialize billing data when plan is selected
    useEffect(() => {
        if (selectedPlan) {
            const price = parseInt(selectedPlan.price.replace(/[^0-9]/g, ''))
            const gst = Math.round(price * 0.18)
            setBillingData({
                grossAmount: price,
                gstAmount: gst,
                totalAmount: price + gst,
                credits: parseInt(selectedPlan.credits.replace(/,/g, ''))
            })
        }
    }, [selectedPlan])

    // Update read-only status when allocation changes
    useEffect(() => {
        setIsSelfPurchase(formData.allocate_to_user_id === "self" || !formData.allocate_to_user_id)
    }, [formData.allocate_to_user_id])

    // Fetch current user details and business users if role is reseller or admin
    useEffect(() => {
        const fetchUserData = async () => {
            if (typeof window !== 'undefined') {
                try {
                    const role = localStorage.getItem('user_role')
                    const token = localStorage.getItem('token') || 
                                  localStorage.getItem('accessToken') || 
                                  localStorage.getItem('resellerToken') || 
                                  localStorage.getItem('businessToken') || 
                                  localStorage.getItem('adminToken');
                    
                    if (role && token) {
                        setUserRole(role)
                        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
                        
                        // 🔥 FIX: Auto-fill registered name for better UX
                        const storedName = localStorage.getItem('user_name') || localStorage.getItem('name') || ''
                        const storedEmail = localStorage.getItem('user_email') || localStorage.getItem('email') || ''
                        const storedPhone = localStorage.getItem('user_phone') || localStorage.getItem('phone') || ''
                        const storedCompany = localStorage.getItem('user_company') || localStorage.getItem('business_name') || ''
                        
                        setFormData(prev => ({
                            ...prev,
                            name: storedName,
                            email: storedEmail,
                            mobile: storedPhone,
                            company: storedCompany
                        }))
                        
                        // 🔥 NEW: Check if user is a sub-user under reseller
                        const parentResellerId = localStorage.getItem('parent_reseller_id')
                        const parentRole = localStorage.getItem('parent_role')
                        
                        if (parentResellerId && parentRole === 'reseller' && role === 'business') {
                            setIsSubUser(true)
                            // Fetch reseller info to display
                            try {
                                const resellerResponse = await axios.get(`/resellers/${parentResellerId}`, {
                                    headers: { Authorization: `Bearer ${token}` }
                                })
                                setResellerInfo(resellerResponse.data)
                            } catch (err) {
                                console.error('Error fetching reseller info:', err)
                            }
                        }
                        
                        // Auto-fill form with user details from localStorage
                        // Using localStorage to avoid 403 errors with /me endpoint for resellers
                        const userName = localStorage.getItem('user_name') || localStorage.getItem('name') || ''
                        const userEmail = localStorage.getItem('user_email') || localStorage.getItem('email') || ''
                        const userPhone = localStorage.getItem('user_phone') || localStorage.getItem('phone') || ''
                        const userCompany = localStorage.getItem('user_company') || localStorage.getItem('business_name') || ''
                        
                        setFormData(prev => ({
                            ...prev,
                            name: userName,
                            email: userEmail,
                            mobile: userPhone,
                            company: userCompany,
                            gstin: '',
                            allocate_to_user_id: role === 'admin' ? "" : "self"
                        }))
                        
                        // Set flag for self-purchase (default is true)
                        // No need to set here as isSelfPurchase defaults to true
                        
                        if (role === 'admin') {
                            // Admin can allocate to ANY user on the platform
                            const { getGlobalUsers } = await import("@/config/api")
                            const response = await getGlobalUsers()
                            setBusinessUsers(Array.isArray(response) ? response : (response.data || []))
                        } else if (role === 'reseller') {
                            const resellerId = localStorage.getItem('user_id') || localStorage.getItem('reseller_id')
                            if (resellerId) {
                                const response = await businessService.getBusinessesByReseller(resellerId, token)
                                setBusinessUsers(Array.isArray(response) ? response : (response.data || []))
                            }
                        }
                    }
                } catch (err) {
                    console.error('Error fetching user info or businesses:', err)
                }
            }
        }
        fetchUserData()
    }, [])

    if (isPlansLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="text-slate-500 font-semibold tracking-wide">Loading plan details...</p>
            </div>
        )
    }

    if (!selectedPlan && planName) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-red-600 mb-4">Plan not found</h2>
                <p className="text-slate-500 mb-6">The plan you requested could not be found or is no longer available.</p>
                <Button onClick={() => window.history.back()} className="mt-4">
                    Back to Plans
                </Button>
            </div>
        )
    }

    if (!planName) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No plan selected</h2>
                <Button onClick={() => window.history.back()} className="mt-4">
                    View Plans
                </Button>
            </div>
        )
    }

    // 🔥 FIX: Add debugging and better error handling for plan lookup
    console.log('🔍 Plan lookup debugging:')
    console.log('  URL planName:', planName)
    console.log('  Corrected planName:', correctedPlanName)
    console.log('  Available plans:', allPlans.map(p => p.name))
    console.log('  Selected plan:', selectedPlan)
    
    if (!selectedPlan) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center min-h-[60vh]">
                <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Plan Not Found</h2>
                <p className="text-gray-600 mb-2">Plan "{planName}" could not be found in our system.</p>
                <p className="text-sm text-gray-500 mb-4">Available plans: {allPlans.map(p => p.name).join(', ')}</p>
                <Button onClick={() => window.history.back()} className="mt-4">
                    View Plans
                </Button>
            </div>
        )
    }

    const handlePayment = async () => {
        if (!selectedPlan) return;

        // 🔥 Required Fields Validation
        if (!formData.name?.trim()) {
            alert('Full Name is required')
            return
        }
        if (!formData.email?.trim()) {
            alert('Email Address is required')
            return
        }
        if (!formData.mobile?.trim()) {
            alert('Phone Number is required')
            return
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email.trim())) {
            alert('Please enter a valid email address')
            return
        }

        setFieldErrors({})

        if (userRole === 'admin' && !formData.allocate_to_user_id) {
            alert("Please select a user to allocate this plan to.");
            return;
        }

        // 🔥 REAL-TIME BALANCE CHECK: Fetch latest balance directly to ensure warning shows
        setIsLoading(true);
        try {
            // Support all possible token storage keys for different roles
            const token = localStorage.getItem('token') || 
                          localStorage.getItem('accessToken') || 
                          localStorage.getItem('resellerToken') || 
                          localStorage.getItem('businessToken') || 
                          localStorage.getItem('adminToken');
            
            if (token) {
                const balanceData = await creditService.getUserCurrentBalance(token);
                console.log('🔍 Real-time balance check result:', balanceData);
                
                // If balance is > 0, we must show the warning
                if (balanceData && (balanceData.current_balance > 0 || (balanceData.available_credits && balanceData.available_credits > 0))) {
                    setShowUpgradeConfirm(true);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.error('Error in real-time balance check:', err);
            // Fallback to hook state if API fails
            if (creditsRemaining > 0) {
                setShowUpgradeConfirm(true);
                setIsLoading(false);
                return;
            }
        } finally {
            // Only set loading false if we're NOT showing the upgrade confirm
            // If showing confirm, we leave it for the next step or reset it
            if (!showUpgradeConfirm) setIsLoading(false);
        }

        proceedWithPayment();
    }

    const proceedWithPayment = async () => {
        if (!selectedPlan) return;
        
        setShowUpgradeConfirm(false);
        setIsLoading(true)
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                alert("You must be logged in to purchase a plan")
                router.push('/login')
                return
            }

            // 🔥 FIX: Use correct field names matching backend PlanPurchaseRequest model with safe defaults
            const payload: any = {
                plan_name: selectedPlan.name,
                credits: billingData.credits,
                price: billingData.grossAmount,
                // 🔥 FIX: Match backend model field names exactly with safe defaults
                name: formData.name || "Reseller User",        // default if empty
                email: formData.email || "noreply@example.com", // default if empty
                phone: formData.mobile || "0000000000",        // default if empty
                company: formData.company || "-",              // default if empty
                gstin: formData.gstin || null,                 // optional
                filede: formData.filede || null,               // optional
                allocated_to_user_id: formData.allocate_to_user_id !== "self" ? formData.allocate_to_user_id : undefined
            };
            
            // 🔥 DEBUG: Log the complete payload
            console.log('🔍 API Payload being sent:', JSON.stringify(payload, null, 2))
            
            if (formData.allocate_to_user_id !== "self") {
                payload.allocated_to_user_id = formData.allocate_to_user_id;
            }
            
            const response = await creditService.initiatePayment(payload, token)

            if (response.success && response.razorpay_order_id) {
                // Step 2: Open Razorpay Checkout
                const options = {
                    key: response.key,
                    amount: response.amount,
                    currency: response.currency,
                    name: "WhatsApp Platform",
                    description: selectedPlan.name,
                    order_id: response.razorpay_order_id,
                    handler: async function (paymentResponse: any) {
                        try {
                            setIsLoading(true);
                            const verifyResult = await creditService.verifyPayment({
                                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                                razorpay_order_id: paymentResponse.razorpay_order_id,
                                razorpay_signature: paymentResponse.razorpay_signature
                            }, token);

                            if (verifyResult.success) {
                                // 🔥 FIX: Trigger credit update event across all tabs
                                localStorage.setItem('credits_updated', Date.now().toString());
                                window.dispatchEvent(new CustomEvent('credits-updated'));
                                localStorage.setItem('plan_updated', Date.now().toString());
                                window.dispatchEvent(new CustomEvent('plan-updated'));
                                
                                router.push('/dashboard/reseller/orders?status=success');
                            } else {
                                alert("Payment verification failed. Please contact support.");
                            }
                        } catch (err: any) {
                            console.error("Verification error:", err);
                            alert("Error verifying payment");
                        } finally {
                            setIsLoading(false);
                        }
                    },
                    prefill: {
                        name: formData.name,
                        email: formData.email,
                        contact: formData.mobile
                    },
                    notes: {
                        txnid: response.txnid
                    },
                    theme: {
                        color: "#2563eb"
                    }
                };
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                throw new Error("Failed to initialize payment gateway");
            }

        } catch (error: any) {
            console.error("Purchase failed:", error)
            const errorDetail = error.response?.data?.detail;
            
            // 🔥 NEW: Handle Insufficient Reseller Credits
            if (errorDetail?.error === 'INSUFFICIENT_RESELLER_CREDITS') {
                setInsufficientData(errorDetail);
                setShowInsufficientDialog(true);
                return;
            }

            alert(error.response?.data?.detail || error.message || "Failed to process purchase. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    // Removed static calculations

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-indigo-50/50 via-white to-white pb-20">
            <div className="max-w-4xl mx-auto py-12 px-6">
                {/* Header Section */}
                <div className="flex flex-col items-center text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="p-4 bg-white shadow-xl shadow-blue-500/10 rounded-2xl mb-6 ring-1 ring-blue-50">
                        <ShoppingCart className="h-10 w-10 text-blue-600" />
                    </div>
                    <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                        Plan Purchase
                    </h1>
                    <p className="text-slate-500 font-semibold max-w-md">
                        Secure your subscription and unlock premium automation features for your business.
                    </p>
                </div>

            <div className="grid grid-cols-1 gap-8">
                {/* Personal Information */}
                <Card className="bg-white/80 backdrop-blur-xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-100/30 border-b border-slate-100/50 p-6 px-10">
                        <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <Users className="h-4 w-4 text-blue-600" />
                            Personal Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {isResellerStarterPlan && (
                            <div className="md:col-span-2 mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <Users className="h-5 w-5 text-blue-600 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-blue-800">
                                            Reseller Registration Information
                                        </p>
                                        <p className="text-xs text-blue-700 mt-1">
                                            Please provide your personal information for reseller registration. All fields are optional - you can proceed with empty fields.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Full Name <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Users className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input 
                                        placeholder="Enter your full name" 
                                        className="pl-11 h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold text-slate-700"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        disabled={isSelfPurchase}
                                        title={isSelfPurchase ? "Name is auto-filled from your registered details" : "Enter your full name"}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Email Address <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input 
                                        placeholder="Enter your email" 
                                        className="pl-11 h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold text-slate-700"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        disabled={isSelfPurchase}
                                        title={isSelfPurchase ? "Email is auto-filled from your registered details" : "Enter your email"}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input 
                                        placeholder="Enter your phone number" 
                                        className="pl-11 h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold text-slate-700"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                                        disabled={isSelfPurchase}
                                        title={isSelfPurchase ? "Phone is auto-filled from your registered details" : "Enter your phone number"}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                                <div className="relative group">
                                    <Building2 className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input 
                                        placeholder="Enter your company name" 
                                        className="pl-11 h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold text-slate-700"
                                        value={formData.company}
                                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                                        title="Enter your company name"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">GSTIN</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input 
                                        placeholder="Enter GSTIN (if applicable)" 
                                        className="pl-11 h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold text-slate-700"
                                        value={formData.gstin}
                                        onChange={(e) => setFormData({...formData, gstin: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">FileDE</label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                    <Input 
                                        placeholder="Enter FileDE (if applicable)" 
                                        className="pl-11 h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-semibold text-slate-700"
                                        value={formData.filede}
                                        onChange={(e) => setFormData({...formData, filede: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                             {/* Allocation Logic for Admins only - hidden for resellers/users */}
                             {(userRole === 'admin') && (
                                <div className="space-y-3 md:col-span-2 animate-in slide-in-from-top-2 duration-500">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Allocate Plan To
                                    </label>
                                    <Select 
                                        value={formData.allocate_to_user_id} 
                                        onValueChange={(value) => setFormData({...formData, allocate_to_user_id: value})}
                                    >
                                        <SelectTrigger className="w-full h-14 rounded-2xl bg-slate-50/50 border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-600 font-semibold text-slate-700 overflow-hidden">
                                            <SelectValue placeholder="Select a user to allocate" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[300px]">
                                            {businessUsers
                                                .filter(user => {
                                                    const isResellerPlan = resellerPlans.find(p => p.name === planName);
                                                    if (isResellerPlan) return user.role === "Reseller";
                                                    return user.role === "Direct Business";
                                                })
                                                .map((user) => {
                                                    const userId = user.busi_user_id || user.id || user.reseller_id;
                                                    const name = user.profile?.name || user.business?.business_name || user.name || 'Unnamed';
                                                    const email = user.profile?.email || user.email || 'No email';
                                                    return (
                                                        <SelectItem key={userId} value={userId}>
                                                            <div className="flex flex-col">
                                                                 <span className="font-bold">{name}</span>
                                                                 <span className="text-[10px] text-gray-400">{email}</span>
                                                            </div>
                                                        </SelectItem>
                                                    );
                                                })}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Plan Details */}
                <Card className="bg-white/80 backdrop-blur-xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-100/30 border-b border-slate-100/50 p-6 px-10">
                        <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <Crown className="h-4 w-4 text-blue-600" />
                            Plan Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 font-bold">
                        <div className="grid grid-cols-2 gap-8 text-center sm:text-left">
                            <div className="border-r pr-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Plan Name</p>
                                <Badge variant="outline" className="text-lg font-black text-blue-600 border-none p-0">{selectedPlan?.name}</Badge>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Credits</p>
                                {isEditMode ? (
                                    <Input 
                                        type="number"
                                        value={billingData.credits}
                                        onChange={(e) => setBillingData({...billingData, credits: parseInt(e.target.value) || 0})}
                                        className="h-8 w-24 text-center font-black rounded-lg bg-gray-50 border-none ring-1 ring-gray-200 focus:ring-2 focus:ring-blue-600"
                                    />
                                ) : (
                                    <p className="text-lg font-black text-gray-900">{billingData.credits.toLocaleString()}</p>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Billing Summary */}
                <Card className="bg-white/80 backdrop-blur-xl border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 rounded-[2rem] overflow-hidden">
                    <CardHeader className="bg-slate-100/30 border-b border-slate-100/50 p-6 px-10">
                        <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                            <Wallet className="h-4 w-4 text-blue-600" />
                            Billing Summary
                            <Button 
                                variant="ghost" 
                                size="sm"
                                className="ml-auto text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 transition-colors"
                                onClick={() => setIsEditMode(!isEditMode)}
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                {isEditMode ? 'Save Changes' : 'Edit Billing'}
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-10 space-y-6">
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Gross Amount</span>
                            {isEditMode ? (
                                <Input 
                                    type="number"
                                    value={billingData.grossAmount}
                                    onChange={(e) => {
                                        const newPrice = parseInt(e.target.value) || 0
                                        const newGst = Math.round(newPrice * 0.18)
                                        setBillingData({
                                            ...billingData,
                                            grossAmount: newPrice,
                                            gstAmount: newGst,
                                            totalAmount: newPrice + newGst
                                        })
                                    }}
                                    className="w-32 text-right font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                />
                            ) : (
                                <span className="font-black text-gray-900">₹{billingData.grossAmount.toLocaleString()}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">GST (18%)</span>
                            {isEditMode ? (
                                <Input 
                                    type="number"
                                    value={billingData.gstAmount}
                                    onChange={(e) => {
                                        const newGst = parseInt(e.target.value) || 0
                                        setBillingData({
                                            ...billingData,
                                            gstAmount: newGst,
                                            totalAmount: billingData.grossAmount + newGst
                                        })
                                    }}
                                    className="w-32 text-right font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1"
                                />
                            ) : (
                                <span className="font-black text-gray-900">₹{billingData.gstAmount.toLocaleString()}</span>
                            )}
                        </div>
                        <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-gray-500">Internet Handling Charge</span>
                            <span className="font-black text-gray-900">₹0.00</span>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t border-dashed border-gray-200">
                            <span className="text-xl font-black text-gray-900 uppercase tracking-tighter">Total Amount</span>
                            <span className="text-3xl font-black text-blue-600 font-mono tracking-tighter">₹{billingData.totalAmount.toLocaleString()}</span>
                        </div>
                        
                        {/* 🔥 NEW: Reseller Credit Usage Message for Sub-users */}
                        {isSubUser && resellerInfo && (
                            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800">
                                            This plan will be purchased using reseller credits
                                        </p>
                                        <p className="text-xs text-amber-700 mt-1">
                                            {billingData.credits.toLocaleString()} credits will be deducted from {resellerInfo.name || 'your reseller'}'s account. 
                                            This purchase requires reseller credit approval.
                                        </p>
                                        {resellerInfo.available_credits !== undefined && (
                                            <p className="text-xs text-amber-600 mt-2 font-medium">
                                                Reseller Available Credits: {resellerInfo.available_credits.toLocaleString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Edit Mode Indicator */}
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700">
                                    {isEditMode ? 'Edit Mode: Modify billing details above' : 'Billing details can be edited before checkout'}
                                </span>
                            </div>
                        </div>

                        <div className="pt-8 flex justify-center">
                            <Button 
                                onClick={handlePayment}
                                disabled={isLoading}
                                className="h-14 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs rounded-xl shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        {isEditMode ? 'Saving Changes...' : 'Redirecting to Payment Gateway...'}
                                    </>
                                ) : (
                                    isEditMode ? 'Save & Continue' : 'Proceed to Checkout'
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>

            {/* Plan Upgrade Confirmation Dialog */}
            <Dialog open={showUpgradeConfirm} onOpenChange={setShowUpgradeConfirm}>
                <DialogContent className="max-w-md">
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
                            <p className="text-amber-900 font-bold text-sm leading-relaxed">
                                You already have an active plan. If you continue purchasing this new plan, all remaining credits from your current plan will be <span className="font-bold text-red-600">permanently lost</span> and will <span className="font-bold">NOT</span> be transferred to the new plan.
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
                            onClick={proceedWithPayment}
                            className="flex-1 sm:flex-none bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl"
                        >
                            Continue Purchase
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 🔥 NEW: Insufficient Reseller Credits Dialog (Combined for Reseller & Sub-user) */}
            <Dialog open={showInsufficientDialog} onOpenChange={setShowInsufficientDialog}>
                <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                                <AlertTriangle className="h-6 w-6 text-red-600" />
                            </div>
                            <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
                                {userRole === 'reseller' ? 'Insufficient Reseller Credits' : 'Reseller Balance Insufficient'}
                            </DialogTitle>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                            <p className="text-sm font-bold text-slate-600 leading-relaxed">
                                {userRole === 'reseller' 
                                    ? `Your sub-user is trying to purchase a plan requiring ${insufficientData?.required_credits?.toLocaleString()} credits, but your current available balance is only ${insufficientData?.reseller_balance?.toLocaleString()} credits. Please purchase or add more credits to continue.`
                                    : `Your reseller currently does not have enough available credits for this plan purchase.`
                                }
                            </p>

                            <div className="grid grid-cols-1 gap-3 pt-2">
                                <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {userRole === 'reseller' ? 'Current Balance' : 'Reseller Available Credits'}
                                    </span>
                                    <span className="font-black text-slate-900">
                                        {insufficientData?.reseller_balance?.toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                        {userRole === 'reseller' ? 'Required Credits' : 'Requested Plan Credits'}
                                    </span>
                                    <span className="font-black text-blue-600">
                                        {insufficientData?.required_credits?.toLocaleString()}
                                    </span>
                                </div>
                                {userRole === 'reseller' && (
                                    <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl border border-red-100">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-red-600">
                                            Additional Credits Needed
                                        </span>
                                        <span className="font-black text-red-600">
                                            {insufficientData?.shortage?.toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {userRole === 'business' && (
                                <p className="text-xs text-slate-500 font-bold text-center italic mt-4">
                                    Please wait for your reseller to increase their balance or choose a smaller plan.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-row gap-3 pt-2">
                        {userRole === 'reseller' ? (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => router.push('/dashboard/reseller/plans')}
                                    className="flex-1 h-12 rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Upgrade Plan
                                </Button>
                                <Button
                                    onClick={() => router.push('/dashboard/reseller/plans?buy=credits')}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
                                >
                                    Purchase Credits
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowInsufficientDialog(false)}
                                    className="flex-1 h-12 rounded-xl border-slate-200 font-black uppercase tracking-widest text-[10px]"
                                >
                                    Contact Reseller
                                </Button>
                                <Button
                                    onClick={() => router.push('/dashboard/user/plans')}
                                    className="flex-1 h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-500/20"
                                >
                                    Choose Another Plan
                                </Button>
                            </>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function CheckoutPage() {
    return (
        <DashboardLayout>
            <Script 
                src="https://checkout.razorpay.com/v1/checkout.js" 
                strategy="afterInteractive" 
            />
            <Suspense fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            }>
                <CheckoutContent />
            </Suspense>
        </DashboardLayout>
    )
}
