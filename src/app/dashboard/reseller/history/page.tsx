"use client"

import React, { useEffect, useState } from "react"
import {
    History, Search, Calendar, RefreshCw,
    ShieldCheck, Eye, X, Filter, ChevronLeft,
    ChevronRight, Users, Clock, Activity
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { auditLogService, AuditLog, AuditLogResponse, FieldUpdate } from "@/services/auditLogService"

export default function AuditHistoryPage() {
    const [data, setData] = useState<AuditLogResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState("")
    const [moduleFilter, setModuleFilter] = useState("All Modules")
    const [actionFilter, setActionFilter] = useState("All Actions")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
    const [showDetailsModal, setShowDetailsModal] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (token) {
                try {
                    const payload = JSON.parse(atob(token.split(".")[1]))
                    setCurrentUserId(payload.sub)
                } catch (e) { console.error(e) }
            }
        }
    }, [])

    const formatFieldUpdate = (change: string | FieldUpdate) => {
        if (typeof change === "string") return change
        const f = change as FieldUpdate
        return `${f.field}${f.previousValue ? ` (${f.previousValue})` : ""} → ${f.newValue}`
    }

    const fetchHistory = async () => {
        try {
            setLoading(true)
            const response = await auditLogService.getLogs({
                search: searchQuery,
                module: moduleFilter === "All Modules" ? undefined : moduleFilter,
                action: actionFilter === "All Actions" ? undefined : actionFilter,
                start_date: startDate ? new Date(startDate).toISOString() : undefined,
                end_date: endDate ? new Date(endDate).toISOString() : undefined,
            })
            setData(response)
        } catch (err: any) {
            if (err.message?.includes("expired")) {
                setError("Your session has expired. Please log in again.")
                setTimeout(() => { window.location.href = "/login" }, 3000)
            } else {
                setError(err.message || "Failed to load history data.")
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const id = setTimeout(fetchHistory, 300)
        return () => clearTimeout(id)
    }, [searchQuery, moduleFilter, actionFilter, startDate, endDate])

    const actionColor = (action: string) => {
        if (action.includes("DELETE") || action.includes("REMOVE")) return "text-red-600 bg-red-50 border-red-200"
        if (action.includes("CREATE") || action.includes("ADD"))    return "text-green-700 bg-green-50 border-green-200"
        if (action.includes("UPDATE") || action.includes("EDIT"))   return "text-blue-600 bg-blue-50 border-blue-200"
        return "text-slate-600 bg-slate-50 border-slate-200"
    }

    /* ── Stat cards ── */
    const statCards = [
        { label: "Total Activities",  value: data?.total ?? 0,    bg: "#EFF6FF", borderColor: "#BFDBFE", textColor: "#1D4ED8", iconBg: "#DBEAFE", icon: Activity },
        { label: "Filtered Results",  value: data?.filtered ?? 0, bg: "#F5F3FF", borderColor: "#DDD6FE", textColor: "#6D28D9", iconBg: "#EDE9FE", icon: Filter },
        { label: "Days Since Last",   value: data?.last_activity_days_ago !== null && data?.last_activity_days_ago !== undefined ? `${data.last_activity_days_ago}d` : "—",
          bg: "#F0FDF4", borderColor: "#BBF7D0", textColor: "#15803D", iconBg: "#DCFCE7", icon: Clock },
    ]

    if (loading && !data) return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <RefreshCw className="h-6 w-6 animate-spin text-[#128C7E]" />
            <span className="ml-3 text-sm font-medium text-slate-500">Loading Activity History…</span>
        </div>
    )

    return (
        <div className="flex-1 p-8 pt-6 space-y-6 page-enter">

            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div className="page-header mb-0">
                    <div className="page-header-icon">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Activity History</h2>
                        <p className="text-sm text-slate-500 mt-0.5">View all changes made to your account</p>
                    </div>
                </div>
                <Button
                    onClick={fetchHistory}
                    className="bg-[#128C7E] hover:bg-[#0e7468] text-white font-semibold rounded-xl px-5 gap-2 btn-press shadow-sm shadow-teal-200"
                >
                    <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* ── Error ── */}
            {error && (
                <div className="info-banner border-l-red-400 bg-red-50 text-red-700">
                    <X className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            {/* ── Info banner ── */}
            <div className="info-banner">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                <div className="text-xs text-blue-700 space-y-0.5">
                    <p className="font-semibold">This log shows all activity related to your account including:</p>
                    <p className="text-blue-600 opacity-80">Changes made by admins/system, and actions performed by you (marked with "You" badge)</p>
                </div>
            </div>

            {/* ── Stat cards ── */}
            <div className="grid grid-cols-3 gap-4 stagger-children">
                {statCards.map((s, i) => {
                    const Icon = s.icon
                    return (
                        <div key={i} className="rounded-2xl p-4 border flex items-center gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            style={{ background: s.bg, borderColor: s.borderColor }}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.iconBg }}>
                                <Icon className="h-5 w-5" style={{ color: s.textColor }} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: s.textColor, opacity: 0.65 }}>{s.label}</p>
                                <p className="text-2xl font-bold tracking-tight" style={{ color: s.textColor }}>{s.value}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Filter bar ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search by action, module, admin, or IP…"
                        className="pl-11 h-11 bg-slate-50 border-slate-200 rounded-xl text-sm focus:bg-white focus:border-[#128C7E] focus:ring-[#128C7E]/20 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Module", value: moduleFilter, set: setModuleFilter, opts: ["All Modules", "Users", "Credits", "Reseller"] },
                        { label: "Action", value: actionFilter, set: setActionFilter, opts: ["All Actions", "UPDATE USER PLAN", "UPDATE USER", "CREDIT ALLOCATION", "CREATE USER", "DELETE USER"] },
                    ].map(({ label, value, set, opts }) => (
                        <div key={label} className="space-y-1">
                            <label className="section-label">{label}</label>
                            <select
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-[#128C7E] outline-none transition-colors"
                                value={value}
                                onChange={(e) => set(e.target.value)}
                            >
                                {opts.map((o) => <option key={o}>{o}</option>)}
                            </select>
                        </div>
                    ))}
                    {[
                        { label: "Start Date", value: startDate, set: setStartDate },
                        { label: "End Date",   value: endDate,   set: setEndDate },
                    ].map(({ label, value, set }) => (
                        <div key={label} className="space-y-1">
                            <label className="section-label">{label}</label>
                            <Input
                                type="date"
                                className="h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:border-[#128C7E] focus:ring-[#128C7E]/20"
                                value={value}
                                onChange={(e) => set(e.target.value)}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Table ── */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                {["Date & Time", "Action Type", "Performed By", "Affected User", "Changes Made", "Details"].map((h, i) => (
                                    <th key={h} className={cn(
                                        "px-5 py-3.5 section-label font-semibold",
                                        i === 5 && "text-center"
                                    )}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {!data?.logs || data.logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center">
                                                <History className="h-6 w-6 text-slate-300" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-400">No activity records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : data.logs.map((log) => {
                                const date = new Date(log.created_at)
                                const fDate = date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
                                const fTime = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
                                return (
                                    <tr key={log.id} className="table-row-hover">
                                        <td className="px-5 py-4 whitespace-nowrap">
                                            <p className="text-sm font-semibold text-slate-800">{fDate}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{fTime}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={cn(
                                                "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                                                actionColor(log.action_type)
                                            )}>
                                                {log.action_type}
                                            </span>
                                            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wide">{log.module}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                <Avatar className="h-8 w-8 shrink-0">
                                                    <AvatarFallback className="text-[11px] font-bold bg-slate-100 text-slate-500">
                                                        {log.performed_by.name.substring(0, 2).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-sm font-semibold text-slate-800 capitalize">{log.performed_by.name}</span>
                                                        {currentUserId === log.performed_by.id && (
                                                            <Badge className="bg-[#F0FDF9] text-[#128C7E] border-none px-1.5 py-0 text-[9px] font-bold h-4 rounded-full">YOU</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">{log.performed_by.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-slate-800">{log.affected_user?.name || "—"}</p>
                                            <p className="text-[11px] text-slate-400 break-all">{log.affected_user?.email || "—"}</p>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                                {log.changes_made?.map((change, i) => (
                                                    <code key={i} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] border border-slate-200 font-mono">
                                                        {formatFieldUpdate(change)}
                                                    </code>
                                                )) || <span className="text-slate-300 text-xs">—</span>}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-center">
                                            <Button
                                                variant="ghost" size="icon"
                                                className="h-8 w-8 text-[#128C7E] hover:bg-[#F0FDF9] rounded-xl transition-colors"
                                                onClick={() => { setSelectedLog(log); setShowDetailsModal(true) }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-5 py-4 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                        Showing {data?.logs?.length ?? 0} of {data?.filtered ?? 0} records
                    </span>
                    <div className="flex gap-2">
                        <Button disabled variant="outline" size="sm" className="h-8 rounded-xl text-xs border-slate-200">
                            <ChevronLeft className="h-3.5 w-3.5 mr-1" />Previous
                        </Button>
                        <Button disabled variant="outline" size="sm" className="h-8 rounded-xl text-xs border-slate-200">
                            Next<ChevronRight className="h-3.5 w-3.5 ml-1" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Details Modal ── */}
            {showDetailsModal && selectedLog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        {/* Modal header */}
                        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                                    <ShieldCheck className="h-5 w-5 text-teal-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold">Audit Log Details</h3>
                                    <p className="text-xs text-slate-400 mt-0.5">Complete activity record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setSelectedLog(null); setShowDetailsModal(false) }}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            >
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Basic info + User info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-slate-100 p-4 space-y-4 bg-slate-50/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="h-4 w-4 text-blue-500" />
                                        <h4 className="section-label">Basic Information</h4>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        {[
                                            { l: "Action", v: selectedLog.action_type, cls: actionColor(selectedLog.action_type) },
                                            { l: "Module", v: selectedLog.module, cls: "text-purple-600 bg-purple-50 border-purple-200" },
                                        ].map(({ l, v, cls }) => (
                                            <div key={l}>
                                                <p className="section-label mb-1">{l}</p>
                                                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full border", cls)}>{v}</span>
                                            </div>
                                        ))}
                                        <div>
                                            <p className="section-label mb-1">Timestamp</p>
                                            <p className="text-xs font-mono text-slate-600">
                                                {new Date(selectedLog.created_at).toLocaleString("en-US", { month: "short", day: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="section-label mb-1">IP Address</p>
                                            <p className="text-xs font-mono text-slate-600">{selectedLog.ip_address || "127.0.0.1"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-100 p-4 bg-slate-50/30 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="h-4 w-4 text-orange-500" />
                                        <h4 className="section-label">User Information</h4>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-[#128C7E]/10 flex items-center justify-center text-[#128C7E] font-bold text-xs shrink-0">
                                            {selectedLog.performed_by.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-1.5">
                                                <p className="text-sm font-semibold text-slate-800">{selectedLog.performed_by.name}</p>
                                                {currentUserId === selectedLog.performed_by.id && (
                                                    <Badge className="bg-[#F0FDF9] text-[#128C7E] border-none px-1.5 py-0 text-[9px] font-bold h-4 rounded-full">YOU</Badge>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">{selectedLog.performed_by.role}</p>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3 flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0">
                                            {(selectedLog.affected_user?.name || "SY").substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="section-label mb-0.5">Target User</p>
                                            <p className="text-sm font-semibold text-slate-800">{selectedLog.affected_user?.name || "System"}</p>
                                            <p className="text-xs text-slate-400">{selectedLog.affected_user?.email || "system@internal"}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fields updated */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-[#128C7E]" />
                                    <h4 className="section-label">Fields Updated ({selectedLog.changes_made?.length || 0})</h4>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {selectedLog.changes_made?.map((change, i) => {
                                        const fieldName = typeof change === "string" ? change : change.field
                                        return (
                                            <Badge key={i} className="bg-[#128C7E] text-white border-none py-1 px-3 rounded-lg text-[10px] font-semibold">
                                                {fieldName}
                                            </Badge>
                                        )
                                    }) || <p className="text-sm text-slate-400 italic">No fields were modified</p>}
                                </div>
                            </div>

                            {/* Previous / new values */}
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { title: "Previous Values", icon: ChevronLeft, border: "border-red-100",     bg: "bg-red-50",     labelCls: "text-red-600",     textCls: "text-red-700",     key: "previousValue" as const },
                                    { title: "New Values",      icon: ChevronRight, border: "border-green-100", bg: "bg-green-50", labelCls: "text-green-600", textCls: "text-emerald-700", key: "newValue" as const },
                                ].map(({ title, icon: Icon, border, bg, labelCls, textCls, key }) => (
                                    <div key={title} className={cn("rounded-xl overflow-hidden border", border)}>
                                        <div className={cn("px-4 py-2 border-b flex items-center gap-1.5", bg, border.replace("border", "border-b"))}>
                                            <Icon className={cn("h-3.5 w-3.5", labelCls)} />
                                            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", labelCls)}>{title}</span>
                                        </div>
                                        <div className="p-4 font-mono text-[11px] min-h-[120px]">
                                            <div className="flex flex-col gap-2">
                                                {selectedLog.changes_made?.map((change, idx) => {
                                                    // Handle object format: { field, previousValue, newValue }
                                                    if (typeof change !== "string") {
                                                        const val = key === "previousValue" ? (change as any).previousValue : (change as any).newValue
                                                        if (val === undefined) return null;
                                                        return (
                                                            <div key={idx} className="flex justify-between border-b border-dashed pb-1 last:border-0 border-current opacity-70">
                                                                <span className="font-semibold">{change.field}:</span>
                                                                <span>{Array.isArray(val) || typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                                                            </div>
                                                        )
                                                    }
                                                    
                                                    // Handle string format: "key: value" or just "value"
                                                    let fieldName = change
                                                    let valStr = key === "previousValue" ? "..." : "updated"
                                                    if (change.includes(":")) {
                                                        const parts = change.split(":")
                                                        fieldName = parts[0].trim()
                                                        valStr = key === "previousValue" ? "..." : parts.slice(1).join(":").trim()
                                                    }

                                                    return (
                                                        <div key={idx} className="flex justify-between border-b border-dashed pb-1 last:border-0 border-current opacity-70">
                                                            <span className="font-semibold">{fieldName}:</span>
                                                            <span>{valStr}</span>
                                                        </div>
                                                    )
                                                })}
                                                {(!selectedLog.changes_made || selectedLog.changes_made.length === 0) && (
                                                    <span className="italic opacity-50">No data available</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {selectedLog.description && (
                                <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                                    <p className="section-label mb-2">Description</p>
                                    <p className="text-sm text-slate-600 italic">"{selectedLog.description}"</p>
                                </div>
                            )}

                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={() => { setSelectedLog(null); setShowDetailsModal(false) }}
                                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl px-8 btn-press"
                                >
                                    Close
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
