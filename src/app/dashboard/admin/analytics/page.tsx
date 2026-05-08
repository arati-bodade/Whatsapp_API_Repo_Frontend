'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { HierarchyTree } from '@/components/admin/HierarchyTree';
import { AnalyticsResponse, ResellerAnalytics, DirectBusinessUser } from '@/types/analytics';
import { Bot, Send, Users, Building2, Store, CreditCard, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

// Colors for charts
const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];
const STATUS_COLORS = { 'Active': '#10b981', 'Expiring': '#f59e0b', 'Critical': '#ef4444', 'Inactive': '#6b7280' };

export default function AnalyticsGraphPage() {
    const [data, setData] = useState<AnalyticsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    
    // Agent state
    const [agentInput, setAgentInput] = useState('');
    const [agentMessages, setAgentMessages] = useState<{role: 'user' | 'agent', text: string}[]>([{
        role: 'agent', text: 'Hello Master Admin. I am your MessageIQ Intelligence Agent. I have full context of the platform hierarchy. How can I assist you?'
    }]);
    const [agentLoading, setAgentLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Assume we use the auth token stored in localStorage
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            
            const res = await axios.get('/api/admin/analytics', { headers });
            setData(res.data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [agentMessages]);

    const handleAgentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agentInput.trim() || agentLoading) return;
        
        const userMsg = agentInput;
        setAgentInput('');
        setAgentMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setAgentLoading(true);
        
        try {
            const token = localStorage.getItem('token');
            const headers = token ? { Authorization: `Bearer ${token}` } : {};
            const res = await axios.post('/api/admin/analytics/agent', { message: userMsg }, { headers });
            setAgentMessages(prev => [...prev, { role: 'agent', text: res.data.reply }]);
        } catch (error: any) {
            setAgentMessages(prev => [...prev, { role: 'agent', text: 'Error connecting to intelligence agent: ' + (error.response?.data?.error || error.message) }]);
        } finally {
            setAgentLoading(false);
        }
    };

    if (loading || !data) {
        return <div className="flex items-center justify-center h-full min-h-screen text-gray-400">Loading Analytics...</div>;
    }

    // Process Data for Charts
    const chart1Data = data.resellers.map(r => ({ name: r.name.split(' ')[0], "Sub-Businesses": r.businesses }));
    const chart2Data = data.resellers.map(r => ({ name: r.name, value: r.credits }));
    
    const planCounts: Record<string, number> = {};
    data.resellers.forEach(r => planCounts[r.plan] = (planCounts[r.plan] || 0) + 1);
    data.directBusinessUsers.forEach(d => planCounts[d.plan] = (planCounts[d.plan] || 0) + 1);
    const chart3Data = Object.entries(planCounts).map(x => ({ name: x[0], count: x[1] })).sort((a,b) => b.count - a.count);
    
    const chart4Data = [
        { name: 'Resellers', value: data.stats.totalResellers },
        { name: 'Sub-Businesses', value: data.stats.totalSubBusinesses },
        { name: 'Direct Businesses', value: data.stats.totalDirectBusinesses },
    ];

    const lifecycles = { Active: 0, Expiring: 0, Critical: 0 };
    [...data.resellers, ...data.directBusinessUsers].forEach(u => {
        if (!u.expiry) lifecycles.Active++;
        else {
            const daysLeft = (new Date(u.expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            if (daysLeft <= 30) lifecycles.Critical++;
            else if (daysLeft <= 90) lifecycles.Expiring++;
            else lifecycles.Active++;
        }
    });
    const chart5Data = [
        { name: 'Active', value: lifecycles.Active },
        { name: 'Expiring', value: lifecycles.Expiring },
        { name: 'Critical', value: lifecycles.Critical },
    ];

    const getStatusBadge = (status: string, expiry?: string | null) => {
        let type = 'Active';
        if (expiry) {
            const daysLeft = (new Date(expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
            if (daysLeft <= 30) type = 'Critical';
            else if (daysLeft <= 90) type = 'Expiring';
        }
        
        let color = 'bg-green-500/10 text-green-500 border-green-500/20';
        let Icon = CheckCircle;
        if (type === 'Critical') { color = 'bg-red-500/10 text-red-500 border-red-500/20'; Icon = AlertTriangle; }
        else if (type === 'Expiring') { color = 'bg-amber-500/10 text-amber-500 border-amber-500/20'; Icon = Clock; }

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium border rounded-full ${color}`}>
                <Icon size={12} /> {type}
            </span>
        );
    };

    return (
        <div className="flex-1 p-6 space-y-6 bg-black min-h-screen">
            <h1 className="text-3xl font-bold text-white tracking-tight">Platform Analytics</h1>
            
            {/* SECTION A: Stats Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                <StatCard icon={<Store />} title="Total Resellers" value={data.stats.totalResellers} />
                <StatCard icon={<Users />} title="Total Sub-Businesses" value={data.stats.totalSubBusinesses} />
                <StatCard icon={<Building2 />} title="Direct Businesses" value={data.stats.totalDirectBusinesses} />
                <StatCard icon={<CreditCard />} title="Total Credits Flowing" value={data.stats.totalCredits.toLocaleString()} color="text-purple-400" />
            </div>

            {/* SECTION B: Hierarchy Tree */}
            <HierarchyTree 
                resellers={data.resellers} 
                directUsers={data.directBusinessUsers} 
                selectedId={selectedNode}
                onSelect={(id) => setSelectedNode(id)}
            />

            {/* SECTION C: Charts */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                {/* Chart 1: Bar Chart */}
                <ChartCard title="Sub-Businesses per Reseller">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chart1Data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{fill: '#374151', opacity: 0.4}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Bar dataKey="Sub-Businesses" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Chart 2: Donut Chart - Credit Reserve */}
                <ChartCard title="Credit Reserve Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={chart2Data} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                                {chart2Data.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />)}
                            </Pie>
                            <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} formatter={(val) => val?.toLocaleString() || '0'} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#cbd5e1' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Chart 3: Horizontal Bar Chart - Plan Distribution */}
                <ChartCard title="Plan Distribution">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart layout="vertical" data={chart3Data} margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
                            <XAxis type="number" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
                            <RechartsTooltip cursor={{fill: '#374151', opacity: 0.4}} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                            <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Chart 4 & 5 container */}
                <div className="grid grid-cols-2 gap-6">
                    {/* Chart 4: Pie Chart - User Types */}
                    <ChartCard title="User Type Breakdown">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={chart4Data} outerRadius={80} dataKey="value" label={false}>
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#14b8a6" />
                                    <Cell fill="#f59e0b" />
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Chart 5: Donut Chart - Lifecycle */}
                    <ChartCard title="Lifecycle Status">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie data={chart5Data} innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
                                    <Cell fill={STATUS_COLORS['Active']} />
                                    <Cell fill={STATUS_COLORS['Expiring']} />
                                    <Cell fill={STATUS_COLORS['Critical']} />
                                </Pie>
                                <RechartsTooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartCard>
                </div>
            </div>

            {/* SECTION D: Reseller Plan Details Table */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]"><h3 className="font-semibold text-white">Reseller Details</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-[#222] text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Partner Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3 text-center">Sub-Businesses</th>
                                <th className="px-6 py-3 text-right">Credits Reserved</th>
                                <th className="px-6 py-3">Expiry Date</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.resellers.map((r) => (
                                <tr 
                                    key={r.id} 
                                    onClick={() => setSelectedNode(r.id)}
                                    className={`border-b border-[#333] cursor-pointer transition-colors ${selectedNode === r.id ? 'bg-blue-900/30' : 'hover:bg-[#2A2A2A]'}`}
                                >
                                    <td className="px-6 py-4 font-medium text-white">{r.name}</td>
                                    <td className="px-6 py-4">{r.email}</td>
                                    <td className="px-6 py-4">{r.plan}</td>
                                    <td className="px-6 py-4 text-center">{r.businesses}</td>
                                    <td className="px-6 py-4 text-right font-mono text-purple-400">{r.credits.toLocaleString()}</td>
                                    <td className="px-6 py-4">{r.expiry ? new Date(r.expiry).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4">{getStatusBadge(r.status, r.expiry)}</td>
                                </tr>
                            ))}
                            {data.resellers.length === 0 && <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No resellers found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION E: Direct Business Users Table */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden">
                <div className="p-4 border-b border-[#333]"><h3 className="font-semibold text-white">Direct Business Users</h3></div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs uppercase bg-[#222] text-gray-400">
                            <tr>
                                <th className="px-6 py-3">User Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Plan</th>
                                <th className="px-6 py-3">Expiry Date</th>
                                <th className="px-6 py-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.directBusinessUsers.map((d) => (
                                <tr 
                                    key={d.id} 
                                    onClick={() => setSelectedNode(d.id)}
                                    className={`border-b border-[#333] cursor-pointer transition-colors ${selectedNode === d.id ? 'bg-orange-900/30' : 'hover:bg-[#2A2A2A]'}`}
                                >
                                    <td className="px-6 py-4 font-medium text-white">{d.name}</td>
                                    <td className="px-6 py-4">{d.email}</td>
                                    <td className="px-6 py-4">{d.plan}</td>
                                    <td className="px-6 py-4">{d.expiry ? new Date(d.expiry).toLocaleDateString() : 'N/A'}</td>
                                    <td className="px-6 py-4">{getStatusBadge(d.status, d.expiry)}</td>
                                </tr>
                            ))}
                            {data.directBusinessUsers.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No direct business users found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* SECTION F: AI Analytics Agent */}
            <div className="bg-[#1A1A1A] border border-[#333] rounded-lg overflow-hidden flex flex-col h-[500px]">
                <div className="p-4 border-b border-[#333] bg-[#222] flex items-center gap-3">
                    <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg"><Bot size={20} /></div>
                    <div>
                        <h3 className="font-semibold text-white">MessageIQ Intelligence Agent</h3>
                        <p className="text-xs text-gray-400">Powered by Claude 4 Sonnet</p>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/40">
                    {agentMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                                msg.role === 'user' 
                                ? 'bg-blue-600 text-white rounded-tr-sm' 
                                : 'bg-[#2A2A2A] text-gray-200 border border-[#444] rounded-tl-sm'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {agentLoading && (
                        <div className="flex justify-start">
                            <div className="bg-[#2A2A2A] text-gray-400 border border-[#444] rounded-2xl rounded-tl-sm px-4 py-3 text-sm flex items-center gap-2">
                                <span className="animate-pulse">●</span>
                                <span className="animate-pulse animation-delay-200">●</span>
                                <span className="animate-pulse animation-delay-400">●</span>
                            </div>
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="p-4 border-t border-[#333] bg-[#1A1A1A]">
                    <form onSubmit={handleAgentSubmit} className="flex gap-3">
                        <input 
                            type="text" 
                            value={agentInput}
                            onChange={(e) => setAgentInput(e.target.value)}
                            placeholder="Ask about resellers, credits, or expiring plans..." 
                            className="flex-1 bg-[#0A0A0A] border border-[#444] text-white rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition-colors"
                            disabled={agentLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={agentLoading || !agentInput.trim()}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 transition-colors flex items-center justify-center min-w-[50px]"
                        >
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>

        </div>
    );
}

// ---------------------------------------------------------
// REUSABLE MICRO-COMPONENTS
// ---------------------------------------------------------

function StatCard({ title, value, icon, color = 'text-white' }: { title: string, value: string|number, icon: React.ReactNode, color?: string }) {
    return (
        <div className="bg-[#1A1A1A] p-6 rounded-lg border border-[#333] flex items-center gap-4 hover:border-gray-600 transition-colors">
            <div className="p-3 bg-[#2A2A2A] rounded-lg text-gray-400">{icon}</div>
            <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <h4 className={`text-2xl font-bold tracking-tight ${color}`}>{value}</h4>
            </div>
        </div>
    );
}

function ChartCard({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-[#1A1A1A] p-5 rounded-lg border border-[#333]">
            <h3 className="mb-4 text-sm font-semibold text-gray-300">{title}</h3>
            {children}
        </div>
    );
}
