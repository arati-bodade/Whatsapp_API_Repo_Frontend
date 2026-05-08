"use client";

import React, { useEffect, useState } from 'react';
import { analyticsService, ResellerDashboardResponse } from '@/services/analyticsService';
import DashboardCards from '@/components/analytics/DashboardCards';
import UsageOverview from '@/components/analytics/UsageOverview';
import TopUsers from '@/components/analytics/TopUsers';
import RecentTransactions from '@/components/analytics/RecentTransactions';
import PlanDetails from '@/components/analytics/PlanDetails';
import AccountInfo from '@/components/analytics/AccountInfo';
import TrafficSource from '@/components/analytics/TrafficSource';
import { Button } from '@/components/ui/button';
import { 
    RefreshCw,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

export default function AnalyticsPage() {
    const [user, setUser] = useState<{ user_id: string; role: string } | null>(null);
    const [data, setData] = useState<ResellerDashboardResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const role = localStorage.getItem('user_role');
            // Prioritize reseller_id for resellers
            let userId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');

            // Fix: Handle 'undefined' string being stored in localStorage
            if (userId === 'undefined' || !userId) userId = null;

            if (role && userId) {
                setUser({ user_id: userId, role });
            } else {
                setLoading(false);
                setError("Authentication data missing. Please login again.");
            }
        }
    }, []);

    const fetchAnalytics = async () => {
        if (!user || user.role !== 'reseller') return;

        try {
            setLoading(true);
            setError(null);
            const dashboard = await analyticsService.getResellerDashboard(user.user_id);
            
            console.log('=== ANALYTICS PAGE DEBUG ===');
            console.log('Analytics API Response:', dashboard);
            console.log('total_credits:', dashboard.total_credits);
            console.log('used_credits:', dashboard.used_credits);
            console.log('remaining_credits:', dashboard.remaining_credits);
            console.log('messages_sent:', dashboard.messages_sent);
            
            setData(dashboard);
        } catch (error) {
            console.error("Failed to fetch analytics", error);
            setError("Failed to load analytics data.");
        } finally {
            setLoading(false);
        }
    };


    useEffect(() => {
        if (user && user.role === 'reseller') {
            fetchAnalytics();
        }
    }, [user]);

    // Auto-refresh analytics every 30 seconds (only when page is visible)
    useEffect(() => {
        if (!user || user.role !== 'reseller') return;

        const interval = setInterval(() => {
            // Only fetch if page is visible to avoid unnecessary API calls
            if (!document.hidden) {
                fetchAnalytics();
            }
        }, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, [user]);

    if (!user && loading) return <div className="p-8">Loading...</div>;
    if (user && user.role !== 'reseller') return <div className="p-8">Access Denied.</div>;

    const displayName = data?.account_info?.full_name || data?.account_info?.username || user?.user_id || "Reseller";


    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                        Welcome back, {loading && !data ? "..." : displayName}!
                    </h2>
                    <p className="text-muted-foreground mt-1">
                        Here&apos;s what&apos;s happening with your account today.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center space-x-2">
                        {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-10 border-gray-200 text-gray-600 font-bold"
                            onClick={fetchAnalytics}
                            disabled={loading}
                        >
                            <RefreshCw className={cn("h-3.5 w-3.5 mr-2", loading && "animate-spin")} />
                            {loading ? "Updating..." : "Refresh"}
                        </Button>
                    </div>
                </div>
            </div>

            {data && (
                <div className="flex justify-end text-xs text-muted-foreground -mt-4 mb-4">
                    Last Updated: {new Date(data.last_updated).toLocaleString()}
                </div>
            )}

            <div className="space-y-6">
                <DashboardCards data={data} loading={loading} />

                {/* Aggregate Performance Graph */}
                <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Aggregate Performance</h3>
                                <div className="p-1 px-2.5 bg-blue-50 border border-blue-100 rounded-full">
                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-tight">System Wide</span>
                                </div>
                            </div>
                            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest leading-none">Monthly message activity across all business users</p>
                        </div>
                    </div>

                    <div className="h-[350px] w-full mt-4" style={{ minHeight: '350px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.graph_data && data.graph_data.length > 0 ? data.graph_data : [
                                { name: 'Jan', sent: data?.messages_sent || 0, delivered: 0 },
                                { name: 'Feb', sent: 0, delivered: 0 },
                                { name: 'Mar', sent: 0, delivered: 0 },
                                { name: 'Apr', sent: data?.messages_sent || 0, delivered: 0 },
                                { name: 'May', sent: 0, delivered: 0 },
                                { name: 'Jun', sent: 0, delivered: 0 },
                                { name: 'Jul', sent: 0, delivered: 0 },
                            ]}>
                                <defs>
                                    <linearGradient id="colorResellerSent" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}}
                                    allowDecimals={false}
                                />
                                <Tooltip 
                                    contentStyle={{ 
                                        borderRadius: '16px', 
                                        border: 'none', 
                                        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                                        padding: '12px 16px'
                                    }}
                                    labelStyle={{ fontWeight: 800, marginBottom: '4px' }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="sent" 
                                    stroke="#2563eb" 
                                    strokeWidth={4}
                                    fillOpacity={1} 
                                    fill="url(#colorResellerSent)" 
                                    animationDuration={1500}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Usage, Top Users, Transactions */}
                    <div className="lg:col-span-2 space-y-6">
                        <UsageOverview
                            creditsUsed={data?.used_credits || 0}
                            creditsRemaining={data?.remaining_credits || 0}
                            messagesSent={data?.messages_sent || 0}
                            loading={loading}
                        />
                        <div className="grid gap-6 md:grid-cols-2">
                            <TopUsers
                                users={data?.business_users || []}
                                loading={loading}
                            />
                            <RecentTransactions
                                transactions={data?.recent_transactions || []}
                                loading={loading}
                            />
                        </div>
                    </div>

                    {/* Right Column: New Sections */}
                    <div className="space-y-6">
                        <PlanDetails
                            data={data?.plan_details || { plan_type: "...", expiry: "..." }}
                            loading={loading}
                        />
                        <AccountInfo
                            data={data?.account_info || { user_type: "", username: "", email: "", reseller_id: "" }}
                            loading={loading}
                        />
                        <TrafficSource
                            data={data?.traffic_source || []}
                            loading={loading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
