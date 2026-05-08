import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import {
    LayoutGrid, User, Code, ShoppingCart,
    CreditCard, Users, History, LogOut,
    ChevronRight, X, MessageSquare, UserPlus
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/context/AuthContext"

const resellerNavGroups = (role?: string | null) => [
    {
        label: "Overview",
        items: [
            { icon: LayoutGrid,   label: "Dashboard",        href: "/dashboard/reseller/analytics", color: "text-teal-600" },
            { icon: User,         label: "Profile",           href: "/dashboard/reseller/profile",   color: "text-slate-500" },
        ]
    },
    {
        label: "Management",
        items: [
            { icon: Users,        label: "Sub-Users",         href: "/dashboard/reseller/users",     color: "text-slate-500" },
            ...(role === "admin" ? [{ icon: UserPlus, label: "Direct Users", href: "/dashboard/reseller/direct-users", color: "text-indigo-500" }] : []),
            { icon: CreditCard,   label: "Plans",             href: "/dashboard/reseller/plans",     color: "text-slate-500" },
            { icon: ShoppingCart, label: "My Orders",         href: "/dashboard/reseller/orders",    color: "text-slate-500" },
        ]
    },
    {
        label: "Tools",
        items: [
            { icon: History,      label: "Activity History",  href: "/dashboard/reseller/history",   color: "text-slate-500" },
            { icon: Code,         label: "API",               href: "https://www.postman.com/jaypaltupare9421-3865923/whatsapp-reseller-api-2026/collection/5vzozu7/whatsapp-platform-api?action=share&creator=47786759", color: "text-slate-500", external: true },
        ]
    },
]

const directUserNavGroups = [
    {
        label: "Main",
        items: [
            { icon: LayoutGrid,   label: "Dashboard",        href: "/dashboard/user",             color: "text-teal-600" },
            { icon: CreditCard,   label: "My Credits",       href: "/dashboard/user/credits",     color: "text-slate-500" },
            { icon: User,         label: "Profile",          href: "/dashboard/user/profile",     color: "text-slate-500" },
        ]
    },
    {
        label: "Communication",
        items: [
            { icon: MessageSquare, label: "Campaigns",        href: "/dashboard/user/bulk-messaging", color: "text-slate-500" },
            { icon: History,      label: "Message History",   href: "/dashboard/user/reports/delivery-reports", color: "text-slate-500" },
            { icon: LayoutGrid,   label: "Devices",           href: "/dashboard/user/devices",     color: "text-slate-500" },
        ]
    }
]

interface SidebarProps {
    collapsed: boolean
    toggleSidebar: () => void
}

export function Sidebar({ collapsed, toggleSidebar }: SidebarProps) {
    const pathname = usePathname()
    const { logout, user: authUser, role: authRole } = useAuth()
    const [userId, setUserId] = useState<string | null>(null)
    const [userName, setUserName] = useState<string>("User")
    const [userEmail, setUserEmail] = useState<string | null>(null)
    const [role, setRole] = useState<string | null>(null)

    useEffect(() => {
        if (authUser) {
            setUserId(authUser.id)
            setUserName(authUser.name || "Guest")
            setUserEmail(authUser.email)
            setRole(authRole)
        }
    }, [authUser, authRole])

    const navGroups = (role === "reseller" || role === "admin") ? resellerNavGroups(role) : directUserNavGroups

    const handleSignOut = () => logout()

    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2) || "U"

    return (
        <div className={cn(
            "h-screen bg-white border-r border-slate-100 flex flex-col fixed left-0 top-0",
            "transition-all duration-300 ease-in-out z-20 shadow-[1px_0_12px_rgba(0,0,0,0.04)]",
            collapsed ? "w-16" : "w-64"
        )}>

            {/* ── Logo ── */}
            <div className={cn(
                "flex items-center border-b border-slate-100 h-[65px] shrink-0",
                collapsed ? "justify-center px-2" : "px-5 gap-2.5 justify-between"
            )}>
                {!collapsed && (
                    <>
                        <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center shrink-0 shadow-sm shadow-teal-200">
                                <MessageSquare className="w-4 h-4 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-[15px] text-slate-800 truncate leading-tight">Message API</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <p className="text-[10px] text-teal-600 font-semibold tracking-wide leading-tight">WhatsApp Platform</p>
                                    {role === "admin" && (
                                        <span className="text-[8px] bg-blue-50 text-blue-600 border border-blue-100 px-1 rounded font-bold uppercase tracking-tighter">Admin</span>
                                    )}
                                    {role !== "reseller" && role !== "admin" && (
                                        <span className="text-[8px] bg-amber-50 text-amber-600 border border-amber-100 px-1 rounded font-bold uppercase tracking-tighter">Direct</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={toggleSidebar}
                            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                )}

                {collapsed && (
                    <div className="w-8 h-8 rounded-xl bg-linear-to-br from-[#128C7E] to-[#25D366] flex items-center justify-center shadow-sm shadow-teal-200">
                        <MessageSquare className="w-4 h-4 text-white" />
                    </div>
                )}
            </div>

            {/* Expand handle when collapsed */}
            {collapsed && (
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-[76px] bg-white border border-slate-200 shadow-sm rounded-full p-1 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-colors z-10"
                >
                    <ChevronRight className="h-3 w-3" />
                </button>
            )}

            {/* ── Nav ── */}
            <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-4">
                {navGroups.map((group) => (
                    <div key={group.label}>
                        {!collapsed && (
                            <p className="section-label px-3 mb-1.5">{group.label}</p>
                        )}
                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        target={(item as any).external ? "_blank" : undefined}
                                        rel={(item as any).external ? "noopener noreferrer" : undefined}
                                        title={collapsed ? item.label : undefined}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group relative",
                                            isActive
                                                ? "nav-active"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                                            collapsed && "justify-center px-0"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "h-[18px] w-[18px] shrink-0 transition-colors",
                                            isActive ? "text-[#128C7E]" : "text-slate-400 group-hover:text-slate-600"
                                        )} />
                                        {!collapsed && (
                                            <span className={cn(
                                                "text-[13.5px]",
                                                isActive ? "text-[#0e7468]" : "text-slate-600 group-hover:text-slate-800"
                                            )}>
                                                {item.label}
                                            </span>
                                        )}
                                        {isActive && !collapsed && (
                                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#128C7E] pulse-dot" />
                                        )}
                                    </Link>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* ── Bottom: User + Sign out ── */}
            <div className="border-t border-slate-100 p-3 space-y-1 shrink-0">
                {!collapsed ? (
                    <>
                        <Link
                            href="/dashboard/reseller/profile"
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs font-bold bg-linear-to-br from-[#128C7E] to-[#25D366] text-white">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-bold text-slate-800 truncate leading-tight">{userName}</p>
                                <p className="text-[11px] text-slate-500 truncate leading-tight">
                                    {userEmail || "guest@example.com"}
                                </p>
                            </div>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[13px] text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors font-medium"
                        >
                            <LogOut className="h-4 w-4" />
                            Sign Out
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-1">
                        <Link href="/dashboard/reseller/profile" title="Profile">
                            <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                                <AvatarFallback className="text-xs font-bold bg-linear-to-br from-[#128C7E] to-[#25D366] text-white">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            title="Sign Out"
                            className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                            <LogOut className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
