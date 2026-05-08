"use client"

import { CreditCard, MessageSquare, TrendingUp, Wallet } from "lucide-react"

interface CreditData {
  current_balance: number
  credits_used: number
  credits_allocated: number
  plan_name?: string
  plan_expiry?: string
}

interface StatsCardsProps {
  credits?: CreditData | null
}

export function StatsCards({ credits }: StatsCardsProps) {
  const cards = [
      {
          label: "Total Credits",
          value: (credits?.credits_allocated || 0).toLocaleString(),
          sublabel: "Lifetime allocation",
          icon: CreditCard,
          bg: "#EFF6FF",
          iconBg: "#DBEAFE",
          iconColor: "#2563EB",
          textColor: "#1D4ED8",
          borderColor: "#BFDBFE",
      },
      {
          label: "Used Credits",
          value: (credits?.credits_used || 0).toLocaleString(),
          sublabel: "Messages sent",
          icon: MessageSquare,
          bg: "#F5F3FF",
          iconBg: "#EDE9FE",
          iconColor: "#7C3AED",
          textColor: "#6D28D9",
          borderColor: "#DDD6FE",
      },
      {
          label: "Remaining Credits",
          value: (credits?.current_balance || 0).toLocaleString(),
          sublabel: "Ready to use",
          icon: TrendingUp,
          bg: "#F0FDF4",
          iconBg: "#DCFCE7",
          iconColor: "#16A34A",
          textColor: "#15803D",
          borderColor: "#BBF7D0",
      },
      {
          label: "Wallet Balance",
          value: (credits?.current_balance || 0).toLocaleString(),
          sublabel: "Current balance",
          icon: Wallet,
          bg: "#FFFBEB",
          iconBg: "#FEF3C7",
          iconColor: "#D97706",
          textColor: "#B45309",
          borderColor: "#FDE68A",
      },
  ]

  return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
          {cards.map((card, i) => {
              const Icon = card.icon
              return (
                  <div
                      key={i}
                      className="rounded-2xl p-5 flex items-start justify-between gap-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                      style={{
                          background: card.bg,
                          borderColor: card.borderColor,
                      }}
                  >
                      <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: card.textColor, opacity: 0.7 }}>
                              {card.label}
                          </p>
                          <p className="text-2xl font-bold tracking-tight mt-1.5 leading-none" style={{ color: card.textColor }}>
                              {card.value}
                          </p>
                          <p className="text-xs mt-1.5 font-medium" style={{ color: card.textColor, opacity: 0.6 }}>
                              {card.sublabel}
                          </p>
                      </div>
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.iconBg }}>
                          <Icon className="h-5 w-5" style={{ color: card.iconColor }} />
                      </div>
                  </div>
              )
          })}
      </div>
  )
}
