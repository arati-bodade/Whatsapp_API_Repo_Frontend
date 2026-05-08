"use client";

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { businessService, BusinessProfile } from '@/services/businessService';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Loader2, 
    ArrowLeft, 
    Edit, 
    User, 
    Building2, 
    Briefcase, 
    Mail,
    Phone,
    CheckCircle2,
    Calendar,
    Settings,
    MapPin,
    CreditCard,
    X,
    Save
} from "lucide-react";

interface PageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default function UserDetailPage({ params, searchParams }: PageProps) {
    const router = useRouter();
    const { id } = use(params);
    const resolvedSearchParams = searchParams ? use(searchParams) : {};
    const isEditMode = resolvedSearchParams.edit === 'true';

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [user, setUser] = useState<BusinessProfile | null>(null);

    // Form data state
    const [formData, setFormData] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
                const resellerId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');
                if (!token || !resellerId) return;

                const users = await businessService.getBusinessesByReseller(resellerId, token);
                const foundUser = users.find((u: any) => u.busi_user_id === id);

                if (!foundUser) {
                    setError("User intelligence record not found.");
                    return;
                }

                setUser(foundUser);
                setFormData({
                    profile: { 
                        name: foundUser.profile.name || '',
                        email: foundUser.profile.email || '',
                        phone: foundUser.profile.phone || ''
                    },
                    business: { 
                        ...foundUser.business, 
                        business_name: foundUser.business.business_name || '',
                        organization_type: foundUser.business.business_name || '', 
                        bank_name: foundUser.business.bank_name || '',
                        erp_system: foundUser.business.erp_system || '',
                        gstin: foundUser.business.gstin || ''
                    },
                    address: foundUser.address ? { 
                        ...foundUser.address,
                        full_address: foundUser.address.full_address || '',
                        pincode: foundUser.address.pincode || '',
                        country: foundUser.address.country || 'India'
                    } : { full_address: '', pincode: '', country: 'India' },
                    wallet: { 
                        credits_allocated: foundUser.wallet.credits_allocated || 0,
                        expiry_days: 3,
                        total_messages: 30,
                    },
                    plan: { type: foundUser.plan_name || 'DEMO' },
                    user_type: foundUser.role || 'User',
                    status: foundUser.status || 'Active'
                });
            } catch (err) {
                setError("Failed to synchronize user intelligence.");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
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
            const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
            if (!token) return;
            await businessService.update(id, formData, token);
            router.push('/dashboard/reseller/users');
        } catch (err) {
            alert("Database integrity rejection during update.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;
    }

    if (!user || !formData) return <div>Data Unavailable</div>;

    return (
        <div className="flex-1 space-y-8 p-8 max-w-[1700px] mx-auto animate-in fade-in duration-500">
            {/* Conditional Header based on mode */}
            {!isEditMode ? (
                <div className="flex items-center gap-6">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border h-10 w-10 text-slate-500">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                           {user.profile.name}
                           <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-[10px] font-bold">Connected</Badge>
                        </h2>
                    </div>
                </div>
            ) : (
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
                        <Edit className="h-7 w-7 text-blue-600" />
                        Edit User
                    </h2>
                    <p className="text-slate-400 font-medium text-sm pl-10">Update user information and plan details</p>
                </div>
            )}

            {isEditMode ? (
                <Card className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white">
                    <CardContent className="p-10 space-y-12">
                        <form onSubmit={handleUpdate} className="space-y-12">
                            {/* Personal Information Module */}
                            <div className="space-y-6">
                                <h3 className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                    <User className="h-4 w-4 text-blue-600" />
                                    Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name <span className="text-red-500">*</span></label>
                                        <Input value={formData.profile.name} onChange={(e) => handleChange('profile', 'name', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Email Address <span className="text-red-500">*</span></label>
                                        <Input value={formData.profile.email} onChange={(e) => handleChange('profile', 'email', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Mobile Number <span className="text-red-500">*</span></label>
                                        <Input value={formData.profile.phone} onChange={(e) => handleChange('profile', 'phone', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Date of Joining</label>
                                        <Input disabled value={new Date(user.profile.created_at || new Date()).toISOString().split('T')[0]} className="h-12 bg-slate-50 border-slate-200 rounded-lg text-slate-500 font-bold opacity-70" />
                                    </div>
                                </div>
                            </div>

                            {/* Business Information Module */}
                            <div className="space-y-6 border-t pt-10">
                                <h3 className="text-slate-600 font-bold text-xs uppercase tracking-[0.2em] flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-blue-600" />
                                    Business Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Company Name <span className="text-red-500">*</span></label>
                                        <Input value={formData.business.business_name} onChange={(e) => handleChange('business', 'business_name', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Organization Type <span className="text-red-500">*</span></label>
                                        <Input value={formData.business.organization_type} onChange={(e) => handleChange('business', 'organization_type', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Pincode</label>
                                        <Input value={formData.address.pincode || ''} onChange={(e) => handleChange('address', 'pincode', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">ERP Type</label>
                                        <select className="flex h-12 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold" value={formData.business.erp_system || ''} onChange={(e) => handleChange('business', 'erp_system', e.target.value)}>
                                            <option value="">Please select</option>
                                            <option value="SAP">SAP</option>
                                            <option value="Tally">Tally</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Bank Name</label>
                                        <Input value={formData.business.bank_name || ''} onChange={(e) => handleChange('business', 'bank_name', e.target.value)} className="h-12 border-slate-200 rounded-lg text-slate-700 font-semibold" />
                                    </div>
                                </div>
                            </div>


                            <div className="flex justify-end gap-4 pt-4">
                                <Button variant="outline" type="button" onClick={() => router.back()} className="h-11 px-8 rounded-lg bg-slate-600 hover:bg-slate-700 text-white border-none flex items-center gap-2">
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting} className="h-11 px-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 flex items-center gap-2">
                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Update User
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            ) : (
                /* Original View Profile Logic - Redacted here for brevity but kept in file */
                <div className="space-y-8 animate-in slide-in-from-bottom duration-700">
                    {/* Analytics Summary Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[
                            { label: "TOTAL CREDITS", value: user.wallet.credits_allocated, color: "bg-gradient-to-br from-blue-600 to-blue-700", icon: CreditCard },
                            { label: "USED CREDITS", value: user.wallet.credits_used, color: "bg-gradient-to-br from-indigo-600 to-indigo-800" },
                            { label: "REMAINING CREDITS", value: user.wallet.credits_remaining, color: "bg-gradient-to-br from-emerald-500 to-emerald-600" }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.color} p-5 rounded-2xl shadow-xl shadow-slate-200/50 text-white flex flex-col justify-center min-h-[90px] border border-white/10 hover:scale-[1.02] transition-transform cursor-default`}>
                                <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                                <h4 className="text-3xl font-black tabular-nums">{stat.value.toLocaleString()}</h4>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Middle Column: Details modules */}
                        <div className="lg:col-span-2 space-y-8">
                            {/* Personal Details Card */}
                            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="text-slate-700 font-bold text-sm flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                                <User className="h-4 w-4 text-blue-600" />
                                            </div>
                                            Profile Information
                                        </h3>
                                        <Button variant="outline" size="sm" onClick={() => router.push(`?edit=true`)} className="h-9 px-4 rounded-xl font-bold text-xs border-slate-200 hover:bg-slate-100 transition-colors gap-2">
                                            <Edit className="h-3 w-3" />
                                            Update Profile
                                        </Button>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                        {[
                                            { label: "Full Name", value: user.profile.name, icon: User },
                                            { label: "Email Address", value: user.profile.email, icon: Mail },
                                            { label: "Mobile Number", value: user.profile.phone, icon: Phone },
                                            { label: "Username", value: user.profile.username || 'N/A', icon: User },
                                            { label: "Role/Type", value: user.role, icon: Briefcase },
                                            { label: "Joining Date", value: user.profile.created_at ? new Date(user.profile.created_at).toLocaleDateString() : 'N/A', icon: Calendar }
                                        ].map((field, idx) => (
                                            <div key={idx} className="space-y-1.5 group">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{field.label}</p>
                                                <div className="flex items-center gap-3 bg-slate-50/50 p-3.5 rounded-2xl group-hover:bg-slate-50 transition-colors border border-transparent group-hover:border-slate-100">
                                                    <field.icon className="h-4 w-4 text-slate-400" />
                                                    <span className="text-sm font-bold text-slate-700">{field.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Business Context Card */}
                            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="bg-slate-50/50 px-8 py-5 border-b border-slate-100">
                                        <h3 className="text-slate-700 font-bold text-sm flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                                <Building2 className="h-4 w-4 text-emerald-600" />
                                            </div>
                                            Business Details
                                        </h3>
                                    </div>
                                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                        {[
                                            { label: "Company Name", value: user.business.business_name },
                                            { label: "Organization Type", value: user.business.business_description || 'Private Limited' },
                                            { label: "GSTIN Number", value: user.business.gstin || 'NOT PROVIDED' },
                                            { label: "ERP System", value: user.business.erp_system || 'None Connected' }
                                        ].map((field, idx) => (
                                            <div key={idx} className="space-y-1.5">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">{field.label}</p>
                                                <div className="bg-emerald-50/30 p-3.5 rounded-2xl border border-emerald-100/50">
                                                    <span className="text-sm font-bold text-emerald-900">{field.value}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Address & Plan Metadata */}
                        <div className="space-y-8">
                            {/* Status and Summary Header Card */}
                            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-slate-900 text-white overflow-hidden p-8 flex flex-col items-center text-center">
                                <div className="h-20 w-20 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center mb-4">
                                     <User className="h-10 w-10 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold">{user.profile.name}</h3>
                                <p className="text-slate-400 text-xs font-medium mb-4">{user.profile.email}</p>
                                <div className="flex gap-2">
                                    <Badge className="bg-blue-600/20 text-blue-400 border-blue-600/30 hover:bg-blue-600/20 px-3 py-1 font-bold text-[10px] uppercase">{user.role}</Badge>
                                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 px-3 py-1 font-bold text-[10px] uppercase">{user.status}</Badge>
                                </div>
                            </Card>

                            {/* Plan & Wallet Card */}
                            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden">
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CURRENT PLAN</span>
                                            <Badge className="bg-amber-100 text-amber-700 border-none font-black text-xs px-3">{user.plan_name || 'DEMO'}</Badge>
                                        </div>
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                             <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(user.wallet.credits_remaining / user.wallet.credits_allocated) * 100}%` }}></div>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold">
                                            <span className="text-slate-500">CREDITS REMAINING</span>
                                            <span className="text-blue-600">{user.wallet.credits_remaining.toLocaleString()} / {user.wallet.credits_allocated.toLocaleString()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="border-t pt-6 space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ACCOUNT METADATA</p>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">WhatsApp Mode</span>
                                                <span className="font-bold text-slate-700">{user.whatsapp_mode || 'Official'}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-500 font-medium">Account Expiry</span>
                                                <span className="font-bold text-slate-700">{user.plan_expiry || 'Forever'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Location Card */}
                            <Card className="border-none shadow-xl shadow-slate-100 rounded-3xl bg-white overflow-hidden">
                                <div className="p-6 space-y-6">
                                    <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-emerald-500" />
                                        Address
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Full Address</p>
                                            <p className="text-sm font-bold text-slate-700 mt-1 leading-relaxed">{user.address?.full_address || 'No address provided.'}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Pincode</p>
                                                <p className="text-sm font-bold text-slate-700 mt-1">{user.address?.pincode || 'N/A'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Country</p>
                                                <p className="text-sm font-bold text-slate-700 mt-1">{user.address?.country || 'India'}</p>
                                            </div>
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
