"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Loader2, Wallet, MessageSquare, Smartphone,
  Building2, ArrowRight, BarChart3, FileText,
  Users, Send, Zap, CheckCircle, CreditCard
} from "lucide-react"
import businessService, { BusinessProfile } from "@/services/businessService"
import { deviceService } from "@/services/deviceService"
import { useCredits } from "@/hooks/useCredits"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function useCountUp(target: number, ms = 900) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!target) { setVal(0); return }
    const start = performance.now()
    let raf: number
    const tick = (now: number) => {
      const p = Math.min((now - start) / ms, 1)
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return val
}

const quickActions = [
  { label:"Send Message",      icon:Send,        href:"/dashboard/user/message",                    color:"#128C7E", bg:"#F0FDF9" },
  { label:"Delivery Reports",  icon:BarChart3,   href:"/dashboard/user/reports/delivery-reports",   color:"#2563EB", bg:"#EFF6FF" },
  { label:"Devices",           icon:Smartphone,  href:"/dashboard/user/devices",                    color:"#D97706", bg:"#FFFBEB" },
  { label:"Google Sheets",     icon:FileText,    href:"/dashboard/user/google-sheet/messaging",     color:"#16A34A", bg:"#F0FDF4" },
]

export default function UserDashboard() {
  const router = useRouter()
  const [data, setData] = useState<BusinessProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connectedCount, setConnectedCount] = useState(0)
  const [activeDeviceName, setActiveDeviceName] = useState<string | null>(null)
  const [graphData, setGraphData] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<number>(0)
  
  // 🔥 FIX: Use centralized credit management for real-time sync
  const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null
  const { credits, refreshCredits } = useCredits(token)
  const creditsAnim = useCountUp(credits?.current_balance ?? 0)

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) { router.push("/login"); return }
      
      const profile = await businessService.getProfile(token)
      setData(profile)

      if (profile.busi_user_id) {
        const connected = await deviceService.getConnectedUnofficialDevices()
        setConnectedCount(connected.length)
        if (connected.length > 0) {
          setActiveDeviceName(connected[0].device_name)
        }

        // Load graph data
        const gData = await businessService.getDashboardGraphData()
        setGraphData(gData)
      }
    } catch (err: any) {
      setError("Failed to load dashboard.")
      if (err.response?.status === 401) router.push("/login")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDashboard()
    
    // 🔥 LIVE REFRESH: Poll for updates every 30 seconds to keep stats and graph fresh
    const interval = setInterval(loadDashboard, 30000)
    return () => clearInterval(interval)
  }, [router])

  // Listen for plan updates
  useEffect(() => {
    const handlePlanUpdate = () => {
      console.log('🔄 Plan update detected, refreshing dashboard...')
      setLastUpdate(Date.now())
      loadDashboard()
    }

    // Listen for custom plan update events
    window.addEventListener('plan-updated', handlePlanUpdate)
    
    // Also listen for storage changes (cross-tab sync)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'plan_updated' && e.newValue) {
        handlePlanUpdate()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('plan-updated', handlePlanUpdate)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [router])

  if (isLoading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center float">
          <MessageSquare className="w-5 h-5 text-white" />
        </div>
        <p className="text-sm text-slate-400 font-medium">Loading your dashboard…</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-3">
        <p className="text-red-500 text-sm">{error}</p>
        <button onClick={() => router.push("/login")} className="text-[#128C7E] underline text-sm">Return to Login</button>
      </div>
    </div>
  )

  const usedPct = credits?.credits_allocated
    ? Math.min(100, ((credits?.credits_used ?? 0) / credits.credits_allocated) * 100) : 0

  return (
    <div className="max-w-7xl mx-auto space-y-6 page-enter">

      {/* Hero banner */}
      <div className="rounded-2xl overflow-hidden relative" style={{
        background:"linear-gradient(135deg,#0e7468 0%,#128C7E 45%,#1aaa9a 75%,#25D366 100%)"
      }}>
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-white/5 rounded-full" />
        <div className="absolute -bottom-6 right-20 w-28 h-28 bg-white/5 rounded-full" />
        <div className="relative px-7 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-[11px] font-semibold text-white/60 bg-white/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {data?.role === "business_owner" ? "Business User" : data?.role}
            </span>
            <h1 className="text-2xl font-bold text-white mt-1 tracking-tight">{data?.business.business_name}</h1>
            <p className="text-white/55 text-sm mt-0.5">{data?.profile.name} · {data?.profile.email}</p>
          </div>
          <div className="flex items-center gap-6">

            <div className="text-right">
              <p className="text-[11px] text-white/50 uppercase tracking-wider font-semibold">ERP System</p>
              <p className="text-sm font-bold text-white">{data?.business.erp_system || "Not set"}</p>
            </div>
          </div>
        </div>
      </div>
      {/* Stats container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger">
        {/* Credits */}
        <div className="rounded-2xl p-5 border flex items-start justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{ background:"#F0FDF9", borderColor:"#A7F3D0" }}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:"#15803D",opacity:.65}}>Credits Remaining</p>
            <p className="text-3xl font-bold tracking-tight text-[#15803D] truncate">{creditsAnim.toLocaleString()}</p>
            <p className="text-xs mt-1.5 font-medium text-[#15803D]/60 whitespace-nowrap">of {(credits?.credits_allocated??0).toLocaleString()} allocated</p>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:"#DCFCE7"}}>
            <Wallet className="h-5 w-5 text-[#16A34A]" />
          </div>
        </div>

        {/* Messages & Devices Merged */}
        <div className="sm:col-span-2 rounded-2xl p-5 border flex items-center justify-around gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{background:"#EFF6FF",borderColor:"#BFDBFE"}}>
          
          {/* Messages Sent */}
          <div className="flex-1 flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:"#DBEAFE"}}>
              <Send className="h-5 w-5 text-[#2563EB]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{color:"#1D4ED8",opacity:.65}}>Messages Sent</p>
              <p className="text-2xl font-bold tracking-tight truncate" style={{color:"#1D4ED8"}}>{(credits?.credits_used??0).toLocaleString()}</p>
              <p className="text-[10px] font-medium" style={{color:"#1D4ED8",opacity:.55}}>Total consumed</p>
            </div>
          </div>

          <div className="w-px h-12 bg-blue-200 shrink-0 mx-2" />

          {/* Active Devices */}
          <div className="flex-1 flex items-start gap-4 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:"#F5F3FF"}}>
              <Smartphone className="h-5 w-5 text-[#7C3AED]" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{color:"#7C3AED",opacity:.65}}>Active Devices</p>
              <p className="text-2xl font-bold tracking-tight truncate" style={{color:"#7C3AED"}}>{connectedCount.toLocaleString()}</p>
              <p className="text-[10px] font-medium truncate" style={{color:"#7C3AED",opacity:.55}}>
                {connectedCount > 0 && activeDeviceName ? activeDeviceName : "Connected now"}
              </p>
            </div>
          </div>
        </div>

        {/* Account Status / Plan */}
        <div className="rounded-2xl p-5 border flex items-start justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
          style={{background:"#FFFBEB",borderColor:"#FDE68A"}}>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:"#B45309",opacity:.65}}>Account Status</p>
            <p className="text-2xl font-bold tracking-tight uppercase" style={{color:"#B45309"}}>{data?.status || "Active"}</p>
            <p className="text-xs mt-1.5 font-medium truncate" style={{color:"#B45309",opacity:.55}}>
              {credits?.plan_name || data?.plan_name || "Active Plan"} • {credits?.plan_expiry ? `Expires ${new Date(credits.plan_expiry).toLocaleDateString()}` : data?.plan_expiry ? `Expires ${new Date(data.plan_expiry).toLocaleDateString()}` : "No expiry"}
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{background:"#FEF3C7"}}>
            <CheckCircle className="h-5 w-5 text-[#D97706]" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <div className="section-divider">
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 px-2">Quick Actions</span>
        </div>
        <div className="flex flex-wrap justify-center gap-4 stagger">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="w-[calc(50%-8px)] sm:w-[calc(33.33%-11.5px)] lg:w-[180px]">
              <div className="quick-action group items-center text-center h-full">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto transition-transform duration-200 group-hover:scale-110"
                  style={{background:a.bg}}>
                  <a.icon className="h-5 w-5" style={{color:a.color}} />
                </div>
                <p className="text-[12px] font-semibold text-slate-700 leading-tight">{a.label}</p>
                <ArrowRight className="h-3.5 w-3.5 text-slate-300 mx-auto transition-transform duration-150 group-hover:translate-x-1 group-hover:text-slate-500" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Graph Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/40 p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Message Sending Performance</h3>
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Historical message analytics for the current year</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <span className="text-[10px] font-black text-slate-500 uppercase">Sent</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={graphData}>
              <defs>
                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '16px', 
                  border: 'none', 
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px'
                }}
                labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
              />
              <Area 
                type="monotone" 
                dataKey="sent" 
                stroke="#6366f1" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorSent)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Info + getting started */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-lift">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#F0FDF9]">
              <Building2 className="h-4 w-4 text-[#128C7E]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Business Details</h3>
          </div>
          <div className="space-y-0">
            {[
              {l:"Business Name",  v:data?.business.business_name||"—"},
              {l:"ERP System",     v:data?.business.erp_system||"Not connected"},
              {l:"GSTIN",          v:data?.business.gstin||"Not provided"},
            ].map(({l,v})=>(
              <div key={l} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                <span className="text-xs font-medium text-slate-400">{l}</span>
                <span className="text-sm font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 card-lift">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#EFF6FF]">
              <Zap className="h-4 w-4 text-[#2563EB]" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">Get Started</h3>
          </div>
          <div className="space-y-0">
            {[
              {step:"1",label:"Connect a WhatsApp device",   href:"/dashboard/user/devices",              done:true},
              {step:"2",label:"Send your first message",      href:"/dashboard/user/message",              done:false},
              {step:"3",label:"Connect Google Sheets",        href:"/dashboard/user/google-sheet/messaging",done:false},
            ].map(({step,label,href,done})=>(
              <Link key={step} href={href}>
                <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0 group cursor-pointer">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                    done?"bg-[#128C7E] text-white":"bg-slate-100 text-slate-500 group-hover:bg-[#F0FDF9] group-hover:text-[#128C7E]"
                  }`}>
                    {done ? <CheckCircle className="h-3.5 w-3.5" /> : step}
                  </div>
                  <span className={`text-sm flex-1 transition-colors ${done?"text-slate-400 line-through":"text-slate-700 font-medium group-hover:text-[#128C7E]"}`}>{label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#128C7E] transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
