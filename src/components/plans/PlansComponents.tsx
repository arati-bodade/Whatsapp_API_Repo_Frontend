"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle2, ChevronRight, Crown, Users, Wallet, Box, LayoutGrid, Table as TableIcon, Zap, Calendar, Shield, Star, ArrowRight, Trash2 } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useOrder } from "@/context/OrderContext"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

export interface Plan {
  plan_id?: string;
  id?: string;
  name: string;
  price: string;
  credits: string;
  rate: string;
  validity: string;
  isPopular?: boolean;
  colorTheme?: string;
  category?: "user" | "reseller";
  isDemo?: boolean;
}

export function PlansHeader() {
  return (
    <div className="page-header mb-8">
      <div className="page-header-icon">
        <Wallet className="h-5 w-5" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pricing Plans</h1>
        <p className="text-sm text-slate-500 mt-0.5">Choose the perfect plan for your messaging needs</p>
      </div>
    </div>
  )
}

/* ── Soft stat overview cards ── */
const overviewCards = [
  { label:"Total Plans",    key:"total",    bg:"#EFF6FF", border:"#BFDBFE", text:"#1D4ED8", iconBg:"#DBEAFE", icon:Box,    href:"/plans" },
  { label:"Reseller Plans", key:"reseller", bg:"#F5F3FF", border:"#DDD6FE", text:"#6D28D9", iconBg:"#EDE9FE", icon:Crown,  href:"/plans/reseller-plans" },
  { label:"User Plans",     key:"user",     bg:"#F0FDF4", border:"#BBF7D0", text:"#15803D", iconBg:"#DCFCE7", icon:Users,  href:"/plans/user-plans" },
  { label:"Avg Price",      key:"avg",      bg:"#FFFBEB", border:"#FDE68A", text:"#B45309", iconBg:"#FEF3C7", icon:Wallet, href:"/plans" },
]

