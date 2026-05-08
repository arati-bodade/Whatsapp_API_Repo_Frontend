"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { businessService, BusinessProfile } from "@/services/businessService"
import { useModal } from "@/context/ModalContext"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  Loader2, Search, Edit, Trash2, Users,
  Plus, Clock, Wifi, WifiOff, Eye, UserPlus
} from "lucide-react"

interface Analytics {
  total_users:number; active_users:number; connected_users:number;
  disconnected_users:number; plan_expired_users:number;
}

const statConfig = [
  { key:"total_users",       label:"Total Users",    bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", iconBg:"#DBEAFE", icon:Users    },
  { key:"connected_users",   label:"Connected",      bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D", iconBg:"#DCFCE7", icon:Wifi     },
  { key:"disconnected_users",label:"Disconnected",   bg:"#FFF1F2", border:"#FECDD3", text:"#BE123C", iconBg:"#FFE4E6", icon:WifiOff  },
  { key:"plan_expired_users",label:"Plan Expired",   bg:"#FFFBEB", border:"#FDE68A", text:"#B45309", iconBg:"#FEF3C7", icon:Clock    },
]

export default function ResellerUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<BusinessProfile[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { showAlert, showConfirm } = useModal()
  const [searchQuery, setSearchQuery] = useState("")

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
      let resellerId = localStorage.getItem("reseller_id") || localStorage.getItem("user_id")
      if (!token || !resellerId || resellerId === "undefined") {
        setError("Authentication session invalid. Please log in."); setLoading(false); return
      }
      const [usersData, stats] = await Promise.all([
        businessService.getBusinessesByReseller(resellerId, token),
        businessService.getAnalytics(token)
      ])
      setUsers(usersData); setAnalytics(stats)
    } catch { setError("Failed to load users.") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleDelete = async (userId: string, name: string) => {
    showConfirm("Delete User", `Delete "${name}"?`, async () => {
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
        if (!token) return
        await businessService.delete(userId, token)
        setUsers(u => u.filter(x => x.busi_user_id !== userId))
        fetchData()
        showAlert("Success","User deleted successfully.")
      } catch { showAlert("Error","Deletion failed.") }
    })
  }

  const filtered = users.filter(u =>
    [u.business.business_name, u.profile.name, u.profile.email, u.profile.phone]
      .some(v => (v||"").toLowerCase().includes(searchQuery.toLowerCase()))
  )

  if (loading) return (
    <div className="flex h-[70vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[#128C7E]" />
    </div>
  )

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 page-enter">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="page-header mb-0">
          <div className="page-header-icon">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            <p className="text-sm text-slate-500 mt-0.5">Manage and monitor all your business users</p>
          </div>
        </div>
        <Button
          className="btn-brand h-10 px-5 gap-2 text-sm"
          onClick={() => router.push("/dashboard/reseller/users/create")}
        >
          <Plus className="h-4 w-4" /> Add New User
        </Button>
      </div>

      {/* Soft stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {statConfig.map((s) => {
          const Icon = s.icon
          const val = analytics ? (analytics as any)[s.key] ?? 0 : 0
          return (
            <div key={s.key} className="rounded-2xl p-5 border flex items-start justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{background:s.bg, borderColor:s.border}}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:s.text,opacity:.65}}>{s.label}</p>
                <p className="text-3xl font-bold tracking-tight" style={{color:s.text}}>{val}</p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:s.iconBg}}>
                <Icon className="h-5 w-5" style={{color:s.text}} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div className="p-5 border-b border-slate-50 flex items-center justify-between gap-4 flex-wrap">
          <h3 className="text-sm font-semibold text-slate-800">User Analytics</h3>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, email, mobile…"
              className="pl-10 h-10 rounded-xl border-slate-200 bg-slate-50 text-sm focus:bg-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
                {["User","Company","Contact","Plan","Credits","Status","Actions"].map((h,i)=>(
                  <TableHead key={h} className={cn("py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400", i===0&&"pl-6", i===6&&"text-right pr-6")}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center float">
                        <UserPlus className="h-6 w-6 text-slate-300" />
                      </div>
                      <p className="text-sm font-medium text-slate-400">
                        {searchQuery ? "No users match your search" : "No users yet — add your first one"}
                      </p>
                      {!searchQuery && (
                        <Button size="sm" className="btn-brand mt-1 h-8 px-4 text-xs"
                          onClick={()=>router.push("/dashboard/reseller/users/create")}>
                          <Plus className="h-3.5 w-3.5 mr-1" /> Add User
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((user, idx) => {
                const isConnected = user.whatsapp_mode === "connected" || user.status === "active"
                const remaining = user.wallet?.credits_remaining ?? 0
                const total     = user.wallet?.credits_allocated ?? 0
                return (
                  <TableRow key={user.busi_user_id}
                    className="tr-hover border-slate-50"
                    style={{animationDelay:`${idx*0.04}s`,animation:"fadeSlideUp .4s ease both"}}>
                    <TableCell className="py-4 pl-6">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{user.profile.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{user.profile.email}</p>
                        <p className="text-[10px] text-slate-300 mt-0.5 uppercase tracking-wide">
                          Joined: {(user as any).joined_at ? new Date((user as any).joined_at).toLocaleDateString("en-IN") : "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-slate-700">{user.business.business_name || "—"}</p>
                      <p className="text-xs text-slate-400 font-mono">{user.business.gstin || "—"}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm text-slate-700">{user.profile.phone || "—"}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className="inline-flex items-center gap-1 bg-[#F0FDF9] text-[#128C7E] border border-[#A7F3D0] rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase">
                        {(user as any).plan?.plan_name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-sm font-semibold text-slate-800">{remaining.toLocaleString()} <span className="font-normal text-slate-400">/ {total.toLocaleString()}</span></p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Remaining / Total</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                        isConnected
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-slate-50 text-slate-500 border border-slate-200"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", isConnected ? "bg-green-500 pulse-dot" : "bg-slate-300")} />
                        {isConnected ? "Active" : "Inactive"}
                      </span>
                    </TableCell>
                    <TableCell className="py-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={()=>router.push(`/dashboard/reseller/users/${user.busi_user_id}`)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#128C7E] hover:bg-[#F0FDF9] transition-colors" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button onClick={()=>router.push(`/dashboard/reseller/users/${user.busi_user_id}?edit=true`)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={()=>handleDelete(user.busi_user_id, user.profile.name)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-50 bg-slate-50/40 flex items-center justify-between">
          <p className="text-xs text-slate-400 font-medium">
            Showing {filtered.length} of {users.length} users
          </p>
        </div>
      </div>
    </div>
  )
}
