"use client"

import { useEffect, useState } from "react"
import {
    Columns, Filter, ArrowDownUp, Download,
    ChevronLeft, ChevronRight, Loader2,
    FileText, RefreshCw, Search, AlertCircle,
    CheckCircle, XCircle, Clock
} from "lucide-react"
import { userDashboardService } from "@/services/userDashboardService"
import { cn } from "@/lib/utils"

interface DeliveryReport {
    sent_at:string; message:string; from:string; to:string
    attachment_url?:string; status:string; mode:string
}

const ALL_COLS = ["Date Time","Message","From","To","Attachment","Status","Mode"]

export default function DeliveryReportsPage() {
    const [reports,  setReports]  = useState<DeliveryReport[]>([])
    const [loading,  setLoading]  = useState(true)
    const [error,    setError]    = useState<string|null>(null)
    const [filterText, setFilterText] = useState("")
    const [startDate,  setStartDate]  = useState("")
    const [endDate,    setEndDate]    = useState("")
    const [showFilter, setShowFilter] = useState(false)
    const [visibleCols, setVisibleCols] = useState<string[]>(ALL_COLS)
    const [showColToggle, setShowColToggle] = useState(false)
    const [density, setDensity] = useState<"compact"|"standard"|"comfortable">("standard")
    const [showDensity, setShowDensity] = useState(false)
    const [selected, setSelected] = useState<number[]>([])

    useEffect(() => { fetchReports() }, [])

    const fetchReports = async () => {
        setLoading(true); setError(null)
        try {
            const token = localStorage.getItem("token")
            if (!token) { setError("No auth token found"); return }
            const data = await userDashboardService.getDeliveryReports(
                token,
                startDate ? `${startDate}T00:00:00Z` : undefined,
                endDate   ? `${endDate}T23:59:59Z`   : undefined
            )
            setReports(Array.isArray(data) ? data : [])
        } catch { setError("Failed to load delivery reports") }
        finally { setLoading(false) }
    }

    const filteredReports = reports.filter((r) => {
        const matchText = !filterText ||
            [r.message,r.to,r.from,r.status].some(v=>(v||"").toLowerCase().includes(filterText.toLowerCase()))
        let matchDate = true
        if ((startDate||endDate) && r.sent_at) {
            const t = new Date(r.sent_at).getTime()
            if (startDate) { const [y,m,d]=startDate.split("-").map(Number); if(t<new Date(y,m-1,d).getTime()) matchDate=false }
            if (endDate)   { const [y,m,d]=endDate.split("-").map(Number);   if(t>new Date(y,m-1,d,23,59,59,999).getTime()) matchDate=false }
        }
        return matchText && matchDate
    })

    const handleExport = () => {
        const rows = selected.length ? filteredReports.filter((_,i)=>selected.includes(i)) : filteredReports
        if (!rows.length) return
        const csv = [ALL_COLS.join(","),
            ...rows.map(r=>[
                `"${fmtDate(r.sent_at)}"`,
                `"${(r.message||"").replace(/"/g,'""')}"`,
                `"${r.from}"`,`"${r.to}"`,
                `"${r.attachment_url?"Yes":"No"}"`,
                `"${r.status}"`,`"${r.mode}"`
            ].join(","))
        ].join("\n")
        const a=document.createElement("a")
        a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}))
        a.download=`delivery_reports_${new Date().toISOString().split("T")[0]}.csv`
        a.click()
    }

    const fmtDate = (s:string) => !s ? "-" : new Date(s).toLocaleString("en-IN",{
        day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true
    })

    const pad = density==="compact"?"p-2":density==="comfortable"?"p-5":"p-3.5"

    const statusConfig = (s:string) => {
        const u = (s||"").toUpperCase()
        if (["DELIVERED","READ","SENT","SUCCESS"].includes(u))
            return { cls:"bg-green-50 text-green-700 border border-green-200", icon:CheckCircle }
        if (u==="FAILED")
            return { cls:"bg-red-50 text-red-600 border border-red-200", icon:XCircle }
        return { cls:"bg-amber-50 text-amber-700 border border-amber-200", icon:Clock }
    }

    /* summary counts */
    const sentCount   = reports.filter(r=>["DELIVERED","READ","SENT","SUCCESS"].includes((r.status||"").toUpperCase())).length
    const failedCount = reports.filter(r=>r.status?.toUpperCase()==="FAILED").length
    const totalCount  = reports.length

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 p-8 pt-6 page-enter">

            {/* ── Header ── */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="page-header mb-0">
                    <div className="page-header-icon">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Delivery Reports</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Track message delivery status and history</p>
                    </div>
                </div>
                <button
                    onClick={fetchReports}
                    className="btn-brand flex items-center gap-2 px-4 py-2 text-sm rounded-xl"
                >
                    <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                    Refresh
                </button>
            </div>

            {/* ── Notice banner ── */}
            <div className="flex items-start gap-3 bg-amber-50 border-l-4 border-amber-400 rounded-r-xl px-4 py-3">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium">
                    Reports are cleared every Saturday. Please download your data before then.
                </p>
            </div>

            {/* ── Summary stat cards ── */}
            <div className="grid grid-cols-3 gap-4 stagger">
                {[
                    { label:"Total Messages", value:totalCount, bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", iconBg:"#DBEAFE", icon:FileText },
                    { label:"Sent / Delivered", value:sentCount, bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D", iconBg:"#DCFCE7", icon:CheckCircle },
                    { label:"Failed",          value:failedCount, bg:"#FFF1F2", border:"#FECDD3", text:"#BE123C", iconBg:"#FFE4E6", icon:XCircle },
                ].map((s)=>{
                    const Icon = s.icon
                    return (
                        <div key={s.label} className="rounded-2xl p-4 border flex items-center gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                            style={{background:s.bg,borderColor:s.border}}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:s.iconBg}}>
                                <Icon className="h-5 w-5" style={{color:s.text}} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide" style={{color:s.text,opacity:.65}}>{s.label}</p>
                                <p className="text-2xl font-bold tracking-tight" style={{color:s.text}}>{loading ? "—" : s.value.toLocaleString()}</p>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* ── Table card ── */}
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden"
                style={{boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>

                {/* Toolbar */}
                <div className="border-b border-slate-100">
                    <div className="flex items-center gap-1 px-4 py-3 flex-wrap relative">
                        {/* Toolbar buttons */}
                        {[
                            { icon:Columns,   label:"Columns",  active:showColToggle, action:()=>{setShowColToggle(p=>!p);setShowFilter(false);setShowDensity(false)} },
                            { icon:Filter,    label:"Filters",  active:showFilter,    action:()=>{setShowFilter(p=>!p);setShowColToggle(false);setShowDensity(false)} },
                            { icon:ArrowDownUp,label:"Density", active:showDensity,   action:()=>{setShowDensity(p=>!p);setShowColToggle(false);setShowFilter(false)} },
                        ].map(({icon:Icon,label,active,action})=>(
                            <button key={label} onClick={action}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                                    active
                                        ? "bg-[#F0FDF9] text-[#128C7E]"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                                )}>
                                <Icon className="h-3.5 w-3.5" />{label}
                            </button>
                        ))}
                        <button onClick={handleExport}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-[#128C7E] hover:bg-[#F0FDF9] transition-all">
                            <Download className="h-3.5 w-3.5" />
                            Export{selected.length>0?` (${selected.length})`:" CSV"}
                        </button>

                        {/* Selected count pill */}
                        {selected.length > 0 && (
                            <span className="ml-1 bg-[#128C7E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {selected.length} selected
                            </span>
                        )}

                        {/* Column toggle popup */}
                        {showColToggle && (
                            <div className="absolute top-11 left-4 z-50 bg-white shadow-xl border border-slate-100 rounded-xl p-3 min-w-[160px] flex flex-col gap-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1">Toggle Columns</p>
                                {ALL_COLS.map(col=>(
                                    <label key={col} className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 px-2 py-1 rounded-lg">
                                        <input type="checkbox" checked={visibleCols.includes(col)}
                                            onChange={()=>setVisibleCols(p=>p.includes(col)?p.filter(c=>c!==col):[...p,col])}
                                            className="w-3.5 h-3.5 rounded border-slate-300 accent-[#128C7E]" />
                                        <span className="text-sm text-slate-700">{col}</span>
                                    </label>
                                ))}
                            </div>
                        )}

                        {/* Density popup */}
                        {showDensity && (
                            <div className="absolute top-11 left-36 z-50 bg-white shadow-xl border border-slate-100 rounded-xl p-2 min-w-[130px]">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Row Density</p>
                                {(["compact","standard","comfortable"] as const).map(d=>(
                                    <button key={d} onClick={()=>{setDensity(d);setShowDensity(false)}}
                                        className={cn("w-full text-left px-3 py-2 text-sm rounded-lg capitalize transition-colors",
                                            density===d ? "bg-[#F0FDF9] text-[#128C7E] font-semibold" : "text-slate-600 hover:bg-slate-50")}>
                                        {d}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Filter row */}
                    {showFilter && (
                        <div className="px-4 pb-4 pt-2 flex flex-wrap gap-3 bg-slate-50/60 border-t border-slate-100 items-end">
                            {[
                                { label:"Start Date", type:"date", value:startDate, set:setStartDate },
                                { label:"End Date",   type:"date", value:endDate,   set:setEndDate },
                            ].map(({label,type,value,set})=>(
                                <div key={label} className="flex flex-col gap-1">
                                    <label className="label">{label}</label>
                                    <input type={type} value={value} onChange={e=>set(e.target.value)}
                                        className="form-input w-44 h-9 text-xs" />
                                </div>
                            ))}
                            <div className="flex flex-col gap-1 flex-1 min-w-[220px]">
                                <label className="label">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <input type="text" placeholder="Message, number, status…"
                                        value={filterText} onChange={e=>setFilterText(e.target.value)}
                                        className="form-input h-9 pl-9 text-xs w-full" />
                                </div>
                            </div>
                            {(startDate||endDate||filterText) && (
                                <button onClick={()=>{setStartDate("");setEndDate("");setFilterText("")}}
                                    className="h-9 px-3 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                    Clear All
                                </button>
                            )}
                            <button onClick={fetchReports}
                                className="h-9 px-4 text-xs font-semibold btn-brand rounded-xl">
                                Apply
                            </button>
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
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center">
                                <XCircle className="h-6 w-6 text-red-400" />
                            </div>
                            <p className="text-sm text-red-500 font-medium">{error}</p>
                            <button onClick={fetchReports} className="text-xs btn-brand px-4 py-2 rounded-xl">Retry</button>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center float">
                                <FileText className="h-6 w-6 text-slate-300" />
                            </div>
                            <p className="text-sm font-medium text-slate-400">
                                {filterText ? `No results for "${filterText}"` : "No delivery reports found"}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-100">
                                    <th className="pl-5 py-3.5 w-10">
                                        <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#128C7E] cursor-pointer"
                                            checked={selected.length===filteredReports.length && filteredReports.length>0}
                                            onChange={()=>setSelected(p=>p.length===filteredReports.length?[]:filteredReports.map((_,i)=>i))} />
                                    </th>
                                    {ALL_COLS.filter(c=>visibleCols.includes(c)).map(col=>(
                                        <th key={col} className="px-4 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 whitespace-nowrap">
                                            {col}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredReports.map((row, idx) => {
                                    const s = statusConfig(row.status)
                                    const StatusIcon = s.icon
                                    const isSelected = selected.includes(idx)
                                    return (
                                        <tr key={idx}
                                            className={cn("tr-hover transition-colors", isSelected && "bg-[#F0FDF9]/60")}
                                            style={{animation:`fadeSlideUp .3s ease ${idx*0.02}s both`}}>
                                            <td className={cn("pl-5", pad)}>
                                                <input type="checkbox" className="w-3.5 h-3.5 rounded border-slate-300 accent-[#128C7E] cursor-pointer"
                                                    checked={isSelected} onChange={()=>setSelected(p=>p.includes(idx)?p.filter(i=>i!==idx):[...p,idx])} />
                                            </td>
                                            {visibleCols.includes("Date Time") && (
                                                <td className={cn(pad,"whitespace-nowrap")}>
                                                    <p className="text-sm font-semibold text-slate-700">{fmtDate(row.sent_at)}</p>
                                                </td>
                                            )}
                                            {visibleCols.includes("Message") && (
                                                <td className={cn(pad,"max-w-[200px]")}>
                                                    <p className="text-sm text-slate-600 truncate">{row.message}</p>
                                                </td>
                                            )}
                                            {visibleCols.includes("From") && (
                                                <td className={cn(pad)}>
                                                    <p className="text-xs font-mono text-slate-400 truncate max-w-[120px]" title={row.from}>{row.from}</p>
                                                </td>
                                            )}
                                            {visibleCols.includes("To") && (
                                                <td className={cn(pad)}>
                                                    <p className="text-sm text-slate-600">{row.to}</p>
                                                </td>
                                            )}
                                            {visibleCols.includes("Attachment") && (
                                                <td className={cn(pad)}>
                                                    {row.attachment_url ? (
                                                        <a href={row.attachment_url} target="_blank" rel="noopener noreferrer"
                                                            className="text-xs text-[#128C7E] hover:underline font-medium">
                                                            View File
                                                        </a>
                                                    ) : (
                                                        <span className="text-slate-300 text-xs">—</span>
                                                    )}
                                                </td>
                                            )}
                                            {visibleCols.includes("Status") && (
                                                <td className={cn(pad)}>
                                                    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", s.cls)}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {row.status}
                                                    </span>
                                                </td>
                                            )}
                                            {visibleCols.includes("Mode") && (
                                                <td className={cn(pad)}>
                                                    <span className="text-xs font-semibold text-slate-500 uppercase bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                                                        {row.mode}
                                                    </span>
                                                </td>
                                            )}
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-50 bg-slate-50/40 text-xs text-slate-400">
                    <span className="font-medium">
                        {filteredReports.length > 0
                            ? `Showing ${filteredReports.length} of ${reports.length} records`
                            : "No records"}
                    </span>
                    <div className="flex items-center gap-2">
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
