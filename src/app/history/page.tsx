"use client"

import DashboardLayout from "@/components/layout/DashboardLayout"
import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Search, Eye, Calendar, Info, Users } from "lucide-react"
import { useState } from "react"

// Mock Data
const activities = [
    {
        id: 1,
        date: "Jan 05, 2026",
        time: "06:20 AM",
        actionType: "UPDATE USER",
        module: "Users",
        performedBy: { name: "rahul waghole", role: "Reseller", isYou: true },
        affectedUser: { name: "Akshay Patil", email: "rsl.jayashree1803@gmail..." },
        changes: ["isActive"],
    },
    {
        id: 2,
        date: "Jan 05, 2026",
        time: "06:20 AM",
        actionType: "UPDATE USER",
        module: "Users",
        performedBy: { name: "rahul waghole", role: "Reseller", isYou: true },
        affectedUser: { name: "Akshay Patil", email: "rsl.jayashree1803@gmail..." },
        changes: ["isActive"],
    },
    {
        id: 3,
        date: "Jan 05, 2026",
        time: "06:20 AM",
        actionType: "UPDATE USER",
        module: "Users",
        performedBy: { name: "rahul waghole", role: "Reseller", isYou: true },
        affectedUser: { name: "Akshay Patil", email: "rsl.jayashree1803@gmail..." },
        changes: ["isActive"],
    },
    {
        id: 4,
        date: "Dec 30, 2025",
        time: "01:38 PM",
        actionType: "UPDATE USER",
        module: "Users",
        performedBy: { name: "rahul waghole", role: "Reseller", isYou: true },
        affectedUser: { name: "Akshay", email: "asp799159@gmail.com" },
        changes: ["isActive"],
    },
    {
        id: 5,
        date: "Dec 30, 2025",
        time: "01:37 PM",
        actionType: "UPDATE USER",
        module: "Users",
        performedBy: { name: "rahul waghole", role: "Reseller", isYou: true },
        affectedUser: { name: "Akshay", email: "asp799159@gmail.com" },
        changes: ["isActive"],
    }
]

export default function HistoryPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedModule, setSelectedModule] = useState("All Modules")
    const [selectedAction, setSelectedAction] = useState("All Actions")
    const [startDate, setStartDate] = useState("")
    const [endDate, setEndDate] = useState("")

    // Unique Modules and Actions for Dropdowns
    const modules = ["All Modules", ...Array.from(new Set(activities.map(a => a.module)))]
    const actions = ["All Actions", ...Array.from(new Set(activities.map(a => a.actionType)))]

    const filteredActivities = activities.filter(activity => {
        const matchesSearch = (
            activity.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.performedBy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.performedBy.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.affectedUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.affectedUser.email.toLowerCase().includes(searchQuery.toLowerCase())
        )

        const matchesModule = selectedModule === "All Modules" || activity.module === selectedModule
        const matchesAction = selectedAction === "All Actions" || activity.actionType === selectedAction

        const activityDate = new Date(activity.date)
        const start = startDate ? new Date(startDate) : null
        const end = endDate ? new Date(endDate) : null

        const matchesDate = (!start || activityDate >= start) && (!end || activityDate <= end)

        return matchesSearch && matchesModule && matchesAction && matchesDate
    })

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Shield className="h-6 w-6 text-blue-600" />
                            My Activity History
                        </h1>
                        <p className="text-gray-500 mt-1">View all changes made to your account by admins and the system</p>
                    </div>
                    <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => {
                        setSearchQuery("")
                        setSelectedModule("All Modules")
                        setSelectedAction("All Actions")
                        setStartDate("")
                        setEndDate("")
                    }}>
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>

                {/* Info Banner */}
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-md flex items-start gap-4">
                    <Shield className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-900">
                        <p className="font-semibold mb-1">Note: This shows all activity related to your account including:</p>
                        <ul className="list-disc ml-4 space-y-1">
                            <li>Changes made <span className="font-semibold">to your account</span> by admins/system</li>
                            <li>Actions performed <span className="font-semibold">by you</span> (marked with "You" badge)</li>
                        </ul>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Total Activities</p>
                        <h3 className="text-3xl font-bold text-gray-900">{activities.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Filtered Results</p>
                        <h3 className="text-3xl font-bold text-blue-600">{filteredActivities.length}</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Last Activity</p>
                        <h3 className="text-xl font-bold text-gray-900">a day ago</h3>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by action, module, admin, or IP..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Module</label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                            >
                                {modules.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Action</label>
                            <select
                                className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selectedAction}
                                onChange={(e) => setSelectedAction(e.target.value)}
                            >
                                {actions.map(a => <option key={a} value={a}>{a}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Start Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">End Date</label>
                            <div className="relative">
                                <input
                                    type="date"
                                    className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">DATE & TIME</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">ACTION TYPE</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">PERFORMED BY</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">AFFECTED USER</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">CHANGES MADE</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">DETAILS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredActivities.length > 0 ? (
                                    filteredActivities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{activity.date}</div>
                                                <div className="text-gray-500 text-xs">{activity.time}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-blue-100 text-blue-800 uppercase">
                                                    {activity.actionType}
                                                </span>
                                                <div className="text-gray-500 text-xs mt-1">{activity.module}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-600">
                                                        <Users className="h-3 w-3" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 flex items-center gap-2">
                                                            {activity.performedBy.name}
                                                            {activity.performedBy.isYou && (
                                                                <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-medium">You</span>
                                                            )}
                                                        </div>
                                                        <div className="text-gray-500 text-xs">{activity.performedBy.role}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs text-blue-600">
                                                        <Users className="h-3 w-3" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{activity.affectedUser.name}</div>
                                                        <div className="text-gray-500 text-xs truncate max-w-[150px]">{activity.affectedUser.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-2">
                                                    {activity.changes.map((change, i) => (
                                                        <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs border font-mono">
                                                            {change}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-full transition-colors">
                                                    <Eye className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No activities found matching your filters.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
