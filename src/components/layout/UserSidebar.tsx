"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutGrid, Plug, MessageSquare, Layout, FileSpreadsheet,
    Users, MessageCircleReply, FileText, ChevronDown,
    X, LogOut, CreditCard, ShieldCheck, Code, ChevronRight, MessageCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/context/AuthContext"

interface SubMenuItem {
    label: string
    href: string
}

interface NavItem {
    label: string
    icon: any
    href: string
    color: string
    hasSubmenu?: boolean
    submenu?: SubMenuItem[]
    external?: boolean
}

interface NavGroup {
    label: string
    items: NavItem[]
}

const navGroups: NavGroup[] = [
    {
        label: "Overview",
        items: [
            { label: "Home",       icon: LayoutGrid,        href: "/dashboard/user",             color: "text-teal-500" },
            { label: "My Plan",    icon: ShieldCheck,       href: "/dashboard/user/plans",       color: "text-teal-400" },
            { label: "Credits",    icon: CreditCard,         href: "/dashboard/user/credits",      color: "text-slate-400" },
            { label: "Devices",    icon: Plug,               href: "/dashboard/user/devices",      color: "text-slate-400" },
        ]
    },
    {
        label: "Messaging",
        items: [
            { label: "Message",    icon: MessageSquare, href: "#", color: "text-slate-400", hasSubmenu: true,
              submenu: [
                  { label: "Send Message",    href: "/dashboard/user/message" },
                  { label: "Send Bulk Message", href: "/dashboard/user/bulk-messaging" },
              ]},
        ]
    },
    {
        label: "Integrations",
        items: [
            { label: "Google Sheet", icon: FileSpreadsheet, href: "#", color: "text-slate-400", hasSubmenu: true,
              submenu: [
                  { label: "Messaging", href: "/dashboard/user/google-sheet/messaging" },
                  { label: "Trigger",   href: "/dashboard/user/google-sheet/trigger" },
                  { label: "WhatsApp Group Extract", href: "/dashboard/user/google-sheet/group-extract" },
              ]},
        ]
    },
    {
        label: "Reports & Dev",
        items: [
            { label: "Reports", icon: FileText, href: "#", color: "text-slate-400", hasSubmenu: true,
              submenu: [
                  { label: "Delivery Reports", href: "/dashboard/user/reports/delivery-reports" },
                  { label: "Schedule Reports", href: "/dashboard/user/reports/schedule-reports" },
              ]},
            { label: "API", icon: Code, href: "https://www.postman.com/jaypaltupare9421-3865923/whatsapp-business-api-2026/collection/29528975-e135b2258c2c?action=share&source=copy-link&creator=47786759", color: "text-slate-400", external: true },
        ]
    },
]

interface SidebarProps {
    collapsed: boolean
    toggleSidebar: () => void
}

