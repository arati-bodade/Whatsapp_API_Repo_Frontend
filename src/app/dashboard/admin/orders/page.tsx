"use client"

import { useState } from "react"
import { 
    ShoppingCart, 
    CheckCircle2, 
    Zap, 
    Clock, 
    ChevronRight, 
    Filter as FilterIcon,
    Search,
    Download,
    Calendar,
    Box,
    UserCheck,
    CreditCard,
    ChevronDown,
    X,
    User,
    Store
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { useEffect, useCallback } from "react"
import { getAdminOrders } from "@/config/api"
import { Loader2 } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

// Updated Order interface to match backend changes
interface Order {
    id: string;
    txnid: string;
    plan_name: string;
    credits: number;
    amount: number;
    status: string;
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    allocated_to_user_id?: string;
    allocated_to_name?: string; 
    purchaser_name?: string;     
    user_type: string;           
    is_allocated: string;
    created_at: string;
}

export default function AdminOrdersPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [orders, setOrders] = useState<Order[]>([])
    const [isLoading, setIsLoading] = useState(true)
    
    // Filters state
    const [userTypeFilter, setUserTypeFilter] = useState<string>("all")
    const [statusFilter, setStatusFilter] = useState<string>("all")
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")

    const fetchOrders = useCallback(async () => {
        setIsLoading(true)
        try {
            const params: any = {}
            if (userTypeFilter !== "all") params.user_type = userTypeFilter
            if (statusFilter !== "all") params.status = statusFilter
            if (startDate) params.start_date = startDate
            if (endDate) params.end_date = endDate
            
            const data = await getAdminOrders(params)
            setOrders(data)
        } catch (error) {
            console.error("Failed to fetch orders:", error)
        } finally {
            setIsLoading(false)
        }
    }, [userTypeFilter, statusFilter, startDate, endDate])

    useEffect(() => {
        fetchOrders()
    }, [fetchOrders])

    const filteredOrders = orders.filter(order => 
        order.txnid.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.plan_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.purchaser_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (order.allocated_to_name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        } catch (e) {
            return dateStr
        }
    }

    const handleExport = () => {
        if (filteredOrders.length === 0) return;
        
        // CSV headers
        const headers = ["Date", "Order ID", "Plan", "Credits", "Amount", "Status", "Purchased By", "User Type", "Allocated To"];
        
        // Helper to escape CSV values
        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        };

        const csvRows = [
            headers.join(','),
            ...filteredOrders.map(o => [
                new Date(o.created_at).toLocaleDateString(),
                o.txnid,
                o.plan_name,
                o.credits,
                o.amount,
                o.status,
                o.purchaser_name || 'N/A',
                o.user_type === 'reseller' ? 'Reseller' : 'Business User',
                o.allocated_to_name || 'Not Allocated'
            ].map(escapeCSV).join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('href', url);
        a.setAttribute('download', `system-orders-export-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 border border-emerald-100 shadow-sm">
                        <ShoppingCart className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">System Orders</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-0.5">Global oversight of all plan purchases across the platform</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    <div className="flex flex-wrap items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm">
                        <Button 
                            variant="ghost" 
                            onClick={handleExport}
                            className="rounded-xl font-black gap-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 h-10 px-4 active:scale-95 transition-all"
                            disabled={filteredOrders.length === 0}
                        >
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </Button>

                        <div className="w-px h-6 bg-slate-100 mx-1 hidden sm:block" />

                        <div className="flex items-center gap-1">
                            <div className="pl-2 mr-1 text-slate-300">
                                <FilterIcon className="w-4 h-4" />
                            </div>
                            
                            <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                                <SelectTrigger className="w-[120px] border-none bg-transparent font-black text-[11px] focus:ring-0 uppercase tracking-tight h-10">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value="reseller">Resellers</SelectItem>
                                    <SelectItem value="business">Direct Users</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="w-px h-4 bg-slate-100 mx-1" />

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[110px] border-none bg-transparent font-black text-[11px] focus:ring-0 uppercase tracking-tight h-10">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="success">Success</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="w-px h-4 bg-slate-100 mx-1" />

                            <div className="flex items-center gap-1 px-1">
                                <Input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-10 w-[125px] border-none bg-transparent font-black text-[10px] focus-visible:ring-0 px-1 cursor-pointer"
                                />
                                <span className="text-slate-300 text-[9px] font-black mx-1">TO</span>
                                <Input 
                                    type="date" 
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-10 w-[125px] border-none bg-transparent font-black text-[10px] focus-visible:ring-0 px-1 cursor-pointer"
                                />
                            </div>

                            {(userTypeFilter !== 'all' || statusFilter !== 'all' || startDate !== '' || endDate !== '') && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => { 
                                        setUserTypeFilter("all"); 
                                        setStatusFilter("all");
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className="h-9 w-9 rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 ml-1"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm text-emerald-600">
                                <Box className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-black text-slate-900 leading-tight">Orders Registry <span className="ml-2 text-slate-400 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded-full">{filteredOrders.length}</span></h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Filtering by: <span className="text-emerald-600">{userTypeFilter}</span> & <span className="text-emerald-600">{statusFilter}</span></p>
                            </div>
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                            <Input 
                                placeholder="Search by Order ID, Plan, User..." 
                                className="pl-10 h-10 bg-white border-slate-200 rounded-xl focus:ring-emerald-500 font-medium"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-8 space-y-6 bg-white">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Fetching system orders...</p>
                            </div>
                        ) : filteredOrders.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="p-4 bg-slate-50 rounded-full">
                                    <ShoppingCart className="h-10 w-10 text-slate-200" />
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No matching orders found</p>
                            </div>
                        ) : (
                            filteredOrders.map((order) => (
                                <div 
                                    key={order.id}
                                    className={`group relative bg-white border border-slate-100 rounded-[2rem] p-6 transition-all duration-300 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-600/5 border-l-4 ${order.status === 'success' ? 'border-l-emerald-500' : 'border-l-amber-500'} shadow-sm`}
                                >
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex-1 space-y-4">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">{order.plan_name}</h3>
                                                <Badge className={`${order.status === 'success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'} font-black rounded-full px-3 py-0.5 text-[10px] uppercase gap-1.5 flex items-center`}>
                                                    <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'success' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                                                    {order.status}
                                                </Badge>
                                                <Badge className={`font-black rounded-full px-3 py-0.5 text-[10px] uppercase gap-1.5 flex items-center ${order.user_type === 'reseller' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                                                    {order.user_type === 'reseller' ? (<Store className="w-3 h-3" />) : (<User className="w-3 h-3" />)}
                                                    {order.user_type}
                                                </Badge>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8">
                                                <div className="flex items-center gap-2.5">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[13px] font-bold text-slate-500 tracking-tight">{formatDate(order.created_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <Box className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[13px] font-bold text-slate-500 tracking-tight">{order.credits.toLocaleString()} Credits</span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <CreditCard className="w-4 h-4 text-slate-400" />
                                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[150px]">ID: {order.txnid}</span>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mt-4">
                                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                        <User className="w-3 h-3 text-slate-400" />
                                                    </div>
                                                    <p className="text-[11px] font-bold text-slate-500 tracking-tight">
                                                        Purchased By: <span className="font-black text-slate-900">{order.purchaser_name || 'System Auto'}</span>
                                                    </p>
                                                </div>

                                                {order.allocated_to_name && (
                                                    <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100/50 flex items-center gap-3 animate-in slide-in-from-left-2 duration-500">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                            <UserCheck className="w-3 h-3 text-emerald-600" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-emerald-800 tracking-tight">
                                                            Allocated to: <span className="font-black opacity-80">{order.allocated_to_name}</span>
                                                        </p>
                                                    </div>
                                                )}
                                                
                                                {!order.allocated_to_name && order.is_allocated === 'pending' && order.status === 'success' && (
                                                    <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100/50 flex items-center gap-3">
                                                        <div className="p-1.5 bg-white rounded-lg shadow-sm">
                                                            <Clock className="w-3 h-3 text-amber-600" />
                                                        </div>
                                                        <p className="text-[11px] font-bold text-amber-800 tracking-tight uppercase">
                                                            Allocation Pending
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-4 h-full">
                                            <div className="text-3xl font-black text-slate-900 tracking-tighter tabular-nums">
                                                ₹{order.amount.toLocaleString()}
                                            </div>
                                            <Button variant="ghost" size="sm" className="rounded-xl px-4 font-black text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 group">
                                                Transaction
                                                <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-0.5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}

                        {!isLoading && filteredOrders.length > 0 && (
                            <div className="pt-8 flex justify-center">
                                <Button variant="outline" onClick={fetchOrders} className="rounded-2xl px-12 h-12 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-900 border-2 border-dashed">
                                    Refresh Registry
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
