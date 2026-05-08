"use client"

import { 
    Users, CreditCard, ShoppingCart, 
    ArrowUpRight, ArrowDownRight, 
    MoreHorizontal, Share2, 
    Activity, Globe, User, 
    Wallet, TrendingUp, BarChart3,
    ArrowRight, ShieldCheck,
    LayoutDashboard, Zap,
    TrendingDown, Clock, Search,
    Eye, Edit2, Trash2, ArrowUpDown,
    CheckCircle2, XCircle, AlertTriangle, X
} from "lucide-react";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminAnalytics, getResellers, deleteGlobalUser } from "@/config/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    Legend
} from 'recharts';

export default function AdminDashboardPage() {
    const router = useRouter();
    const [analytics, setAnalytics] = useState<any>(null);
    const [resellers, setResellers] = useState<any[]>([]);
    const [selectedReseller, setSelectedReseller] = useState<string>("all");
    const [loading, setLoading] = useState(true);

    // Delete state
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [resellerToDelete, setResellerToDelete] = useState<any>(null);

    const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error' | 'info', title: string, message: string}>({
        show: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
        setNotification({ show: true, type, title, message });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Determine if we need filtered or global analytics
                const resId = selectedReseller === "all" ? undefined : selectedReseller;
                const data = await getAdminAnalytics(resId);
                
                // Only load resellers list once
                if (resellers.length === 0) {
                    const resellerData = await getResellers();
                    setResellers(resellerData);
                }
                
                setAnalytics(data);
            } catch (err) {
                console.error('Failed to load admin data', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [selectedReseller]);

    const handleViewReseller = (reseller: any) => {
        router.push(`/dashboard/admin/users/${reseller.reseller_id}?from=dashboard`);
    };

    const handleEditReseller = (reseller: any) => {
        router.push(`/dashboard/admin/users/${reseller.reseller_id}?edit=true&from=dashboard`);
    };

    const handleDeleteReseller = (reseller: any) => {
        setResellerToDelete(reseller);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteReseller = async () => {
        if (!resellerToDelete) return;
        setIsDeleting(true);
        try {
            await deleteGlobalUser(resellerToDelete.reseller_id);
            setResellers(prev => prev.filter(r => r.reseller_id !== resellerToDelete.reseller_id));
            setIsDeleteModalOpen(false);
            setResellerToDelete(null);
            showNotification('success', 'Reseller Deleted', "The reseller account has been removed from the directory.");
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || "Failed to remove reseller.";
            showNotification('error', 'Operation Failed', errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] stagger-children">
                <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4">
                    <LoaderIcon />
                </div>
                <p className="text-muted-foreground font-medium animate-pulse">Initializing Platform Oversight...</p>
            </div>
        );
    }

    return (
        <div className="page-enter space-y-8 pb-12 relative font-sans">
            {/* Custom Notification Module */}
            {notification.show && (
                <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full duration-500">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-md transition-all ${
                        notification.type === 'success' 
                            ? 'bg-emerald-600 text-white border-emerald-400/30' 
                            : notification.type === 'error'
                            ? 'bg-rose-600 text-white border-rose-400/30'
                            : 'bg-indigo-600 text-white border-indigo-400/30'
                    }`}>
                        <div className="bg-white/20 p-2 rounded-xl">
                            {notification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                            {notification.type === 'error' && <XCircle className="w-6 h-6" />}
                            {notification.type === 'info' && <AlertTriangle className="w-6 h-6" />}
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
            {/* ── Page Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="page-header">
                        <div className="page-header-icon">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight font-outfit">Welcome Master Admin</h1>
                    </div>
                    <p className="text-muted-foreground font-medium -mt-4 ml-14">Welcome back! Here's a quick look at your platform's status.</p>
                </div>
                <div className="flex items-center gap-3 ml-14 md:ml-0">
                    {/* Backup DB and Live Status buttons removed as requested */}
                </div>
            </div>
            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 stagger">
                {[
                    { label: "Elite Resellers", value: analytics?.kpis?.total_resellers, trend: "+12%", icon: Users, color: "blue" },
                    { label: "Direct Businesses", value: analytics?.kpis?.direct_business_users, trend: "Stable", icon: ShieldCheck, color: "indigo" },
                    { label: "Managed Businesses", value: analytics?.kpis?.indirect_business_users, trend: "+45", icon: Globe, color: "green" },
                    { label: "Total Throughput", value: (analytics?.kpis?.total_platform_messages || 0).toLocaleString(), trend: "Normal", icon: Activity, color: "purple" },
                ].map((card, i) => (
                    <div key={i} className="stat-soft group">
                        <div className="space-y-1">
                            <p className="label">{card.label}</p>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                            <div className="flex items-center gap-1.5 pt-2">
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md bg-${card.color}-50 text-${card.color}-600 uppercase tracking-wider`}>
                                    {card.trend}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-bold">vs last month</span>
                            </div>
                        </div>
                        <div className={`stat-soft-icon bg-stat-${card.color}-bg text-stat-${card.color}-icon group-hover:scale-110 transition-transform`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                    </div>
                ))}
            </div>

            {/* 🔥 Full Platform Message Performance Graph (Admin Exclusive) */}
            {!loading && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/50 p-10 space-y-8 stagger-item">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-black text-slate-900 tracking-tighter">System-Wide Performance</h2>
                                <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full">
                                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Global Aggregate</span>
                                </div>
                            </div>
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">Real-time message traffic optimization across all resellers & direct users</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <select 
                                className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl px-4 py-2.5 focus:ring-2 ring-indigo-500/20 outline-none transition-all"
                                value={selectedReseller}
                                onChange={(e) => setSelectedReseller(e.target.value)}
                            >
                                <option value="all">View All Hierarchy</option>
                                {resellers.map(r => (
                                    <option key={r.reseller_id} value={r.reseller_id}>{r.name}</option>
                                ))}
                            </select>
                            <div className="hidden md:flex items-center gap-6 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3 h-3 rounded-full bg-blue-600 shadow-lg shadow-blue-200" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Sent Total</p>
                                        <p className="text-sm font-black text-slate-900 leading-none">Global Traffic</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-slate-200" />
                                <div className="flex items-center gap-2.5">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Delivered</p>
                                        <p className="text-sm font-black text-slate-900 leading-none">Platform Success</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="h-[400px] w-full mt-6 scale-y-105">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={analytics?.graph_data && analytics.graph_data.length > 0 ? analytics.graph_data : [
                                { name: 'Jan', sent: 0, delivered: 0 },
                                { name: 'Feb', sent: 0, delivered: 0 },
                                { name: 'Mar', sent: 0, delivered: 0 },
                                { name: 'Apr', sent: 0, delivered: 0 },
                                { name: 'May', sent: 0, delivered: 0 },
                                { name: 'Jun', sent: 0, delivered: 0 },
                                { name: 'Jul', sent: 0, delivered: 0 },
                                { name: 'Aug', sent: 0, delivered: 0 },
                                { name: 'Sep', sent: 0, delivered: 0 },
                                { name: 'Oct', sent: 0, delivered: 0 },
                                { name: 'Nov', sent: 0, delivered: 0 },
                                { name: 'Dec', sent: 0, delivered: 0 },
                            ]}>
                                <defs>
                                    <linearGradient id="adminColorSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                    <linearGradient id="adminColorDelivered" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 11, fontWeight: 800, fill: '#64748b'}}
                                    dy={15}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 11, fontWeight: 800, fill: '#64748b'}}
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '24px', 
                                        border: 'none', 
                                        boxShadow: '0 25px 60px rgba(0,0,0,0.15)',
                                        padding: '20px 24px',
                                        background: '#fff'
                                    }}
                                    labelStyle={{ fontWeight: 900, fontSize: '15px', color: '#0f172a', marginBottom: '10px' }}
                                    itemStyle={{ padding: '4px 0', fontSize: '13px', fontWeight: 700 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="sent" 
                                    stroke="#2563eb" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#adminColorSent)" 
                                    animationDuration={2000}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="delivered" 
                                    stroke="#10b981" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#adminColorDelivered)" 
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}
            {/* ── [NEW] ADVANCED HIERARCHY ANALYTICS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 stagger-item">
                
                {/* 1. User Type Breakdown (Pie Chart) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">User Type Breakdown</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Platform-wide account distribution</p>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics?.user_type_breakdown || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {[
                                        { name: "Resellers", color: "#6366f1" },
                                        { name: "Sub-Biz", color: "#10b981" },
                                        { name: "Direct Biz", color: "#f59e0b" }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                />
                                <Legend 
                                    verticalAlign="bottom" 
                                    iconType="circle" 
                                    formatter={(v) => <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{v}</span>}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* 2. Plan Distribution (Bar Chart) */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900">Plan Distribution</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Users per active subscription plan</p>
                        </div>
                    </div>
                    <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics?.plan_distribution || []} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} 
                                    width={100}
                                />
                                <Tooltip 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 stagger-item">
                
                {/* ── Usage Overview & Top Users ── */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Activity Visualization */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm card-lift">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 font-outfit">Traffic Distribution</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 group transition-colors">
                                    <Search className="w-4 h-4 group-hover:text-slate-600" />
                                </button>
                                <select className="bg-slate-50 border-none text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-xl px-4 py-2 focus:ring-2 ring-indigo-500/10 outline-none cursor-pointer">
                                    <option>Priority Analytics</option>
                                    <option>Standard View</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-8">
                            {analytics?.usage_breakdown ? (
                                [
                                    { name: "Campaign Broadcasts", count: analytics.usage_breakdown.whatsapp_campaigns || 0, color: "#128C7E", icon: Zap },
                                    { name: "High-Frequency API", count: analytics.usage_breakdown.api_requests || 0, color: "#3B82F6", icon: Globe }
                                ].map((item, i) => {
                                    const total = analytics.kpis?.total_platform_messages || 1;
                                    const percentage = Math.round((item.count / total) * 100) || 0;
                                    return (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between items-end px-1">
                                                <div className="flex items-center gap-2">
                                                    <item.icon className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-black text-slate-700 uppercase tracking-wide">{item.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-slate-900">{item.count.toLocaleString()}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold ml-1.5 uppercase">({percentage}%)</span>
                                                </div>
                                            </div>
                                            <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(0,0,0,0.05)]" 
                                                    style={{ width: `${percentage}%`, backgroundColor: item.color }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="py-12 text-center text-muted-foreground font-medium italic">No usage data detected for this period.</div>
                            )}
                        </div>
                    </div>
                    {/* Reseller Directory */}
                    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm card-lift overflow-hidden">
                        <div className="p-8 pb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-emerald-600" />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 font-outfit">Top Tier Resellers</h2>
                            </div>
                            <button className="text-[11px] font-black text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1.5">
                                Full Directory
                                <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                        <div className="overflow-x-auto px-2 pb-4 mt-4">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-6 py-4 text-left label">Partner Identity</th>
                                        <th className="px-6 py-4 text-left label">Network Size</th>
                                        <th className="px-6 py-4 text-left label">Credit Reserve</th>
                                        <th className="px-6 py-4 text-center label">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {resellers.length > 0 ? resellers.map((r, i) => (
                                        <tr key={i} className="tr-hover group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm bg-brand-50 text-brand-600 border border-brand-100">
                                                        {r.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-slate-900 text-sm tracking-tight">{r.name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-bold truncate max-w-[140px]">{r.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-black text-slate-900 text-sm">{r.user_count || 0}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">Businesses</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="badge-success gap-1.5 py-1 px-3">
                                                    <Wallet className="w-3 h-3" />
                                                    {r.credits?.toLocaleString()} Credits
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-indigo-500 bg-indigo-50/50 hover:text-white hover:bg-indigo-600 rounded-lg transition-all" 
                                                        title="View Profile"
                                                        onClick={() => handleViewReseller(r)}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-emerald-500 bg-emerald-50/50 hover:text-white hover:bg-emerald-600 rounded-lg transition-all" 
                                                        title="Edit Profile"
                                                        onClick={() => handleEditReseller(r)}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="icon" 
                                                        className="h-8 w-8 text-rose-500 bg-rose-50/50 hover:text-white hover:bg-rose-600 rounded-lg transition-all" 
                                                        title="Remove Reseller"
                                                        onClick={() => handleDeleteReseller(r)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium italic">No active resellers found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    {/* Delete Confirmation Modal */}
                    <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-[2rem] shadow-2xl border-none">
                            <div className="p-8 pt-10 text-center">
                                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
                                    <AlertTriangle className="w-10 h-10 text-rose-500" />
                                </div>
                                <DialogHeader>
                                    <DialogTitle className="text-2xl font-black text-slate-900 mb-2 text-center tracking-tighter">Destroy Reseller Access?</DialogTitle>
                                    <DialogDescription className="text-slate-500 font-medium text-center">
                                        Are you sure you want to permanently remove <span className="font-black text-slate-900">"{resellerToDelete?.name}"</span>? 
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-2xl text-left">
                                    <p className="text-[11px] font-bold text-amber-800 leading-relaxed uppercase tracking-wider">
                                        ⚠️ WARNING: This will terminate all sub-businesses and message traffic linked to this partner identity.
                                    </p>
                                </div>
                            </div>
                            <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex flex-row gap-3 items-center">
                                <Button 
                                    variant="outline" 
                                    onClick={() => setIsDeleteModalOpen(false)} 
                                    className="flex-1 h-14 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-white"
                                    disabled={isDeleting}
                                >
                                    Abort
                                </Button>
                                <Button 
                                    onClick={confirmDeleteReseller} 
                                    className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-lg shadow-rose-600/20 transition-all active:scale-95"
                                    disabled={isDeleting}
                                >
                                    {isDeleting ? "Purging..." : "Confirm Deletion"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
                {/* ── Sidebar Stats (1 Column) ── */}
                <div className="space-y-8">
                    {/* Identity Block */}
                    <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-xl p-8 text-white relative overflow-hidden card-lift">
                        <div className="absolute top-0 right-0 p-4 opacity-[0.03]">
                            <ShieldCheck className="w-40 h-40" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center backdrop-blur-md">
                                    <User className="w-7 h-7 text-brand- light" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black tracking-tight font-outfit">System Root</h3>
                                    <div className="badge-info bg-brand-light/10 text-brand-light border-brand-light/20 uppercase tracking-[0.2em] px-2 py-0.5 mt-1">
                                        Super Admin
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-white/10">
                                <div className="space-y-1">
                                    <p className="label text-white/40">Status</p>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 pulse-dot" />
                                        <p className="text-xs font-black uppercase tracking-widest text-emerald-400">Operational</p>
                                    </div>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="label text-white/40">Location</p>
                                    <p className="text-xs font-black uppercase tracking-widest">Platform Core</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Expiry Alerts */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm card-lift">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-black text-slate-900 font-outfit flex items-center gap-2">
                                <Clock className="w-4 h-4 text-rose-500" />
                                Lifecycle Alerts
                            </h2>
                            <span className="badge-failed px-2 py-0.5">Critical</span>
                        </div>
                        <div className="space-y-5">
                            {analytics?.user_expiry_watchlist && analytics.user_expiry_watchlist.length > 0 ? (
                                analytics.user_expiry_watchlist.map((user: any, i: number) => (
                                    <div key={i} className="flex items-center justify-between group cursor-default">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-rose-50 transition-colors">
                                                <TrendingDown className="w-4 h-4 text-slate-400 group-hover:text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-slate-800 tracking-tight leading-none mb-1">{user.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">{user.plan}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-rose-600">{user.expires_at}</p>
                                            <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">Expiration</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-6 text-center text-[11px] font-bold text-muted-foreground uppercase tracking-widest bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                                    System Stabilized
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Platform Pulse */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm card-lift relative overflow-hidden">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-lg font-black text-slate-900 font-outfit">Platform Pulse</h2>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-indigo-500" />
                            </div>
                        </div>
                        
                        <div className="px-2">
                            <div className="relative h-44 w-44 mx-auto flex items-center justify-center">
                                {/* Synthetic circular chart */}
                                <div className="absolute inset-0 rounded-full border-[1.2rem] border-slate-50"></div>
                                <div className="absolute inset-0 rounded-full border-[1.2rem] border-brand-600 border-t-transparent border-r-transparent animate-spin-slow shadow-glow" />
                                <div className="relative z-10 text-center animate-in fade-in duration-1000">
                                    <p className="text-3xl font-black text-slate-900 font-outfit tracking-tight">{(analytics?.kpis?.total_platform_messages || 0).toLocaleString()}</p>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Total Hub</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 mt-10">
                                <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center">
                                    <p className="label mb-1">Cores</p>
                                    <p className="text-sm font-black text-brand-600">8 Node AI</p>
                                </div>
                                <div className="bg-slate-50 rounded-xl p-3 flex flex-col items-center">
                                    <p className="label mb-1">Latency</p>
                                    <p className="text-sm font-black text-indigo-600">24ms</p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

function LoaderIcon() {
    return (
        <svg className="w-8 h-8 text-brand-600 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    )
}