export function UserSidebar({ collapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname()
    const { logout, user: authUser } = useAuth()
    const [openSubmenu, setOpenSubmenu] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>("User")
    const [userEmail, setUserEmail] = useState<string | null>(null)

    useEffect(() => {
        if (authUser) {
            setUserId(authUser.id)
            setUserName(authUser.name || "Guest")
            setUserEmail(authUser.email)
        }
    }, [authUser])
    
    const handleSignOut = () => logout()

    const toggleSubmenu = (label: string) => {
        if (collapsed) return
        setOpenSubmenu(openSubmenu === label ? null : label)
    }

    return (
        <aside className={cn(
            "fixed left-0 top-0 h-screen bg-slate-900 flex flex-col transition-all duration-300 z-20",
            "shadow-[2px_0_16px_rgba(0,0,0,0.12)]",
            collapsed ? "w-16" : "w-64"
        )}>

            {/* ── Logo ── */}
            <div className={cn(
                "flex items-center border-b border-slate-800 h-[65px] shrink-0",
                collapsed ? "justify-center px-2" : "px-5 gap-2.5 justify-between"
            )}>
                {!collapsed && (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center shrink-0 shadow-sm">
                                <MessageCircle className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-[15px] text-white truncate leading-tight">Message API</p>
                                <p className="text-[10px] text-teal-400 font-semibold tracking-wide leading-tight">WhatsApp Platform</p>
                            </div>
                        </div>
                        <button onClick={toggleSidebar} className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-500 transition-colors shrink-0">
                            <X className="h-4 w-4" />
                        </button>
                    </>
                )}
                {collapsed && (
                    <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center shadow-sm">
                        <MessageCircle className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>

            {collapsed && (
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-[76px] bg-slate-800 border border-slate-700 shadow-sm rounded-full p-1 text-slate-400 hover:text-white transition-colors z-10"
                >
                    <ChevronRight className="h-3 w-3" />
                </button>
            )}

            {/* ── Nav ── */}
            <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 px-3 mb-1.5">
                                {group.label}
                            </p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || (item.submenu?.some((s: SubMenuItem) => pathname.startsWith(s.href.split("?")[0])))
                                const isOpen = openSubmenu === item.label

                                return (
                                    <div key={item.label}>
                                        <div
                                            onClick={() => item.hasSubmenu ? toggleSubmenu(item.label) : undefined}
                                            className={cn(
                                                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group cursor-pointer",
                                                isActive
                                                    ? "bg-[#128C7E]/20 text-teal-300"
                                                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200",
                                                collapsed && "justify-center px-0"
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            {item.hasSubmenu ? (
                                                <>
                                                    <item.icon className={cn(
                                                        "h-[18px] w-[18px] shrink-0 transition-colors",
                                                        isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                                                    )} />
                                                    {!collapsed && (
                                                        <>
                                                            <span className={cn("text-[13.5px] flex-1", isActive ? "text-teal-200 font-semibold" : "text-slate-400 group-hover:text-slate-200")}>
                                                                {item.label}
                                                            </span>
                                                            <ChevronDown className={cn(
                                                                "h-3.5 w-3.5 text-slate-600 transition-transform duration-200",
                                                                isOpen && "rotate-180"
                                                            )} />
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <Link
                                                    href={item.href}
                                                    target={(item as any).external ? "_blank" : undefined}
                                                    rel={(item as any).external ? "noopener noreferrer" : undefined}
                                                    className="flex items-center gap-3 w-full"
                                                >
                                                    <item.icon className={cn(
                                                        "h-[18px] w-[18px] shrink-0 transition-colors",
                                                        isActive ? "text-teal-400" : "text-slate-500 group-hover:text-slate-300"
                                                    )} />
                                                    {!collapsed && (
                                                        <span className={cn("text-[13.5px]", isActive ? "text-teal-200 font-semibold" : "text-slate-400 group-hover:text-slate-200")}>
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </Link>
                                            )}
                                        </div>

                                        {/* Submenu */}
                                        {!collapsed && item.hasSubmenu && isOpen && item.submenu && (
                                            <div className="ml-9 mt-1 mb-1 space-y-0.5">
                                                {item.submenu.map((sub: SubMenuItem) => (
                                                    <Link
                                                        key={sub.href}
                                                        href={sub.href}
                                                        className={cn(
                                                            "block py-2 px-3 rounded-lg text-[13px] transition-colors",
                                                            pathname.startsWith(sub.href.split("?")[0])
                                                                ? "text-teal-300 bg-[#128C7E]/10 font-semibold"
                                                                : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
                                                        )}
                                                    >
                                                        {sub.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── User footer ── */}
            <div className="border-t border-slate-800 p-3 space-y-1 shrink-0">
                {!collapsed ? (
                    <>
                        <Link href="/dashboard/user/profile"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-800/60 transition-colors group">
                            <div className="h-8 w-8 rounded-xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center text-xs font-bold text-white shrink-0">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-300 truncate leading-tight">{userName}</p>
                                <p className="text-[11px] text-slate-500 truncate leading-tight">
                                    {userEmail || "guest@example.com"}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors font-medium"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-1">
                        <Link href="/dashboard/user/profile" title="Profile">
                            <div className="h-8 w-8 rounded-xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:opacity-80 transition-opacity">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            title="Sign Out"
                            className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </aside>
    )
}
