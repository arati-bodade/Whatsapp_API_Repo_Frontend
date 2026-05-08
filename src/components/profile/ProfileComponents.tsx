"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    ShieldCheck, User, Building2, Layout, Lock,
    Save, X, Loader2, CreditCard, Wallet,
    TrendingUp, DollarSign, Calendar, Mail,
    Phone, MapPin, Briefcase, Globe,
    Camera, Trash2, CheckCircle2,
    Eye, EyeOff
} from "lucide-react"
import { useState, useRef } from "react"
import { Input } from "@/components/ui/input"
import resellerService from "@/services/resellerService"
import profilePhotoService from "@/services/profilePhotoService"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { API_BASE_URL } from "@/config/api"

interface ProfileProps {
    data: any | null
    onUpdate?: (updatedData: any) => Promise<void>
}

/* ── Profile Hero Banner ── */
export function ProfileHeader({ data, onUpdate }: { data: any, onUpdate?: (updatedData: any) => Promise<void> }) {
    const { token } = useAuth()
    const [isUploading, setIsUploading] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    if (!data) return null

    const name = data.profile?.name || data.profile?.username || "User"
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
    const isActive = data.status === "active" || data.whatsapp_mode === "active"
    const rawPhotoUrl = data.profile?.profile_image || null
    
    // 🔥 Handle relative URLs by prefixing with backend base URL
    const getPhotoUrl = (url: string | null) => {
        if (!url) return null;
        if (url.startsWith('http') || url.startsWith('blob:')) return url;
        const backendBaseUrl = API_BASE_URL.replace('/api', '');
        
        // Handle paths that already have the prefix
        if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
            return `${backendBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
        }
        
        // Fallback: Add prefix for old relative paths (like 'users/xxx.jpg')
        return `${backendBaseUrl}/uploads/profile_images/${url.startsWith('/') ? url.substring(1) : url}`;
    };
    
    const photoUrl = getPhotoUrl(rawPhotoUrl);

    const handleUploadClick = () => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !token) return

        setIsUploading(true)
        try {
            const resizedFile = await profilePhotoService.resizeImage(file)
            await profilePhotoService.uploadProfilePhoto(resizedFile, token)
            if (onUpdate) await onUpdate({})
        } catch (err) {
            console.error("Failed to upload photo:", err)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleDeletePhoto = async () => {
        if (!token) return
        setIsDeleting(true)
        try {
            await profilePhotoService.deleteProfilePhoto(token)
            if (onUpdate) await onUpdate({})
        } catch (err) {
            console.error("Failed to delete photo:", err)
        } finally {
            setIsDeleting(false)
            setIsDeleteDialogOpen(false)
        }
    }

    return (
        <div className="rounded-2xl p-8 relative overflow-hidden bg-white border border-slate-100 shadow-sm">
            <div className="relative flex items-start gap-8 flex-wrap">
                {/* Profile Photo with Actions */}
                <div className="relative group shrink-0">
                    <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-50 border-4 border-white shadow-xl relative">
                        {photoUrl ? (
                            <img 
                                src={photoUrl} 
                                alt="Profile" 
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                <User className="w-12 h-12 text-slate-400" />
                            </div>
                        )}
                        
                        {/* Loading Overlays */}
                        {(isUploading || isDeleting) && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-[#128C7E]" />
                            </div>
                        )}

                        {/* Action Buttons Overlay - Now visible on hover or if no photo */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-[1px]">
                            <button 
                                onClick={handleUploadClick}
                                disabled={isUploading || isDeleting}
                                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg border border-white/30"
                                title="Change Photo"
                            >
                                <Camera className="w-5 h-5" />
                            </button>
                            {photoUrl && (
                                <button 
                                    onClick={() => setIsDeleteDialogOpen(true)}
                                    disabled={isUploading || isDeleting}
                                    className="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500/40 text-white flex items-center justify-center backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg border border-red-500/30"
                                    title="Delete Photo"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>

                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                        <DialogContent className="sm:max-w-[360px] rounded-2xl p-6 shadow-2xl border border-gray-100 bg-white">
                            <DialogHeader className="text-left">
                                <DialogTitle className="text-xl font-bold text-gray-900">Delete Profile Photo?</DialogTitle>
                                <DialogDescription className="text-gray-500 font-medium pt-2">
                                    Are you sure you want to remove your photo? This action cannot be undone.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="flex gap-3 mt-6">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsDeleteDialogOpen(false)}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl font-bold border-gray-200"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    variant="destructive" 
                                    onClick={handleDeletePhoto}
                                    disabled={isDeleting}
                                    className="flex-1 rounded-xl font-bold bg-red-600 hover:bg-red-700"
                                >
                                    {isDeleting ? "Deleting..." : "Yes, Delete"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                    
                    {/* Status Dot */}
                    <span className={cn(
                        "absolute bottom-2 right-2 h-5 w-5 rounded-full border-4 border-white shadow-md z-20",
                        isActive ? "bg-green-500" : "bg-red-500"
                    )} />

                    {/* Hidden File Input */}
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="image/*"
                    />
                </div>

                {/* Profile Info */}
                <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-1">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight capitalize">{name}</h1>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100 uppercase tracking-wider">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                        </span>
                    </div>
                    
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">
                        {data.role === "business_owner" ? "Super Admin" : (data.role === "reseller" ? "Reseller" : data.role || "User")}
                        <span className="mx-2 text-slate-300">•</span>
                        System Infrastructure
                    </p>

                    <div className="flex items-center gap-6 text-slate-500 text-sm font-medium mb-6">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-blue-500" />
                            </div>
                            <span>{data.address?.country || "Pune"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <Calendar className="w-4 h-4 text-purple-500" />
                            </div>
                            <span>Joined April 2026</span>
                        </div>
                    </div>

                    <p className="text-slate-600 max-w-2xl leading-relaxed font-medium">
                        Experienced system administrator specializing in large-scale WhatsApp infrastructure and automation systems.
                    </p>
                </div>
            </div>
        </div>
    )
}

/* ── Profile Stats (soft pastel) ── */
export function ProfileStats({ data, isLoading = false }: { data: any; isLoading?: boolean }) {
    if (!data && !isLoading) return null

    // Show loading state
    if (isLoading) {
        const loadingStats = [
            {
                label: "Total Credits",
                value: "Loading...",
                icon: DollarSign,
                bg: "#EFF6FF", iconBg: "#DBEAFE", iconColor: "#2563EB", textColor: "#1D4ED8", borderColor: "#BFDBFE",
            },
            {
                label: "Used Credits",
                value: "Loading...",
                icon: TrendingUp,
                bg: "#F5F3FF", iconBg: "#EDE9FE", iconColor: "#7C3AED", textColor: "#6D28D9", borderColor: "#DDD6FE",
            },
            {
                label: "Remaining Credits",
                value: "Loading...",
                icon: CreditCard,
                bg: "#F0FDF4", iconBg: "#DCFCE7", iconColor: "#16A34A", textColor: "#15803D", borderColor: "#BBF7D0",
            },
            {
                label: "Available to Distribute",
                value: "Loading...",
                icon: Wallet,
                bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#D97706", textColor: "#B45309", borderColor: "#FDE68A",
            },
        ]
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
                {loadingStats.map((s, i) => {
                    const Icon = s.icon
                    return (
                        <div
                            key={i}
                            className="rounded-2xl p-4 border flex items-start gap-3 transition-all duration-200 opacity-50"
                            style={{ background: s.bg, borderColor: s.borderColor }}
                        >
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
                                <Icon className="h-4 w-4" style={{ color: s.iconColor }} />
                            </div>
                            <div>
                                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.textColor, opacity: 0.65 }}>
                                    {s.label}
                                </p>
                                <p className="text-lg font-bold tracking-tight mt-0.5" style={{ color: s.textColor }}>
                                    {s.value}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    const stats = [
        {
            label: "Total Credits",
            value: (data.wallet?.total_credits || data.wallet?.credits_allocated || 0).toLocaleString(),
            icon: DollarSign,
            bg: "#EFF6FF", iconBg: "#DBEAFE", iconColor: "#2563EB", textColor: "#1D4ED8", borderColor: "#BFDBFE",
        },
        {
            label: "Used Credits",
            value: (data.wallet?.used_credits || data.wallet?.credits_used || 0).toLocaleString(),
            icon: TrendingUp,
            bg: "#F5F3FF", iconBg: "#EDE9FE", iconColor: "#7C3AED", textColor: "#6D28D9", borderColor: "#DDD6FE",
        },
        {
            label: "Remaining Credits",
            value: (data.wallet?.credits_remaining ?? Math.max(0, (data.wallet?.credits_allocated || 0) - (data.wallet?.credits_used || 0))).toLocaleString(),
            icon: CreditCard,
            bg: "#F0FDF4", iconBg: "#DCFCE7", iconColor: "#16A34A", textColor: "#15803D", borderColor: "#BBF7D0",
        },
        {
            label: "Total Balance",
            value: (data.wallet?.available_credits ?? data.wallet?.credits_remaining ?? 0).toLocaleString(),
            icon: Wallet,
            bg: "#FFFBEB", iconBg: "#FEF3C7", iconColor: "#D97706", textColor: "#B45309", borderColor: "#FDE68A",
        },
    ]

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger-children">
            {stats.map((s, i) => {
                const Icon = s.icon
                return (
                    <div
                        key={i}
                        className="rounded-2xl p-4 border flex items-start gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                        style={{ background: s.bg, borderColor: s.borderColor }}
                    >
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
                            <Icon className="h-4 w-4" style={{ color: s.iconColor }} />
                        </div>
                        <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: s.textColor, opacity: 0.65 }}>
                                {s.label}
                            </p>
                            <p className="text-lg font-bold tracking-tight mt-0.5" style={{ color: s.textColor }}>
                                {s.value}
                            </p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ── Personal Info Section ── */
export function PersonalInfoSection({ data, onUpdate }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: data?.profile?.name || "",
        email: data?.profile?.email || "",
        phone: data?.profile?.phone || "",
        country: data?.address?.country || "",
        full_address: data?.address?.full_address || "",
    })

    const handleSave = async () => {
        if (!onUpdate) return
        setLoading(true)
        try {
            await onUpdate({
                profile: { name: formData.name, email: formData.email, phone: formData.phone, username: data?.profile?.username },
                address: { country: formData.country, full_address: formData.full_address },
            })
            setIsEditing(false)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                        </div>
                        <CardTitle className="text-[15px] font-semibold text-slate-800">Personal Information</CardTitle>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-1.5">
                            <Button variant="ghost" size="sm"
                                className="text-green-600 h-8 px-3 text-xs font-semibold hover:bg-green-50 gap-1"
                                onClick={handleSave} disabled={loading}>
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Save
                            </Button>
                            <Button variant="ghost" size="sm"
                                className="text-red-500 h-8 px-3 text-xs font-semibold hover:bg-red-50 gap-1"
                                onClick={() => setIsEditing(false)} disabled={loading}>
                                <X className="h-3 w-3" /> Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm"
                            className="text-[#128C7E] h-8 px-3 text-xs font-semibold hover:bg-teal-50"
                            onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Full Name", key: "name", icon: User },
                            { label: "Email Address", key: "email", icon: Mail },
                            { label: "Mobile Number", key: "phone", icon: Phone },
                            { label: "Country", key: "country", icon: Globe },
                            { label: "Address", key: "full_address", icon: MapPin },
                        ].map(({ label, key, icon: Icon }) => (
                            <div key={key} className={cn("space-y-1.5", key === "full_address" ? "col-span-2" : "")}>
                                <label className="section-label flex items-center gap-1">
                                    <Icon className="h-3 w-3" />{label}
                                </label>
                                <Input
                                    value={formData[key as keyof typeof formData]}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="h-10 rounded-xl border-slate-200 focus:border-[#128C7E] focus:ring-[#128C7E]/20"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <InfoItem icon={User}   label="Full Name"     value={data?.profile?.name || "Not provided"} />
                        <InfoItem icon={Mail}   label="Email Address" value={data?.profile?.email || "Not provided"} />
                        <InfoItem icon={Phone}  label="Mobile Number" value={data?.profile?.phone || "Not provided"} />
                        <InfoItem icon={Globe}  label="Country"       value={data?.address?.country || "Not specified"} />
                        <InfoItem icon={MapPin} label="Address"       value={data?.address?.full_address || "Not specified"} fullWidth />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/* ── Business Info Section ── */
export function BusinessInfoSection({ data, onUpdate }: ProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        business_name: data?.business?.business_name || data?.business?.company_name || "",
        organization_type: data?.business?.organization_type || "",
        erp_system: data?.business?.erp_system || data?.business?.erp_type || "",
        bank_name: data?.business?.bank_name || data?.bank?.bank_name || "",
    })

    const handleSave = async () => {
        if (!onUpdate) return
        setLoading(true)
        try {
            const businessData: any = {
                business_name: formData.business_name,
                organization_type: formData.organization_type,
                erp_system: formData.erp_system,
                bank_name: formData.bank_name || null, // Always include bank_name in business object
            }

            const payload: any = { business: businessData }

            await onUpdate(payload)
            setIsEditing(false)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-purple-600" />
                        </div>
                        <CardTitle className="text-[15px] font-semibold text-slate-800">Business Information</CardTitle>
                    </div>
                    {isEditing ? (
                        <div className="flex gap-1.5">
                            <Button variant="ghost" size="sm"
                                className="text-green-600 h-8 px-3 text-xs font-semibold hover:bg-green-50 gap-1"
                                onClick={handleSave} disabled={loading}>
                                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                Save
                            </Button>
                            <Button variant="ghost" size="sm"
                                className="text-red-500 h-8 px-3 text-xs font-semibold hover:bg-red-50 gap-1"
                                onClick={() => setIsEditing(false)}>
                                <X className="h-3 w-3" /> Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button variant="ghost" size="sm"
                            className="text-[#128C7E] h-8 px-3 text-xs font-semibold hover:bg-teal-50"
                            onClick={() => setIsEditing(true)}>
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                {isEditing ? (
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { label: "Company Name",      key: "business_name" },
                            { label: "Organization Type", key: "organization_type" },
                            { label: "ERP Type",          key: "erp_system" },
                            { label: "Bank Name",         key: "bank_name" },
                        ].map(({ label, key }) => (
                            <div key={key} className="space-y-1.5">
                                <label className="section-label">{label}</label>
                                <Input
                                    value={formData[key as keyof typeof formData]}
                                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                                    className="h-10 rounded-xl border-slate-200 focus:border-[#128C7E] focus:ring-[#128C7E]/20"
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                        <InfoItem icon={Briefcase} label="Company Name"      value={data?.business?.business_name      || data?.business?.company_name || "Not provided"} />
                        <InfoItem icon={Building2} label="Organization Type" value={data?.business?.organization_type || "Not provided"} />
                        <InfoItem icon={Layout}    label="ERP Type"          value={data?.business?.erp_system         || data?.business?.erp_type      || "Not provided"} />
                        <InfoItem icon={Building2} label="Bank Name"         value={data?.business?.bank_name         || data?.bank?.bank_name         || "Not provided"} />
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

/* ── Account Details ── */
export function AccountDetailsSection({ data }: { data: any }) {
    if (!data) return null
    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                        <Layout className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-[15px] font-semibold text-slate-800">Account Details</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-5">
                    <InfoItem icon={CreditCard} label="Plan Type"  value={data?.plan_name || data?.plan?.plan_name || "N/A"} />
                    <InfoItem icon={User}       label="User Type"  value={data?.role === "business_owner" ? "Business User" : (data?.role === "reseller" ? "Reseller" : data?.role || "N/A")} />
                    <InfoItem icon={Calendar}   label="Expiry Date" value={data?.plan_expiry ? new Date(data.plan_expiry).toLocaleDateString() : "UNLIMITED"} isDynamic />
                    <InfoItem icon={User}       label="Username"   value={data?.profile?.username || "N/A"} />
                </div>
            </CardContent>
        </Card>
    )
}

/* ── Security Settings ── */
export function SecuritySettingsSection() {
    const [open, setOpen] = useState(false)
    const [currentPassword, setCurrentPassword] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [confirmError, setConfirmError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPass, setShowPass] = useState({ current: false, new: false, confirm: false })

    const toggleVisibility = (key: 'current' | 'new' | 'confirm') => {
        setShowPass(prev => ({ ...prev, [key]: !prev[key] }))
    }

    // Real-time validation for password matching
    useEffect(() => {
        if (confirmPassword && newPassword !== confirmPassword) {
            setConfirmError("Passwords do not match")
        } else {
            setConfirmError(null)
        }
    }, [newPassword, confirmPassword])

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null); setSuccess(false)
        if (newPassword !== confirmPassword) { setError("Passwords do not match."); return }
        if (newPassword === currentPassword) { setError("New password cannot be the same as current password."); return }
        if (newPassword.length < 6) { setError("New password must be at least 6 characters."); return }
        setLoading(true)
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (!token) throw new Error("No authentication token found")
            await resellerService.changePassword(token, { current_password: currentPassword, new_password: newPassword })
            setSuccess(true)
            setCurrentPassword(""); setNewPassword(""); setConfirmPassword("")
            setTimeout(() => { setOpen(false); setSuccess(false) }, 2000)
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update password. Please check your current password.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border border-slate-100 shadow-sm hover:shadow-md transition-shadow bg-white">
            <CardHeader className="pb-4 border-b border-slate-50">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-amber-600" />
                    </div>
                    <CardTitle className="text-[15px] font-semibold text-slate-800">Security Settings</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center justify-center text-center space-y-4 min-h-[220px]">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center float">
                    <ShieldCheck className="h-7 w-7 text-slate-300" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-slate-600">Password Protection</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[180px]">Keep your account secure by updating your password regularly.</p>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#128C7E] hover:bg-[#0e7468] text-white font-semibold px-6 rounded-xl shadow-sm shadow-teal-200 btn-press">
                            Change Password
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[420px] rounded-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold">Change Password</DialogTitle>
                            <DialogDescription className="text-sm text-slate-500">Update your password to keep your account secure.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handlePasswordChange} className="space-y-4 py-2">
                            {error && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium flex items-center gap-2">
                                    <X className="h-3.5 w-3.5 shrink-0" />{error}
                                </div>
                            )}
                            {success && (
                                <div className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                                    ✓ Password updated successfully!
                                </div>
                            )}
                            {[
                                { label: "Current Password", key: "current", value: currentPassword, set: setCurrentPassword, visible: showPass.current },
                                { label: "New Password",     key: "new",     value: newPassword,     set: setNewPassword,     visible: showPass.new },
                                { label: "Confirm Password", key: "confirm", value: confirmPassword, set: setConfirmPassword, visible: showPass.confirm },
                            ].map(({ label, key, value, set, visible }) => (
                                <div key={key} className="space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <label className="section-label">{label}</label>
                                        {key === 'confirm' && confirmError && (
                                            <span className="text-[10px] font-bold text-red-500 animate-pulse">
                                                {confirmError}
                                            </span>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Input type={visible ? "text" : "password"} required value={value}
                                            onChange={(e) => set(e.target.value)}
                                            className={cn(
                                                "h-10 rounded-xl border-slate-200 focus:border-[#128C7E] pr-10",
                                                key === 'confirm' && confirmError ? "border-red-300 bg-red-50/30" : ""
                                            )}
                                            placeholder={`Enter ${label.toLowerCase()}`} />
                                        <button
                                            type="button"
                                            onClick={() => toggleVisibility(key as any)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {key === 'new' && (
                                        <p className="text-[10px] text-slate-400 font-medium">
                                            Minimum 6 characters required for better security.
                                        </p>
                                    )}
                                </div>
                            ))}
                            <DialogFooter className="pt-2">
                                <Button type="submit" disabled={loading || !!confirmError}
                                    className={cn(
                                        "w-full text-white font-semibold h-11 rounded-xl btn-press transition-all",
                                        confirmError ? "bg-slate-300 cursor-not-allowed" : "bg-[#128C7E] hover:bg-[#0e7468] shadow-sm shadow-teal-100"
                                    )}>
                                    {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Updating…</> : "Update Password"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

/* ── Shared info item ── */
function InfoItem({ label, value, fullWidth = false, isDynamic = false, icon: Icon }: {
    label: string; value: string; fullWidth?: boolean; isDynamic?: boolean; icon?: any
}) {
    return (
        <div className={cn("flex flex-col gap-1", fullWidth ? "col-span-2" : "")}>
            <span className="section-label flex items-center gap-1">
                {Icon && <Icon className="h-2.5 w-2.5" />}{label}
            </span>
            <span className={cn(
                "text-sm font-semibold text-slate-800",
                isDynamic && "text-[#128C7E]"
            )}>
                {value}
            </span>
        </div>
    )
}