export function PlansOverview() {
  const values: Record<string,string> = { total:"9", reseller:"3", user:"6", avg:"₹22,214" }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger">
      {overviewCards.map((c)=>{
        const Icon = c.icon
        return (
          <Link key={c.key} href={c.href}>
            <div className="rounded-2xl p-5 border flex items-start justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
              style={{background:c.bg, borderColor:c.border}}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:c.text,opacity:.65}}>{c.label}</p>
                <p className="text-2xl font-bold tracking-tight" style={{color:c.text}}>{values[c.key]}</p>
              </div>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:c.iconBg}}>
                <Icon className="h-5 w-5" style={{color:c.text}} />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ── Plan list header with view toggle ── */
interface PlansListHeaderProps { view:"card"|"table"; setView:(v:"card"|"table")=>void; total:number }
export function PlansListHeader({ view, setView, total }: PlansListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5">
        <div className="page-header-icon w-8 h-8">
          <LayoutGrid className="h-4 w-4" />
        </div>
        <h2 className="text-sm font-semibold text-slate-800">
          All Plans
          <span className="ml-2 text-xs text-slate-400 font-normal bg-slate-100 px-2 py-0.5 rounded-full">{total} found</span>
        </h2>
      </div>
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
        {(["card","table"] as const).map((v)=>(
          <button key={v} onClick={()=>setView(v)}
            className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
              view===v ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}>
            {v==="card" ? <LayoutGrid className="h-3.5 w-3.5" /> : <TableIcon className="h-3.5 w-3.5" />}
            {v==="card" ? "Card View" : "Table View"}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Plan table row ── */
interface PlanTableProps { 
  plans: any[]; 
  onPurchase?: (plan: any) => void;
  onEdit?: (plan: any) => void;
  onDelete?: (id: string) => void;
  hidePurchase?: boolean;
}
export function PlanTable({ plans, onPurchase, onEdit, onDelete, hidePurchase }: PlanTableProps) {
  const { addOrder } = useOrder()
  const router = useRouter()
  
  const handleSelect = (plan: any) => {
    if (onPurchase) {
      onPurchase(plan)
      return
    }
    addOrder({ 
      planName: plan.name, 
      price: plan.price.toString(),
      credits: plan.credits.toString(),
      validity: plan.validity 
    })
    router.push(`/plans/checkout?planName=${encodeURIComponent(plan.name)}`)
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50/80 hover:bg-slate-50/80">
            {["Plan Name","Type","Price","Credits","Rate","Validity","Action"].map((h,i)=>(
              <TableHead key={h} className={cn("py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
                i===0&&"pl-6", i===6&&"text-right pr-6")}>{h}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan,i)=>(
            <TableRow key={i} className="tr-hover border-slate-50">
              <TableCell className="py-4 pl-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">{plan.name}</span>
                  {plan.isPopular && (
                    <span className="bg-[#F0FDF9] text-[#128C7E] border border-[#A7F3D0] text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Popular</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className={cn("text-[11px] font-semibold rounded-full px-2.5 py-0.5",
                  (plan.category==="reseller" || plan.colorTheme === 'purple')
                    ? "bg-purple-50 text-purple-700 border border-purple-200"
                    : "bg-green-50 text-green-700 border border-green-200")}>
                  {(plan.category==="reseller" || plan.colorTheme === 'purple') ?"Reseller":"User"}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm font-semibold text-slate-800">
                  {plan.price.startsWith('₹') ? plan.price : `₹${plan.price}`}
                </span>
              </TableCell>
              <TableCell className="text-sm text-slate-600 font-medium">{plan.credits}</TableCell>
              <TableCell className="text-sm text-slate-500">{plan.rate}</TableCell>
              <TableCell className="text-sm text-slate-500">{plan.validity}</TableCell>
              <TableCell className="pr-6 text-right">
                <div className="flex items-center justify-end gap-2">
                  {onEdit && (
                    <Button variant="ghost" size="sm" className="h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50" onClick={() => onEdit(plan)}>
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button variant="ghost" size="sm" className="h-8 text-red-600 hover:text-red-800 hover:bg-red-50" onClick={() => onDelete(plan.plan_id || plan.id)}>
                      Delete
                    </Button>
                  )}
                  {plan.isDemo ? (
                    <span className="text-xs text-slate-400 font-medium">Demo</span>
                  ) : !hidePurchase && (
                    <button onClick={()=>handleSelect(plan)}
                      className="h-8 px-4 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-px"
                      style={{background:"#128C7E",boxShadow:"0 2px 8px rgba(18,140,126,.25)"}}>
                      Select
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/* ── Plan section wrapper with table ── */
interface PlanSectionProps { 
  title:string; 
  icon:React.ReactNode; 
  plans:any[]; 
  hideToggle?: boolean;
  onPurchase?: (plan: any) => void;
  onEdit?: (plan: any) => void;
  onDelete?: (id: string) => void;
  hidePurchase?: boolean;
}
export function PlanSection({ title, icon, plans, hideToggle, onPurchase, onEdit, onDelete, hidePurchase }: PlanSectionProps) {
  const [view, setView] = useState<"card"|"table">("card")
  return (
    <div className="mb-10 animate-in fade-in slide-in-from-bottom-5 duration-700">
      <PlansListHeader view={view} setView={setView} total={plans.length} />
      {view === "table" ? (
        <PlanTable 
          plans={plans} 
          onPurchase={onPurchase} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          hidePurchase={hidePurchase}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {plans.map((p,i) => {
            const isReseller = p.category === "reseller" || p.colorTheme === 'purple';
            const themeColor = isReseller ? "#8B5CF6" : "#10B981"; // Purple or Emerald
            
            return (
              <Card key={i} className="group relative border-slate-100/60 hover:border-transparent transition-all duration-500 hover:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] rounded-[3rem] overflow-hidden bg-white dark:bg-slate-900 border-2 active:scale-[0.98]">
                 {/* Top Accent Bar with gradient */}
                <div 
                    className="h-2.5 w-full opacity-80" 
                    style={{ 
                        background: `linear-gradient(to right, ${themeColor}, ${isReseller ? '#6366f1' : '#059669'})` 
                    }}
                ></div>
                
                {p.isPopular && (
                  <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10">
                    <div className="bg-slate-900 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 shadow-2xl">
                      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> Executive Choice
                    </div>
                  </div>
                )}

                <CardContent className="p-10 flex flex-col items-center text-center">
                  {/* Premium Icon Header */}
                  <div className="mb-8 p-6 rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 shadow-inner">
                    {isReseller ? (
                        <Crown className="w-12 h-12" style={{ color: themeColor }} />
                    ) : (
                        <Users className="w-12 h-12" style={{ color: themeColor }} />
                    )}
                  </div>

                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-2">{p.name}</h3>
                  <div className="flex flex-col items-center mb-8">
                    <div className="flex items-baseline gap-1">
                       <span className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
                        {p.price.startsWith('₹') ? p.price : `₹${p.price}`}
                      </span>
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 opacity-60">Professional License</span>
                  </div>
                  
                  <div className="w-full h-px bg-slate-100 dark:bg-slate-800 mb-8 border-dashed"></div>

                  <div className="space-y-6 mb-12 w-full">
                    {[
                      { icon: Shield, text: `${p.credits} Base Credits`, color: themeColor },
                      { icon: Zap, text: `${p.rate} Processing Rate`, color: themeColor },
                      { icon: Calendar, text: `Validity: ${p.validity}`, color: themeColor },
                      { icon: CheckCircle2, text: "Priority Support Access", color: "#10B981" }
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-5 text-[13px] font-bold text-slate-600 dark:text-slate-400">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-slate-50 dark:bg-slate-800 shadow-sm transition-colors group-hover:bg-white" style={{ color: item.color }}>
                           <item.icon className="w-4 h-4" />
                        </div>
                        <span className="tracking-tight">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  {!hidePurchase && (
                    <Button 
                      onClick={() => onPurchase ? onPurchase(p) : window.location.href = `/plans/checkout?planName=${encodeURIComponent(p.name)}`}
                      className="w-full h-16 text-white font-black rounded-2xl shadow-2xl transition-all group/btn uppercase tracking-[0.2em] text-[11px] border-none active:scale-[0.98] cursor-pointer"
                      style={{ 
                          background: `linear-gradient(135deg, ${themeColor}, ${isReseller ? '#4f46e5' : '#059669'})`,
                          boxShadow: `0 20px 40px ${themeColor}44`
                      }}
                    >
                      Select Plan
                      <ArrowRight className="w-4 h-4 ml-3 group-hover/btn:translate-x-2 transition-transform" />
                    </Button>
                  )}

                  {/* Standard Admin Actions with cleaner look */}
                  {(onEdit || onDelete) && (
                    <div className="flex items-center gap-6 mt-8 pt-8 border-t border-slate-50 w-full justify-center">
                        {onEdit && (
                            <button 
                                onClick={() => onEdit(p)} 
                                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                            >
                                <LayoutGrid className="w-3.5 h-3.5" /> Edit
                            </button>
                        )}
                        {onDelete && (
                            <button 
                                onClick={() => onDelete(p.plan_id || p.id)} 
                                className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-600 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                        )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
