"use client"

import React, { useEffect, useRef, useState } from "react"
import { DollarSign, BarChart3, PieChart, Wallet } from "lucide-react"

interface DashboardCardsProps {
    data: {
        total_credits: number
        used_credits: number
        remaining_credits: number
        wallet_balance: number
        messages_sent: number
    } | null
    loading: boolean
}

function useCountUp(target: number, duration = 800) {
    const [count, setCount] = useState(0)
    const frameRef = useRef<number | null>(null)

    useEffect(() => {
        if (target === 0) { setCount(0); return }
        const start = performance.now()
        const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) frameRef.current = requestAnimationFrame(animate)
        }
        frameRef.current = requestAnimationFrame(animate)
        return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) }
    }, [target, duration])

    return count
}

const cards = [
    {
        key: "total_credits" as const,
        label: "Total Credits",
        sublabel: "Lifetime accumulation",
        icon: DollarSign,
        bg: "#EFF6FF",
        iconBg: "#DBEAFE",
        iconColor: "#2563EB",
        textColor: "#1D4ED8",
        borderColor: "#BFDBFE",
    },
    {
        key: "used_credits" as const,
        label: "Used Credits",
        sublabel: "Consumed by businesses",
        icon: BarChart3,
        bg: "#F5F3FF",
        iconBg: "#EDE9FE",
        iconColor: "#7C3AED",
        textColor: "#6D28D9",
        borderColor: "#DDD6FE",
    },
    {
        key: "wallet_balance" as const,
        label: "Total Balance",
        sublabel: "Current wallet value",
        icon: Wallet,
        bg: "#FFFBEB",
        iconBg: "#FEF3C7",
        iconColor: "#D97706",
        textColor: "#B45309",
        borderColor: "#FDE68A",
    },
    {
        key: "remaining_credits" as const,
        label: "Remaining Credits",
        sublabel: "Available for allocation",
        icon: PieChart,
        bg: "#F0FDF4",
        iconBg: "#DCFCE7",
        iconColor: "#16A34A",
        textColor: "#15803D",
        borderColor: "#BBF7D0",
    },
]

function StatCard({ card, value, delay }: { card: typeof cards[0]; delay: number; value: number }) {
    const animated = useCountUp(value, 700)
    const Icon = card.icon

    return (
        <div
            className="rounded-2xl p-5 flex items-start justify-between gap-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
            style={{
                background: card.bg,
                borderColor: card.borderColor,
                animation: `slideUp 0.4s ease ${delay}s both`,
            }}
        >
            <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: card.textColor, opacity: 0.7 }}>
                    {card.label}
                </p>
                <p className="text-2xl font-bold tracking-tight mt-1.5 leading-none" style={{ color: card.textColor }}>
                    {animated.toLocaleString()}
                </p>
                <p className="text-xs mt-1.5 font-medium" style={{ color: card.textColor, opacity: 0.6 }}>
                    {card.sublabel}
                </p>
            </div>
            <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: card.iconBg }}
            >
                <Icon className="h-5 w-5" style={{ color: card.iconColor }} />
            </div>
        </div>
    )
}

export default function DashboardCards({ data, loading }: DashboardCardsProps) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-2xl p-5 border border-slate-100 bg-white">
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-2">
                                <div className="skeleton h-3 w-28" />
                                <div className="skeleton h-7 w-20 mt-2" />
                                <div className="skeleton h-3 w-24" />
                            </div>
                            <div className="skeleton w-11 h-11 rounded-xl" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (!data) return null

    console.log('=== DASHBOARD CARDS DEBUG ===');
    console.log('Data received:', data);
    console.log('total_credits:', data.total_credits);
    console.log('used_credits:', data.used_credits);
    console.log('remaining_credits:', data.remaining_credits);

    const values: Record<string, number> = {
        total_credits: data.total_credits,
        used_credits: data.used_credits,
        wallet_balance: data.wallet_balance,
        remaining_credits: data.remaining_credits,
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 stagger-children">
            {cards.map((card, i) => (
                <StatCard key={card.key} card={card} value={values[card.key]} delay={i * 0.05} />
            ))}
        </div>
    )
}
