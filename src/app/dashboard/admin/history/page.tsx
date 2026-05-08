"use client"

import { useState, useEffect } from "react"
import { 
    History, 
    RefreshCw, 
    Info, 
    Activity, 
    Filter, 
    Calendar as CalendarIcon, 
    Search,
    User,
    Eye,
    ChevronLeft,
    ChevronRight,
    Clock,
    Loader2,
    Download
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { getAdminAuditLogs } from "@/config/api"

export default function AdminActivityHistoryPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(true)
    const [activities, setActivities] = useState<any[]>([])
    const [stats, setStats] = useState({
        total: 0,
        filtered: 0,
        daysSinceLast: 0
    })
    const [filters, setFilters] = useState({
        module: "all",
        action: "all",
        startDate: "",
        endDate: ""
    })
    const [selectedActivity, setSelectedActivity] = useState<any>(null)
    const [isDetailsOpen, setIsDetailsOpen] = useState(false)

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const params: any = {
                search: searchQuery || undefined,
                limit: 100
            }
            if (filters.module !== 'all') params.module = filters.module
            if (filters.action !== 'all') params.action = filters.action.toUpperCase()
            if (filters.startDate) params.start_date = filters.startDate
            if (filters.endDate) params.end_date = filters.endDate

            const data = await getAdminAuditLogs(params)
            
            // Map API logs to UI format
            const mapped = data.logs.map((log: any) => {
                const dt = new Date(log.created_at)
                return {
                    id: log.id,
                    dateTime: { 
                        date: dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        time: dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    },
                    actionType: { 
                        label: log.action_type, 
                        category: log.module 
                    },
                    performedBy: { 
                        name: log.performed_by_name, 
                        role: log.performed_by_role, 
                        isYou: log.performed_by_role === 'admin', 
                        initials: (log.performed_by_name || "Sys").split(' ').map((n: string) => n ? n[0] : '').join('').toUpperCase().substring(0, 2)
                    },
                    affectedUser: { 
                        name: log.affected_user_name || "System", 
                        email: log.affected_user_email || "N/A" 
                    },
                    changes: Array.isArray(log.changes_made) ? log.changes_made.join(', ') : (log.description || "No specific changes"),
                    changesRaw: log.changes_made || [],
                    description: log.description,
                    ipAddress: log.ip_address || "N/A",
                    details: true
                }
            })

            setActivities(mapped)
            setStats({
                total: data.total,
                filtered: data.filtered,
                daysSinceLast: data.last_activity_days_ago || 0
            })
        } catch (error) {
            console.error("Failed to fetch logs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleExport = () => {
        if (activities.length === 0) return;
        
        const headers = ["Date", "Time", "Action", "Module", "Performed By", "Role", "Affected User", "Affected Email", "Description", "Changes"];
        
        const escapeCSV = (val: any) => {
            if (val === null || val === undefined) return "";
            const str = String(val).replace(/"/g, '""');
            return str.includes(',') || str.includes('"') || str.includes('\n') ? `"${str}"` : str;
        };

        const csvRows = [
            headers.join(','),
            ...activities.map(a => [
                a.dateTime.date,
                a.dateTime.time,
                a.actionType.label,
                a.actionType.category,
                a.performedBy.name,
                a.performedBy.role,
                a.affectedUser.name,
                a.affectedUser.email,
                a.description || '',
                a.changes
            ].map(escapeCSV).join(','))
        ];

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `activity-history-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    useEffect(() => {
        fetchLogs()
    }, [searchQuery, filters])

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600 border border-indigo-100 shadow-sm">
                        <History className="w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">Activity History</h1>
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-0.5">View all changes made to your account</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={handleExport}
                        disabled={activities.length === 0 || isLoading}
                        className="rounded-xl font-bold gap-2 border-slate-200 hover:bg-slate-50 active:scale-95 transition-all text-slate-600 px-6 h-11"
                    >
                        <Download className="w-4 h-4" />
                        Extract
                    </Button>
                    <Button 
                        onClick={fetchLogs}
                        disabled={isLoading}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold gap-2 shadow-lg shadow-indigo-600/20 px-6 h-11"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Info Banner */}
            <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl flex items-start gap-4">
                <div className="w-1 bg-blue-500 self-stretch rounded-full" />
                <div className="flex items-center gap-2 text-blue-700">
                    <Info className="w-4 h-4 shrink-0" />
                    <p className="text-[13px] font-bold tracking-tight leading-relaxed">
                        This log shows all activity related to your account including: 
                        <span className="opacity-80 ml-1">Changes made by admins/system, and actions performed by you (marked with "You" badge)</span>
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                            <Activity className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-blue-600/60 uppercase tracking-widest leading-none mb-1">Total Activities</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shadow-sm">
                            <Filter className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-purple-600/60 uppercase tracking-widest leading-none mb-1">Filtered Results</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.filtered}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white group hover:scale-[1.02] transition-transform">
                    <CardContent className="p-6 flex items-center gap-5">
                        <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-sm">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-emerald-600/60 uppercase tracking-widest leading-none mb-1">Days Since Last</p>
                            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stats.daysSinceLast}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar Card */}
            <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden bg-white">
                <CardContent className="p-8 space-y-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input 
                            placeholder="Search by action, module, or user..." 
                            className="pl-12 h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-indigo-600 font-bold placeholder:text-slate-400 placeholder:font-bold text-slate-900"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Module</label>
                            <Select 
                                value={filters.module} 
                                onValueChange={(v) => setFilters(prev => ({ ...prev, module: v }))}
                            >
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold text-slate-900">
                                    <SelectValue placeholder="All Modules" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-bold">All Modules</SelectItem>
                                    <SelectItem value="Credits" className="font-bold">Credits</SelectItem>
                                    <SelectItem value="Plans" className="font-bold">Plans</SelectItem>
                                    <SelectItem value="Users" className="font-bold">Users</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Action</label>
                            <Select 
                                value={filters.action}
                                onValueChange={(v) => setFilters(prev => ({ ...prev, action: v }))}
                            >
                                <SelectTrigger className="h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold text-slate-900">
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all" className="font-bold">All Actions</SelectItem>
                                    <SelectItem value="CREATE" className="font-bold">Create</SelectItem>
                                    <SelectItem value="UPDATE" className="font-bold">Update</SelectItem>
                                    <SelectItem value="DELETE" className="font-bold">Delete</SelectItem>
                                    <SelectItem value="PLAN PURCHASE" className="font-bold">Purchase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Start Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Input 
                                    type="date" 
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold" 
                                    value={filters.startDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">End Date</label>
                            <div className="relative">
                                <CalendarIcon className="absolute right-3.5 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                                <Input 
                                    type="date" 
                                    className="h-12 rounded-xl bg-slate-50/50 border-slate-100 font-bold" 
                                    value={filters.endDate}
                                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Activity Table */}
            <div className="border border-slate-100 rounded-[2.5rem] bg-white shadow-2xl shadow-slate-200/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Type</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Performed By</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Affected User</th>
                                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Changes Made</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 relative">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                            <p className="text-slate-400 font-bold text-sm">Loading activity logs...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center">
                                        <p className="text-slate-400 font-bold text-sm">No activity logs found matching your filters.</p>
                                    </td>
                                </tr>
                            ) : (
                                activities.map((activity) => (
                                    <tr key={activity.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[13px] font-black text-slate-900">{activity.dateTime.date}</p>
                                                <p className="text-[11px] font-bold text-slate-400">{activity.dateTime.time}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-1.5">
                                                <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[10px] px-2.5 py-0.5 rounded-full ring-1 ring-blue-600/10">
                                                    {activity.actionType.label}
                                                </Badge>
                                                <p className="text-[10px] font-black text-slate-400 ml-1 tracking-widest">{activity.actionType.category}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border-2 border-slate-100 shadow-sm">
                                                    <AvatarFallback className="bg-slate-100 text-slate-600 font-black text-xs">{activity.performedBy.initials}</AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="text-[13px] font-black text-slate-900 truncate">{activity.performedBy.name}</p>
                                                        {activity.performedBy.isYou && (
                                                            <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[8px] px-1.5 py-0 rounded uppercase tracking-tighter">YOU</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-0.5">{activity.performedBy.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="space-y-1">
                                                <p className="text-[13px] font-black text-slate-900">{activity.affectedUser.name}</p>
                                                {activity.affectedUser.email && activity.affectedUser.email !== "N/A" && (
                                                    <p className="text-[11px] font-bold text-slate-400">{activity.affectedUser.email}</p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 font-bold text-[10px] px-3 py-1 rounded-lg italic text-capitalize">
                                                {activity.changes}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button 
                                                onClick={() => {
                                                    setSelectedActivity(activity);
                                                    setIsDetailsOpen(true);
                                                }}
                                                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all group-hover:scale-110"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                {!isLoading && (
                    <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <p className="text-xs font-bold text-slate-400">
                            Showing <span className="text-slate-900">{activities.length}</span> of <span className="text-slate-900">{stats.filtered}</span> records
                        </p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-black text-slate-400 border-slate-200 hover:bg-white flex items-center gap-1.5 disabled:opacity-40" disabled>
                                <ChevronLeft className="w-4 h-4" />
                                Previous
                            </Button>
                            <Button variant="outline" size="sm" className="rounded-xl h-9 px-4 font-black text-slate-900 border-slate-200 bg-white hover:bg-slate-50 flex items-center gap-1.5">
                                Next
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Activity Details Modal */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                <DialogContent className="sm:max-w-2xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="bg-indigo-600 p-8 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                <History className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-black tracking-tight">Activity Details</DialogTitle>
                                <DialogDescription className="text-indigo-100 font-bold text-xs uppercase tracking-widest mt-1 opacity-80">
                                    Comprehensive log information
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedActivity && (
                        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                                <p className="text-sm font-bold text-slate-900">{selectedActivity.dateTime.date} at {selectedActivity.dateTime.time}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm shadow-slate-200/20">
                                <div className="space-y-3">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performed By</p>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-md">
                                            <AvatarFallback className="bg-white text-indigo-600 font-black">{selectedActivity.performedBy.initials}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="text-[13px] font-black text-slate-900">{selectedActivity.performedBy.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedActivity.performedBy.role}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3 text-right">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Affected User</p>
                                    <div className="space-y-0.5">
                                        <p className="text-[13px] font-black text-slate-900">{selectedActivity.affectedUser.name}</p>
                                        {selectedActivity.affectedUser.email && selectedActivity.affectedUser.email !== "N/A" && (
                                            <p className="text-[11px] font-bold text-slate-400">{selectedActivity.affectedUser.email}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Action Details</p>
                                    <Badge className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px] px-3 py-1 rounded-full ring-1 ring-indigo-600/10">
                                        {selectedActivity.actionType.label} • {selectedActivity.actionType.category}
                                    </Badge>
                                </div>
                                
                                <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-inner space-y-4">
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed italic">
                                        "{selectedActivity.description || 'No description provided'}"
                                    </p>
                                    
                                    {selectedActivity.changesRaw && selectedActivity.changesRaw.length > 0 && (
                                        <div className="pt-4 border-t border-slate-50 space-y-3">
                                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Specific Changes Made</p>
                                            <div className="flex flex-wrap gap-2">
                                                {selectedActivity.changesRaw.map((change: string, idx: number) => (
                                                    <Badge key={idx} variant="outline" className="bg-emerald-50/50 border-emerald-100 text-emerald-700 font-bold py-1.5 px-3 rounded-lg">
                                                        {change}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                        <Button 
                            onClick={() => setIsDetailsOpen(false)}
                            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold px-8 shadow-lg shadow-slate-900/20"
                        >
                            Close Details
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
