"use client"

import { Columns, Filter, ArrowDownUp, Download, ChevronLeft, ChevronRight, Loader2, Search, RefreshCw, FileText, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { googleSheetsService } from "@/services/googleSheetsService"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Zap } from "lucide-react"

export default function ScheduleReportsPage() {
    const [reports, setReports] = useState<any[]>([])
    const [activeTriggers, setActiveTriggers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [showFilter, setShowFilter] = useState(false)
    const [showCols, setShowCols] = useState(false)
    const [density, setDensity] = useState<"compact"|"normal"|"spacious">("normal")
    const [showDensity, setShowDensity] = useState(false)
    const [statusFilter, setStatusFilter] = useState("ALL")
    const [visibleCols, setVisibleCols] = useState({
        dateTime:true, sheet:true, message:true, deviceName:false,
        phone:true, rowNumber:true, status:true, action:true
    })

    useEffect(() => { 
        fetchReports() 
        fetchActiveTriggers()
    }, [])

    const fetchActiveTriggers = async () => {
        try {
            const result = await googleSheetsService.getAllTriggers()
            setActiveTriggers(result.data || [])
        } catch { console.error("Failed to fetch active triggers") }
    }

    const fetchReports = async () => {
        setLoading(true)
        try {
            const result = await googleSheetsService.getAllTriggerHistory()
            setReports(result.data || [])
        } catch { console.error("Failed to fetch trigger reports") }
        finally { setLoading(false) }
    }

    const handleExport = () => {
        if (!reports.length) return
        const csv = [
            ["Date","Phone","Row","Message","Status"].join(","),
            ...filteredReports.map(r => [
                `"${new Date(r.triggered_at).toLocaleString()}"`,
                `"${r.phone_number}"`,
                r.row_number,
                `"${(r.message_content||"").replace(/"/g,'""')}"`,
                `"${r.status}"`
            ].join(","))
        ].join("\n")
        const a = document.createElement("a")
        a.href = URL.createObjectURL(new Blob([csv],{type:"text/csv"}))
        a.download = `schedule_reports_${new Date().toISOString().split("T")[0]}.csv`
        a.click()
    }

    const filteredReports = reports.filter(r => {
        const matchText = !searchTerm ||
            (r.phone_number||"").includes(searchTerm) ||
            (r.sheet_name||"").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (r.message_content||"").toLowerCase().includes(searchTerm.toLowerCase())
        const matchStatus = statusFilter==="ALL" || (r.status||"").toUpperCase()===statusFilter.toUpperCase()
        return matchText && matchStatus
    })

    const pad = density==="compact"?"p-2":density==="spacious"?"p-5":"p-3.5"

    const statusCfg = (s:string) => {
        const u=(s||"").toUpperCase()
        if(["SENT","SUCCESS","DELIVERED"].includes(u)) return { cls:"badge-success", icon:CheckCircle }
        if(u==="FAILED") return { cls:"badge-failed", icon:XCircle }
        return { cls:"badge-pending", icon:Clock }
    }

    const sentCount   = reports.filter(r=>["SENT","SUCCESS","DELIVERED"].includes((r.status||"").toUpperCase())).length
    const failedCount = reports.filter(r=>(r.status||"").toUpperCase()==="FAILED").length

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 p-8 pt-6 page-enter">

            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="page-header mb-0">
                    <div className="page-header-icon">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Schedule Reports</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Track all scheduled and triggered message deliveries</p>
                    </div>
                </div>
                <button onClick={fetchReports}
                    className="btn-brand flex items-center gap-2 px-4 py-2 text-sm rounded-xl">
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} /> Refresh
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4 stagger">
                {[
                    { label:"Total Triggers",   value:reports.length,  bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", iconBg:"#DBEAFE", icon:FileText },
                    { label:"Sent",             value:sentCount,       bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D", iconBg:"#DCFCE7", icon:CheckCircle },
                    { label:"Failed",           value:failedCount,     bg:"#FFF1F2", border:"#FECDD3", text:"#BE123C", iconBg:"#FFE4E6", icon:XCircle },
                ].map(s => {
                    const Icon = s.icon
                    return (
                        <div key={s.label} className="rounded-2xl p-4 border flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            style={{background:s.bg,borderColor:s.border}}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:s.iconBg}}>
                                <Icon className="h-5 w-5" style={{color:s.text}} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{color:s.text,opacity:.65}}>{s.label}</p>
                                <p className="text-2xl font-bold tracking-tight" style={{color:s.text}}>{loading?"—":s.value.toLocaleString()}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Active Triggers - THE FIX: Show what triggers are set up */}
            {activeTriggers.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm stagger-item">
                    <div className="px-5 py-3.5 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                            <h3 className="text-sm font-bold text-slate-800">Active Automation Triggers</h3>
                        </div>
                        <Link href="/dashboard/user/google-sheet/trigger" className="text-xs text-[#128C7E] hover:underline font-semibold flex items-center gap-1">
                             Manage Triggers <ArrowDownUp className="h-3 w-3 rotate-90" />
                        </Link>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {activeTriggers.map((t, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:border-amber-200 transition-colors">
                                <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0">
                                    <FileText className="h-4 w-4 text-[#128C7E]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-slate-700 truncate">{t.sheet_name}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase">{t.trigger_type.replace('_', ' ')}</span>
                                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold uppercase", t.is_enabled ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-600")}>
                                            {t.is_enabled ? "Running" : "Paused"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Table card */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>

                {/* Toolbar */}
                <div className="border-b border-slate-100">
                    <div className="flex items-center gap-1 px-4 py-3 flex-wrap relative">
                        {[
                            { icon:Columns,    label:"Columns", active:showCols,    action:()=>{setShowCols(p=>!p);setShowFilter(false);setShowDensity(false)} },
                            { icon:Filter,     label:"Filters", active:showFilter,  action:()=>{setShowFilter(p=>!p);setShowCols(false);setShowDensity(false)} },
                            { icon:ArrowDownUp,label:"Density", active:showDensity, action:()=>{setShowDensity(p=>!p);setShowCols(false);setShowFilter(false)} },
                        ].map(({icon:Icon,label,active,action})=>(
                            <button key={label} onClick={action}
                                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    active ? "bg-[#F0FDF9] text-[#128C7E]" : "text-slate-500 hover:text-slate-700 hover:bg-slate-50")}>
                                <Icon className="h-3.5 w-3.5" />{label}
                            </button>
                        ))}
                        <button onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#128C7E] hover:bg-[#F0FDF9] transition-all">
                            <Download className="h-3.5 w-3.5" /> Export CSV
                        </button>
                        <div className="ml-auto relative w-52">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input type="text" placeholder="Search campaign…" value={searchTerm}
                                onChange={e=>setSearchTerm(e.target.value)}
                                className="form-input h-8 pl-9 text-xs w-full" />
                        </div>

                        {/* Column popup */}
                        {showCols && (
                            <div className="absolute top-11 left-4 z-50 bg-white shadow-xl border border-slate-100 rounded-xl p-3 min-w-[170px]">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Toggle Columns</p>
                                {Object.entries(visibleCols).map(([key,val])=>(
                                    <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg">
                                        <input type="checkbox" checked={val}
                                            onChange={()=>setVisibleCols(p=>({...p,[key]:!val}))}
                                            className="w-3.5 h-3.5 rounded border-slate-300 accent-[#128C7E]" />
                                        <span className="text-sm text-slate-700 capitalize">{key.replace(/([A-Z])/g," $1")}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Density popup */}
                        {showDensity && (
                            <div className="absolute top-11 left-36 z-50 bg-white shadow-xl border border-slate-100 rounded-xl p-2 min-w-[130px]">
                                {(["compact","normal","spacious"] as const).map(d=>(
                                    <button key={d} onClick={()=>{setDensity(d);setShowDensity(false)}}
                                        className={cn("w-full text-left px-3 py-2 text-sm rounded-lg capitalize transition-colors",
                                            density===d ? "bg-[#F0FDF9] text-[#128C7E] font-semibold" : "text-slate-600 hover:bg-slate-50")}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Status filter bar */}
                    {showFilter && (
                        <div className="px-4 pb-4 pt-2 bg-slate-50/60 border-t border-slate-100 flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                            {["ALL","Pending","Running","Paused","Completed","Failed"].map(s=>(
                                <button key={s} onClick={()=>setStatusFilter(s)}
                                    className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition-all",
                                        statusFilter===s
                                            ? "bg-[#128C7E] border-[#128C7E] text-white"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-[#128C7E]/40")}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <Loader2 className="h-7 w-7 animate-spin text-[#128C7E]" />
                            <p className="text-sm text-slate-400 font-medium">Loading reports…</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center float">
                                <Clock className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">No records found</p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="pl-5 py-3.5 w-10">
                                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#128C7E]" />
                                    </th>
                                    {visibleCols.dateTime    && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 min-w-[160px]">Triggered At</th>}
                                    {visibleCols.sheet       && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 min-w-[150px]">Trigger Source</th>}
                                    {visibleCols.message     && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 min-w-[200px]">Message</th>}
                                    {visibleCols.phone       && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Phone</th>}
                                    {visibleCols.rowNumber   && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-center">Row</th>}
                                    {visibleCols.status      && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Status</th>}
                                    {visibleCols.action      && <th className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 text-center">Log</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReports.map((row, idx) => {
                                    const s = statusCfg(row.status)
                                    const StatusIcon = s.icon
                                    return (
                                        <tr key={idx} className="tr-hover"
                                            style={{animation:`fadeSlideUp .3s ease ${idx*0.02}s both`}}>
                                            <td className={cn("pl-5",pad)}>
                                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#128C7E]" />
                                            </td>
                                            {visibleCols.dateTime && (
                                                <td className={cn(pad,"whitespace-nowrap")}>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {new Date(row.triggered_at).toLocaleDateString("en-IN")}
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {new Date(row.triggered_at).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}
                                                    </p>
                                                </td>
                                            )}
                                            {visibleCols.sheet && (
                                                <td className={cn(pad,"whitespace-nowrap")}>
                                                    <p className="text-sm font-semibold text-[#128C7E] truncate max-w-[140px]">{row.sheet_name||"Unknown Sheet"}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono">{row.spreadsheet_id ? `${row.spreadsheet_id.slice(0,6)}...` : "—"}</p>
                                                </td>
                                            )}
                                            {visibleCols.message && (
                                                <td className={cn(pad,"max-w-[200px]")}>
                                                    <p className="text-sm text-slate-600 truncate">{row.message_content||"—"}</p>
                                                </td>
                                            )}
                                            {visibleCols.phone && (
                                                <td className={pad}>
                                                    <span className="font-semibold text-[#128C7E] bg-[#F0FDF9] border border-[#A7F3D0] px-2.5 py-0.5 rounded-full text-xs font-mono">
                                                        {row.phone_number}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleCols.rowNumber && (
                                                <td className={cn(pad,"text-center")}>
                                                    <span className="text-xs font-bold text-slate-500">#{row.row_number}</span>
                                                </td>
                                            )}
                                            {visibleCols.status && (
                                                <td className={pad}>
                                                    <span className={cn("inline-flex items-center gap-1", s.cls)}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {row.status}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleCols.action && (
                                                <td className={cn(pad,"text-center")}>
                                                    {row.error_message ? (
                                                        <div className="group relative inline-block">
                                                            <AlertCircle className="h-4 w-4 text-red-400 cursor-help" />
                                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-xs rounded-lg px-3 py-2 w-48 z-10 text-center">
                                                                {row.error_message}
                                                            </div>
                                                        </div>
                                                    ) : <span className="text-slate-300 text-xs">—</span>}
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="px-5 py-3.5 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between">
                    <p className="text-xs text-slate-400 font-medium">
                        Showing {filteredReports.length} of {reports.length} records
                    </p>
                    <div className="flex gap-2">
                        <button disabled className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-300">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button disabled className="w-7 h-7 rounded-lg flex items-center justify-center bg-white border border-slate-200 text-slate-300">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
