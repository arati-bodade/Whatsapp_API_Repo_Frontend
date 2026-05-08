"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutGrid, Users, CreditCard, ShoppingCart,
    Code, History, LogOut, ChevronRight, X,
    MessageSquare, ShieldCheck, User
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"

const adminNavGroups = [
    {
        label: "Core",
        items: [
            { icon: LayoutGrid,   label: "Dashboard",        href: "/dashboard/admin",       color: "text-indigo-600" },
            { icon: User,         label: "Profile",          href: "/dashboard/admin/profile", color: "text-slate-500" },
            { icon: Users,        label: "Users",            href: "/dashboard/admin/users",  color: "text-slate-500" },
        ]
    },
    {
        label: "Management",
        items: [
            { icon: CreditCard,   label: "Plans",            href: "/dashboard/admin/plans",  color: "text-slate-500" },
            { icon: ShoppingCart, label: "Orders",           href: "/dashboard/admin/orders", color: "text-slate-500" },
            { icon: History,      label: "Activity History", href: "/dashboard/admin/history", color: "text-slate-500" },
        ]
    }
]

interface AdminSidebarProps {
    collapsed: boolean
    toggleSidebar: () => void
}

export function AdminSidebar({ collapsed, toggleSidebar }: AdminSidebarProps) {
    const pathname = usePathname()
    const { logout, user: authUser } = useAuth()
    const [userName, setUserName] = useState<string>("Admin")
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        if (authUser) {
            setUserName(authUser.name || "Admin")
            setUserEmail(authUser.email)
        }
    }, [authUser])

    const handleSignOut = () => {
        logout()
    }

    return (
        <div className={cn(
            "h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0",
            "transition-all duration-300 ease-in-out z-20 shadow-2xl border-r border-slate-800",
            collapsed ? "w-16" : "w-64"
        )}>

            {/* Logo Section */}
            <div className={cn(
                "flex items-center border-b border-slate-800 h-[65px] shrink-0",
                collapsed ? "justify-center px-2" : "px-5 gap-3 justify-between"
            )}>
                {!collapsed && (
                    <>
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
                                <ShieldCheck className="w-5 h-5 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-[15px] text-white truncate leading-tight tracking-tight">Admin OS</p>
                                <p className="text-[10px] text-indigo-400 font-bold tracking-widest leading-tight uppercase">Infrastructure</p>
                            </div>
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-colors shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                )}

                {collapsed && (
                    <div className="w-9 h-9 rounded-xl bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                )}
            </div>

            {/* Nav Links */}
            <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-8 scrollbar-hide">
                {adminNavGroups.map((group) => (
                    <div key={group.label} className="space-y-2">
                        {!collapsed && (
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] px-3 mb-3">{group.label}</p>
                        )}
                        <div className="space-y-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                                : "text-slate-400 hover:bg-slate-800 hover:text-slate-100",
                                            collapsed && "justify-center px-0"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-[18px] w-[18px] shrink-0 transition-transform group-hover:scale-110",
                                            isActive ? "text-white" : "text-slate-500 group-hover:text-indigo-400"
                                        )} />
                                        {!collapsed && (
                                            <span className="font-semibold tracking-wide">{item.label}</span>
                                        )}
                                        {isActive && !collapsed && (
                                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Bottom Section */}
            <div className="p-4 border-t border-slate-800 space-y-4">
                {!collapsed ? (
                    <div className="bg-slate-800/50 rounded-2xl p-3 space-y-3">
                        <div className="flex items-center gap-3">
                            <Link href="/dashboard/admin/profile" title="Profile">
                            <Avatar className="h-10 w-10 border-2 border-indigo-500/30 cursor-pointer hover:opacity-80 transition-opacity">
                                <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                    {userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-white truncate">{userName}</p>
                                <p className="text-[10px] text-slate-400 truncate leading-tight">
                                    {userEmail || "admin@example.com"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-700/50 text-red-400 hover:bg-red-500 hover:text-white transition-all text-xs font-bold border border-slate-700 hover:border-red-400 group"
                        >
                            <LogOut className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-indigo-500/30">
                            <AvatarFallback className="bg-indigo-600 text-white font-bold">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <button
                            onClick={handleSignOut}
                            className="p-3 rounded-xl bg-slate-800/50 text-red-400 hover:bg-red-500 hover:text-white transition-all border border-slate-700"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* Collapse toggle handle */}
            {collapsed && (
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-20 bg-slate-900 border border-slate-700 text-slate-500 hover:text-white p-1 rounded-full shadow-xl z-20"
                >
                    <ChevronRight className="w-3 h-3" />
                </button>
            )}
        </div>
    )
}
