"use client"

import Link from "next/link"
import { CheckCircle2, Crown, ArrowRight, Star, Zap, Wallet, Calendar, Shield } from "lucide-react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface Plan {
  id:string; name:string; price:string; type:string
  credits:string; rate:string; wallet:string; validity:string
  support:string; popular:boolean; isDemo?:boolean
  category:"reseller"|"user"; icon?:LucideIcon
}

export function PlanCard({ plan, onPurchase }: { plan:Plan, onPurchase?: (plan: Plan) => void }) {
  const isGreen    = plan.category === "user"
  const accentColor = plan.popular ? "#128C7E" : isGreen ? "#16A34A" : "#6D28D9"
  const iconBg      = plan.popular ? "#F0FDF9"  : isGreen ? "#F0FDF4"  : "#F5F3FF"

  const handleAction = (e: React.MouseEvent) => {
    if (onPurchase) {
      e.preventDefault();
      onPurchase(plan);
    }
  }

  return (
    <div className="relative group h-full">
      {plan.popular && (
        <div className="absolute -top-4 inset-x-0 z-20 flex justify-center">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white px-4 py-1.5 rounded-full shadow-lg"
            style={{background:"linear-gradient(135deg,#128C7E,#25D366)",boxShadow:"0 4px 16px rgba(18,140,126,.35)"}}>
            <Star className="h-3 w-3 fill-current" /> Most Popular
          </span>
        </div>
      )}

      <div className={cn(
        "flex flex-col h-full bg-white rounded-2xl border transition-all duration-250 overflow-hidden",
        "plan-card-hover",
        plan.popular ? "plan-card-popular border-2" : "border-slate-100 hover:border-slate-200"
      )}>
        {/* Top accent bar */}
        <div className="h-1 w-full rounded-t-2xl"
          style={{background: plan.popular
            ? "linear-gradient(90deg,#128C7E,#25D366)"
            : isGreen ? "#16A34A" : "#8B5CF6"}} />

        {/* Header */}
        <div className="text-center px-8 pt-8 pb-5">
          <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:rotate-3"
            style={{background:iconBg}}>
            {plan.icon
              ? <plan.icon className="h-8 w-8 text-yellow-500" />
              : <Crown className="h-8 w-8" style={{color:accentColor}} />
            }
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">{plan.name}</h3>
          <div className="flex items-end justify-center gap-0.5 mt-3">
            <span className="text-base font-semibold text-slate-400 mb-1">₹</span>
            <span className="text-4xl font-bold text-slate-900 leading-none">{plan.price}</span>
          </div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mt-1.5">{plan.type}</p>
        </div>

        {/* Divider */}
        <div className="mx-6 h-px bg-slate-100" />

        {/* Features */}
        <div className="flex-1 px-8 py-6 space-y-3.5">
          {[
            { label:plan.credits,          icon:Zap       },
            { label:plan.rate,             icon:CheckCircle2 },
            { label:`Wallet: ${plan.wallet}`,   icon:Wallet    },
            { label:`Validity: ${plan.validity}`, icon:Calendar  },
            { label:plan.support,          icon:Shield    },
          ].map(({ label, icon:Icon }, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-600">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border"
                style={{background:iconBg, borderColor:`${accentColor}22`}}>
                <Icon className="h-3.5 w-3.5" style={{color:accentColor}} />
              </div>
              {label}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="px-8 pb-8">
          {plan.isDemo ? (
            <div className="w-full h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Demo Plan
            </div>
          ) : (
            onPurchase ? (
              <button 
                onClick={handleAction}
                className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-px group"
                style={{
                  background: plan.popular
                    ? "linear-gradient(135deg,#128C7E,#25D366)"
                    : isGreen ? "#16A34A" : "#7C3AED",
                  boxShadow: plan.popular
                    ? "0 4px 16px rgba(18,140,126,.30)"
                    : isGreen
                    ? "0 4px 16px rgba(22,163,74,.25)"
                    : "0 4px 16px rgba(124,58,237,.25)"
                }}>
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </button>
            ) : (
              <Link href={`/plans/checkout?planName=${encodeURIComponent(plan.name)}`}>
                <button className="w-full h-12 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:-translate-y-px group"
                  style={{
                    background: plan.popular
                      ? "linear-gradient(135deg,#128C7E,#25D366)"
                      : isGreen ? "#16A34A" : "#7C3AED",
                    boxShadow: plan.popular
                      ? "0 4px 16px rgba(18,140,126,.30)"
                      : isGreen
                      ? "0 4px 16px rgba(22,163,74,.25)"
                      : "0 4px 16px rgba(124,58,237,.25)"
                  }}>
                  Get Started
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                </button>
              </Link>
            )
          )}
        </div>
      </div>
    </div>
  )
}
