"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, ArrowLeft, Edit, User, Building2, Briefcase, Mail, Phone,
    CheckCircle2, Calendar, MapPin, CreditCard, X, Save, XCircle
} from "lucide-react";
import { getGlobalUserById, updateGlobalUser, getPlans } from "@/config/api";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function AdminUserDetailPage({ params, searchParams }: PageProps) {
    const router = useRouter();
    const { id } = use(params);
    const resolvedSearchParams = searchParams ? use(searchParams) : {};
    const isEditMode = resolvedSearchParams.edit === 'true';
    const fromContext = resolvedSearchParams.from as string;

    const handleBack = () => {
        if (fromContext === 'dashboard') {
            router.push('/dashboard/admin');
        } else {
            router.push('/dashboard/admin/users');
        }
    };

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<any>(null);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);
    const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error', title: string, message: string}>({
        show: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showNotification = (type: 'success' | 'error', title: string, message: string) => {
        setNotification({ show: true, type, title, message });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    // Form data state
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [foundUser, plans] = await Promise.all([
                    getGlobalUserById(id),
                    getPlans("BUSINESS")
                ]);

                if (!foundUser) {
                    setError("User intelligence record not found.");
                    return;
                }

                setUser(foundUser);
                setAvailablePlans(plans);
                setFormData({
                    profile: { ...foundUser.profile },
                    business: { ...foundUser.business },
                    address: foundUser.address ? { ...foundUser.address } : { full_address: '', pincode: '', country: 'India' },
                    wallet: { ...foundUser.wallet },
                    plan: { 
                        type: foundUser.plan_name || 'DEMO',
                        plan_id: foundUser.plan_id || '' 
                    },
                    user_type: foundUser.role || 'User',
                    status: foundUser.status
                });
            } catch (err) {
                setError("Failed to synchronize user intelligence.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const handleChange = (section: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateGlobalUser(id, {
                name: formData.profile.name,
                email: formData.profile.email,
                business_name: formData.business.business_name,
                plan_id: formData.plan.plan_id,
                credits_allocated: parseFloat(formData.wallet.credits_allocated)
            });
            showNotification('success', 'Profile Synchronized', "User intelligence record has been updated successfully.");
            setTimeout(() => {
                handleBack();
            }, 1500);
        } catch (err) {
            showNotification('error', 'Update Failed', "System was unable to process the profile synchronization.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-indigo-600" /></div>;
    }

    if (!user || !formData) return <div>Data Unavailable</div>;

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[1700px] mx-auto animate-in fade-in duration-500 relative">
            {/* Custom Notification Module */}
            {notification.show && (
                <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full duration-500">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-md transition-all ${
                        notification.type === 'success' 
                            ? 'bg-emerald-600 text-white border-emerald-400/30' 
                            : 'bg-rose-600 text-white border-rose-400/30'
                    }`}>
                        <div className="bg-white/20 p-2 rounded-xl">
                            {notification.type === 'success' ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                        </div>
                        <div className="min-w-[180px]">
                            <p className="font-black text-sm uppercase tracking-tighter">{notification.title}</p>
                            <p className="text-xs font-bold opacity-90">{notification.message}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:bg-white/10 ml-2 h-8 w-8 p-0 rounded-lg"
                            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
            {/* Conditional Header based on mode */}
            {!isEditMode ? (
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={handleBack} className="rounded-full bg-white shadow-sm border h-10 w-10 text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                           {user.profile.name}
                           <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wider">Connected Dashboard</Badge>
                        </h2>
                    </div>
                </div>
            ) : (
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Edit className="h-7 w-7 text-indigo-600" />
                        Edit User Profile
                    </h2>
                    <p className="text-slate-400 font-medium text-sm pl-10">Update platform member information and structural details</p>
                </div>
            )}

            {isEditMode ? (
                <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-10 space-y-12">
                        <form onSubmit={handleUpdate} className="space-y-12">
                            {/* Edit Form similar to reseller page, reduced to what can be edited by updateGlobalUser */}
                            <div className="space-y-6">
                                <h3 className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User className="h-4 w-4 text-indigo-600" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
                                        <Input value={formData.profile.name} onChange={(e) => handleChange('profile', 'name', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address</label>
                                        <Input value={formData.profile.email} onChange={(e) => handleChange('profile', 'email', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6 border-t pt-10">
                                <h3 className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                     <Building2 className="h-4 w-4 text-indigo-600" />
                                     Business & Plan Information
                                 </h3>
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Company Name</label>
                                         <Input value={formData.business.business_name} onChange={(e) => handleChange('business', 'business_name', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                     </div>
                                     <div className="space-y-2">
                                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Subscription Plan</label>
                                         <select 
                                             value={formData.plan.plan_id || ""} 
                                             onChange={(e) => {
                                                 const planId = e.target.value;
                                                 const selectedPlan = availablePlans.find(p => p.plan_id === planId);
                                                 setFormData((prev: any) => ({
                                                     ...prev,
                                                     plan: { ...prev.plan, plan_id: planId },
                                                     wallet: { ...prev.wallet, credits_allocated: selectedPlan ? selectedPlan.credits_offered : prev.wallet.credits_allocated }
                                                 }));
                                             }}
                                             className="w-full h-12 border border-slate-200 rounded-lg bg-white px-3 text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                                         >
                                             <option value="">Select a Plan</option>
                                             {availablePlans.map(plan => (
                                                 <option key={plan.plan_id} value={plan.plan_id}>{plan.name} ({plan.credits_offered.toLocaleString()} Credits)</option>
                                             ))}
                                         </select>
                                     </div>
                                 </div>
                            </div>
                            <div className="space-y-6 border-t pt-10">
                                <h3 className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                     <CreditCard className="h-4 w-4 text-indigo-600" />
                                     Wallet & Credits
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Allocated Credits</label>
                                        <Input 
                                            type="number" 
                                            value={formData.wallet.credits_allocated} 
                                            onChange={(e) => handleChange('wallet', 'credits_allocated', e.target.value)} 
                                            className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" 
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium italic">Updating this will reset the user's remaining credits to this value.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4 pt-4">
                                <Button variant="outline" type="button" onClick={handleBack} className="h-11 px-8 rounded-lg bg-slate-600 hover:bg-slate-700 text-white border-none flex items-center gap-2">
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="h-11 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20 flex items-center gap-2">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Update Member
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
                    {/* Analytics Summary Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        {[
                            { label: "TOTAL CREDITS", value: user.wallet.credits_allocated, color: "bg-blue-600", icon: CreditCard },
                            { label: "USED CREDITS", value: user.wallet.credits_used, color: "bg-[#4B3DEE]" },
                            { label: "REMAINING CREDITS", value: user.wallet.credits_remaining, color: "bg-[#059669]" }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.color} p-6 rounded-xl text-white flex flex-col justify-center min-h-[100px] shadow-sm`}>
                                <p className="text-[9px] font-bold opacity-80 uppercase tracking-widest mb-1">{stat.label}</p>
                                <h4 className="text-3xl font-bold font-sans tabular-nums tracking-tight">{stat.value.toLocaleString()}</h4>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Middle Column: Details modules */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Personal Details Card */}
                            <Card className="border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-3xl bg-white overflow-hidden p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-slate-800 font-semibold text-[15px] flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-blue-50/80 flex items-center justify-center">
                                            <User className="h-[14px] w-[14px] text-blue-600" />
                                        </div>
                                        Profile Information
                                    </h3>
                                    <Button variant="outline" size="sm" onClick={() => router.push(`?edit=true`)} className="h-8 px-4 rounded-full font-semibold text-xs border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 gap-1.5 transition-all">
                                        <Edit className="h-3 w-3" />
                                        Update Profile
                                    </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    {[
                                        { label: "FULL NAME", value: user.profile.name, icon: User },
                                        { label: "EMAIL ADDRESS", value: user.profile.email, icon: Mail },
                                        { label: "MOBILE NUMBER", value: user.profile.phone, icon: Phone },
                                        { label: "USERNAME", value: user.profile.username || 'N/A', icon: User },
                                        { label: "ROLE/TYPE", value: user.role, icon: Briefcase },
                                        { label: "JOINING DATE", value: user.profile.created_at ? new Date(user.profile.created_at).toLocaleDateString() : 'N/A', icon: Calendar }
                                    ].map((field, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.label}</p>
                                            <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100/50 text-sm font-semibold text-slate-700">
                                                <field.icon className="h-[14px] w-[14px] text-slate-400 opacity-70" />
                                                <span>{field.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Business Context Card */}
                            <Card className="border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-3xl bg-white overflow-hidden p-8">
                                <h3 className="text-slate-800 font-semibold text-[15px] flex items-center gap-3 mb-8">
                                    <div className="h-8 w-8 rounded-full bg-emerald-50/80 flex items-center justify-center">
                                        <Building2 className="h-[14px] w-[14px] text-[#059669]" />
                                    </div>
                                    Business Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    {[
                                        { label: "COMPANY NAME", value: user.business.business_name },
                                        { label: "ORGANIZATION TYPE", value: user.business.business_description || 'Private Limited' },
                                        { label: "GSTIN NUMBER", value: user.business.gstin || 'NOT PROVIDED' },
                                        { label: "ERP SYSTEM", value: user.business.erp_system || 'None Connected' }
                                    ].map((field, idx) => (
                                        <div key={idx} className="space-y-2">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{field.label}</p>
                                            <div className="p-3.5 rounded-xl border border-[#059669]/10 bg-[#059669]/[0.02]">
                                                <span className="text-sm font-bold text-[#059669]">{field.value}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        {/* Right Column: Address & Plan Metadata */}
                        <div className="space-y-6">
                            {/* Status and Summary Header Card */}
                            <Card className="border-none shadow-xl rounded-2xl bg-[#111827] text-white overflow-hidden py-10 px-6 flex flex-col items-center text-center">
                                <div className="h-[72px] w-[72px] rounded-full bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mb-5">
                                     <User className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight mb-1">{user.profile.name}</h3>
                                <p className="text-slate-400 text-xs font-medium mb-5 lowercase">{user.profile.email}</p>
                                <div className="flex gap-2">
                                    <Badge className="bg-[#2563EB]/20 text-[#3B82F6] border border-[#3B82F6]/30 px-3 py-1 font-bold text-[9px] uppercase tracking-wider hover:bg-[#2563EB]/20">{user.role}</Badge>
                                    <Badge className="bg-[#059669]/20 text-[#10B981] border border-[#10B981]/30 px-3 py-1 font-bold text-[9px] uppercase tracking-wider hover:bg-[#059669]/20">{user.status}</Badge>
                                </div>
                            </Card>

                            {/* Plan & Wallet Card */}
                            <Card className="border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl bg-white p-7">
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CURRENT PLAN</span>
                                        <Badge className="bg-amber-100 text-[#D97706] border-none font-bold text-[10px] px-3 py-1 uppercase tracking-wider">{user.plan_name || 'DEMO'}</Badge>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(user.wallet.credits_remaining / (user.wallet.credits_allocated || 1)) * 100}%` }}></div>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold tracking-wide uppercase">
                                        <span className="text-slate-400">CREDITS REMAINING</span>
                                        <span className="text-blue-600">{user.wallet.credits_remaining.toLocaleString()} / {user.wallet.credits_allocated.toLocaleString()}</span>
                                    </div>
                                </div>
                                
                                <div className="border-t border-slate-100 mt-6 pt-6 space-y-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ACCOUNT METADATA</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">WhatsApp Mode</span>
                                            <span className="font-semibold text-slate-800">{user.whatsapp_mode || 'official'}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-slate-500 font-medium">Account Expiry</span>
                                            <span className="font-semibold text-slate-800">{user.plan_expiry ? new Date(user.plan_expiry).toISOString().replace('T', ' ').substring(0, 19) : 'Forever'}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Location Card */}
                            <Card className="border-none shadow-[0_4px_24px_rgba(0,0,0,0.02)] rounded-2xl bg-white p-7">
                                <h3 className="text-[13px] font-semibold text-slate-800 flex items-center gap-2 mb-6">
                                    <div className="h-6 w-6 rounded-full bg-emerald-50/80 flex items-center justify-center">
                                        <MapPin className="h-3 w-3 text-[#059669]" />
                                    </div>
                                    Address
                                </h3>
                                <div className="space-y-5">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FULL ADDRESS</p>
                                        <p className="text-sm font-semibold text-slate-700 mt-1.5 leading-relaxed">{user.address?.full_address || 'No address provided.'}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PINCODE</p>
                                            <p className="text-[13px] font-semibold text-slate-700 mt-1">{user.address?.pincode || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">COUNTRY</p>
                                            <p className="text-[13px] font-semibold text-slate-700 mt-1">{user.address?.country || 'India'}</p>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
