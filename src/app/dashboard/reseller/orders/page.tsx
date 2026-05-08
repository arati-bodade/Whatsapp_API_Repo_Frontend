"use client"

import React, { useState, useEffect } from "react"
import {
    ShoppingBag, ArrowRight, Package, Calendar,
    CheckCircle, Clock, XCircle, UserCheck,
    AlertCircle, CreditCard, Hash, Download
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { API_BASE_URL } from "@/config/api"

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => { fetchOrders() }, [])

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`${API_BASE_URL}/v1/credits/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            })
            if (response.ok) {
                setOrders(await response.json())
            } else {
                setError(response.status === 401 ? "Authentication failed. Please log in again." : "Failed to fetch orders.")
            }
        } catch {
            setError("Backend server is not accessible.")
        } finally {
            setLoading(false)
        }
    }

    const getStatusConfig = (status: string) => {
        switch (status) {
            case "success": return { icon: CheckCircle, label: "Success",  cls: "badge-success", borderCls: "order-success" }
            case "pending": return { icon: Clock,       label: "Pending",  cls: "badge-pending", borderCls: "order-pending" }
            case "failed":  return { icon: XCircle,     label: "Failed",   cls: "badge-failed",  borderCls: "order-failed"  }
            default:        return { icon: Clock,       label: status,     cls: "badge-pending", borderCls: "order-pending" }
        }
    }

    const formatDate = (dateString: string) => {
        if (!dateString) return "N/A"
        return new Date(dateString).toLocaleDateString("en-IN", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
        })
    }

    const handleExport = () => {
        if (orders.length === 0) return;

        // Headers for CSV
        const headers = ["Plan Name", "Status", "Amount (INR)", "Credits", "Transaction ID", "Date", "Allocation Status", "Allocated To"];
        
        // Convert orders to CSV rows
        const csvRows = [
            headers.join(","),
            ...orders.map(order => [
                `"${order.plan_name} Plan"`,
                `"${order.status}"`,
                order.amount,
                order.credits,
                `"${order.txnid}"`,
                `"${formatDate(order.created_at)}"`,
                `"${order.is_allocated === "allocated" ? "Allocated" : "Not Allocated"}"`,
                `"${order.allocated_to_user_name || order.allocated_to_user_id || "N/A"}"`
            ].join(","))
        ];

        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `order_history_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const PageHeader = () => (
        <div className="page-enter">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="page-header !mb-0">
                    <div className="page-header-icon">
                        <ShoppingBag className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Order History</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Track all purchases and allocate credits to your business users</p>
                    </div>
                </div>
                {orders.length > 0 && (
                    <Button 
                        onClick={handleExport}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl px-4 h-11 flex items-center gap-2 transition-all shadow-sm group active:scale-95"
                    >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                            <Download className="h-4 w-4" />
                        </div>
                        <span className="font-semibold text-sm">Export Sheet</span>
                    </Button>
                )}
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className="flex-1 p-8 pt-6 space-y-6">
                <PageHeader />
                <div className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-5 border border-slate-100 space-y-3">
                            <div className="flex justify-between">
                                <div className="flex gap-3">
                                    <div className="skeleton h-5 w-32" />
                                    <div className="skeleton h-5 w-16" />
                                </div>
                                <div className="skeleton h-5 w-20" />
                            </div>
                            <div className="flex gap-4">
                                <div className="skeleton h-4 w-36" />
                                <div className="skeleton h-4 w-24" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 p-8 pt-6 space-y-6 page-enter">
            <PageHeader />

            {error ? (
                <div className="bg-white rounded-2xl border border-red-100 p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                        <XCircle className="h-8 w-8 text-red-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">Connection Error</h3>
                    <p className="text-slate-500 text-sm max-w-xs mb-6">{error}</p>
                    <Button onClick={fetchOrders} className="bg-red-600 hover:bg-red-700 rounded-xl">Try Again</Button>
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 float">
                        <ShoppingBag className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-1">No Orders Yet</h3>
                    <p className="text-slate-400 text-sm max-w-xs mb-6">You haven&apos;t placed any orders yet. Start by exploring our plans.</p>
                    <Button className="bg-[#128C7E] hover:bg-[#0e7468] rounded-xl px-8 btn-press">
                        Browse Plans <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <Card className="border border-slate-100 shadow-sm">
                    <CardHeader className="border-b border-slate-50 pb-4">
                        <CardTitle className="flex items-center gap-2.5 text-[15px]">
                            <Package className="h-4.5 w-4.5 text-[#128C7E]" />
                            Your Orders
                            <span className="ml-1 bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {orders.length}
                            </span>
                        </CardTitle>
                        <CardDescription className="text-xs mt-1">
                            Paid orders can be allocated to a business user. Credits go directly into their wallet.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="space-y-3 stagger-children">
                            {orders.map((order: any) => {
                                const statusCfg = getStatusConfig(order.status)
                                const StatusIcon = statusCfg.icon
                                return (
                                    <div
                                        key={order.id}
                                        className={cn(
                                            "bg-white rounded-xl border border-slate-100 px-5 py-4",
                                            "hover:shadow-md hover:border-slate-200 transition-all duration-200",
                                            statusCfg.borderCls
                                        )}
                                    >
                                        {/* Top row */}
                                        <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                                            <div className="flex items-center gap-2.5 flex-wrap">
                                                <span className="font-semibold text-slate-900 text-[15px]">{order.plan_name} Plan</span>
                                                <span className={cn("flex items-center gap-1", statusCfg.cls)}>
                                                    <StatusIcon className="h-3 w-3" />
                                                    {statusCfg.label}
                                                </span>
                                                {order.status === "success" && order.is_allocated === "allocated" && (
                                                    <span className="flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                        <UserCheck className="h-3 w-3" />Allocated
                                                    </span>
                                                )}
                                                {order.status === "success" && order.is_allocated !== "allocated" && (
                                                    <span className="flex items-center gap-1 bg-orange-50 text-orange-700 border border-orange-200 rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                        <AlertCircle className="h-3 w-3" />Not Allocated
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-lg font-bold text-[#128C7E]">₹{order.amount?.toLocaleString()}</span>
                                        </div>

                                        {/* Detail row */}
                                        <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                            <span className="flex items-center gap-1.5">
                                                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                                {formatDate(order.created_at)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                                                {order.credits?.toLocaleString()} Credits
                                            </span>
                                            <span className="flex items-center gap-1.5 font-mono">
                                                <Hash className="h-3.5 w-3.5 text-slate-400" />
                                                {order.txnid}
                                            </span>
                                        </div>

                                        {order.allocated_to_user_id && (
                                            <div className="mt-3 text-xs text-[#128C7E] bg-teal-50 rounded-lg px-3 py-2 border border-teal-100 font-medium flex items-center gap-2">
                                                <UserCheck className="h-3.5 w-3.5" />
                                                Allocated to: <span className="font-bold text-teal-900">{order.allocated_to_user_name || (order.allocated_to_user_id?.substring(0, 8) + "...")}</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
