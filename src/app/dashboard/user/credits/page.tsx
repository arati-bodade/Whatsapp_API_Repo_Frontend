"use client"

import { Button } from "@/components/ui/button"
import { Shield, RefreshCw, Search, Calendar, CreditCard, ArrowLeft, AlertCircle, Download } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import creditService, { MessageUsageLog } from "@/services/creditService"
import { API_BASE_URL } from "@/config/api"
import { useAuth } from "@/context/AuthContext"
import { useCredits } from "@/hooks/useCredits"

export default function CreditUsagePage() {
    const router = useRouter()
    const { user, token, logout } = useAuth()
    const [isLoading, setIsLoading] = useState(true)
    const [logs, setLogs] = useState<MessageUsageLog[]>([])
    
    // 🔥 FIX: Use centralized credit management for real-time sync
    const { credits, refreshCredits, isLoading: isCreditsLoading } = useCredits(token)
    
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0]
    const [startDate, setStartDate] = useState(today)
    const [endDate, setEndDate] = useState(today)
    const [error, setError] = useState("")
    const [summary, setSummary] = useState<{ 
        total_usage: number, 
        total_added: number,
        latest_deduction: { credits: number, timestamp: string | null } | null,
        latest_transaction: { credits: number, timestamp: string | null, message_id: string | null } | null
    } | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        setError("")
        try {
            if (!token || !user) {
                logout()
                return
            }

            // First check if backend is running - Use production URL if available
            try {
                const healthUrl = API_BASE_URL.replace('/api', '') + '/health'
                const healthResponse = await fetch(healthUrl)
                if (!healthResponse.ok) {
                    throw new Error('Backend not healthy')
                }
            } catch (healthError: any) {
                console.error('Backend health check failed:', healthError)
                setError('Backend server is not running. Please start the backend server.')
                setIsLoading(false)
                return
            }

            // Default to today's date if no filters set
            const today = new Date().toISOString().split('T')[0]
            const start = startDate || today
            const end = endDate || today

            // Fetch today's usage logs by default
            const [logsData, balanceData, summaryData] = await Promise.all([
                creditService.getMessageCreditUsage(token, {
                    start_date: new Date(start).toISOString(),
                    end_date: new Date(end + 'T23:59:59').toISOString(),
                    limit: 100
                }),
                creditService.getUserCurrentBalance(token),
                creditService.getCreditSummary(token)
            ])

            setLogs(logsData)
            // Balance is now managed by useCredits hook
            setSummary(summaryData)
            console.log('Usage data fetched:', { logs: logsData.length, balance: balanceData, summary: summaryData, dateRange: `${start} to ${end}` })

        } catch (err: any) {
            console.error("Error fetching credit usage:", err)
            
            // More detailed error handling
            if (err.code === 'ECONNREFUSED' || err.message?.includes('Failed to fetch')) {
                setError('Backend server is not accessible. Please check if server is running on port 8000.')
            } else if (err.response?.status === 401) {
                setError('Authentication failed. Please log in again.')
                logout()
            } else if (err.response?.status === 404) {
                setError('User account not found. Please contact support.')
            } else if (err.response?.status >= 500) {
                setError('Server error. Please try again later.')
            } else {
                setError(err.response?.data?.message || err.message || "Failed to load credit history")
            }
            
            // Set fallback values to show something instead of ---
            setSummary({ total_usage: 0, total_added: 0, latest_deduction: null, latest_transaction: null })
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [startDate, endDate]) // Re-fetch when filters change

    const exportToCSV = () => {
        if (!logs || logs.length === 0) return;

        const headers = ['Date', 'Time', 'Message ID', 'Credits Change', 'Balance After', 'Reference'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
            const date = new Date(log.timestamp).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                timeZone: 'Asia/Kolkata'
            });
            const time = new Date(log.timestamp).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
                timeZone: 'Asia/Kolkata'
            });
            const change = log.credits_deducted > 0 ? `-${log.credits_deducted}` : `+${Math.abs(log.credits_deducted)}`;
            
            csvRows.push([
                `"${date}"`,
                `"${time}"`,
                `"${log.message_id || ''}"`,
                `"${change}"`,
                `"${log.balance_after}"`,
                `"${log.usage_id}"`
            ].join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `credit_usage_${startDate}_to_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-6xl mx-auto w-full px-4 md:px-0 space-y-6">

                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <CreditCard className="h-6 w-6 text-blue-600" />
                            Credit Usage History
                        </h1>
                        <p className="text-gray-500 mt-1">Track your message credit consumption and balance history</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => router.back()} className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <Button variant="outline" onClick={exportToCSV} disabled={isLoading || logs.length === 0} className="gap-2 text-green-600 border-green-600 hover:bg-green-50">
                            <Download className="h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={fetchData}>
                            <RefreshCw className="h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="h-5 w-5 text-red-600" />
                            <div>
                                <h3 className="font-medium text-red-900">Connection Error</h3>
                                <p className="text-red-700 text-sm mt-1">{error}</p>
                            </div>
                        </div>
                        <Button onClick={fetchData} className="mt-3 bg-red-600 hover:bg-red-700">
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Content */}
                {!error && (
                    <>
                        {/* Balance & Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl border shadow-sm border-l-4 border-l-blue-500">
                        <p className="text-sm text-gray-500 font-medium mb-2">Current Balance</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {isCreditsLoading && !credits ? (
                                <div className="h-9 w-24 bg-slate-100 rounded-md animate-pulse" />
                            ) : credits?.current_balance !== null && credits?.current_balance !== undefined ? (
                                Math.round(credits.current_balance).toLocaleString()
                            ) : (
                                "---"
                            )}
                        </h3>
                        <p className="text-xs text-blue-600 mt-1 font-medium">Available Credits</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Total Usage (Sent)</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {isLoading ? (
                                <div className="h-9 w-24 bg-slate-100 rounded-md animate-pulse" />
                            ) : summary?.total_usage !== undefined ? (
                                Math.round(summary.total_usage).toLocaleString()
                            ) : (
                                "0"
                            )}
                        </h3>
                        <p className="text-xs text-red-400 mt-1">Credits Deducted</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Total Added</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            {isLoading ? (
                                <div className="h-9 w-24 bg-slate-100 rounded-md animate-pulse" />
                            ) : summary?.total_added !== undefined ? (
                                Math.round(summary.total_added).toLocaleString()
                            ) : (
                                "0"
                            )}
                        </h3>
                        <p className="text-xs text-emerald-500 mt-1">Credits Recharged</p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border shadow-sm">
                        <p className="text-sm text-gray-500 font-medium mb-2">Latest Activity</p>
                        <h3 className="text-xl font-bold text-gray-900">
                            {summary?.latest_transaction?.timestamp ? new Date(summary.latest_transaction.timestamp).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                timeZone: 'Asia/Kolkata'
                            }) : "N/A"}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 font-medium italic">
                            {summary?.latest_transaction?.credits !== undefined ? (
                                summary.latest_transaction.credits > 0 ? `Deducted: ${summary.latest_transaction.credits}` : `Added: ${Math.abs(summary.latest_transaction.credits)}`
                            ) : ""}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">Start Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-500">End Date</label>
                            <input
                                type="date"
                                className="w-full border rounded-lg p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <Button variant="ghost" className="text-gray-500" onClick={() => { 
                                setStartDate(today); 
                                setEndDate(today); 
                            }}>
                                Clear Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">DATE & TIME</th>
                                    <th className="px-4 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Message ID</th>
                                    <th className="px-4 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Credits</th>
                                    <th className="px-4 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Balance</th>
                                    <th className="px-4 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Reference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y relative">
                                {isLoading && !logs.length && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            Loading history...
                                        </td>
                                    </tr>
                                )}
                                {!isLoading && logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.usage_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">
                                                    {new Date(log.timestamp).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric',
                                                        timeZone: 'Asia/Kolkata'
                                                    })}
                                                </div>
                                                <div className="text-gray-500 text-xs">
                                                    {new Date(log.timestamp).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        hour12: true,
                                                        timeZone: 'Asia/Kolkata'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div 
                                                    className="font-mono text-[10px] text-gray-600 max-w-[120px] truncate" 
                                                    title={log.message_id}
                                                >
                                                    {log.message_id}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                {log.credits_deducted > 0 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-red-50 text-red-600 border border-red-100">
                                                        -{log.credits_deducted}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        +{Math.abs(log.credits_deducted)}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-black text-gray-700 whitespace-nowrap">
                                                {log.balance_after.toLocaleString()}
                                            </td>
                                            <td className="px-4 py-4 text-right text-gray-400 text-[10px] font-mono whitespace-nowrap">
                                                {log.usage_id.substring(0, 8)}...
                                            </td>
                                        </tr>
                                    ))
                                ) : !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            <div className="space-y-2">
                                                <p className="text-lg font-medium">No messages sent today</p>
                                                <p className="text-sm">Send messages to see credit usage history here</p>
                                                <p className="text-xs text-gray-400">Try adjusting date filters to view older messages</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {error && !isLoading && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-red-500">
                                            {error}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                    </>
                )}
        </div>
    );
}
