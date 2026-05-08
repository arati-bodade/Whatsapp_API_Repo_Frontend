"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AdminSidebar } from "@/components/layout/AdminSidebar"

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        const isAdmin = localStorage.getItem("admin_logged_in") === "true"
        const role = localStorage.getItem("user_role")

        if (!isAdmin || role !== "admin") {
            router.push("/admin-login")
        }
    }, [router])

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed)
    }

    if (!isMounted) return null

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <AdminSidebar collapsed={isSidebarCollapsed} toggleSidebar={toggleSidebar} />

            <main
                className={`flex-1 min-w-0 transition-all duration-300 ease-in-out relative ${
                    isSidebarCollapsed ? "pl-20" : "pl-64"
                }`}
            >
                <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                    {children}
                </div>
            </main>
        </div>
    )
}
