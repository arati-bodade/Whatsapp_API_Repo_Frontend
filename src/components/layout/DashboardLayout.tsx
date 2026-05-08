"use client"

import { useState, useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { Sidebar } from "@/components/layout/Sidebar"
import { UserSidebar } from "@/components/layout/UserSidebar"
import { AdminSidebar } from "@/components/layout/AdminSidebar"
import userService from "@/services/userService"
import ChatBot from "@/components/chatbot/ChatBot"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, role: authRole, isLoading: authLoading } = useAuth()
    
    const [collapsed, setCollapsed] = useState(false)
    const [pageKey, setPageKey] = useState(pathname)
    const prevPath = useRef(pathname)
    const [isDirectUser, setIsDirectUser] = useState(false)
    const [checkingDirect, setCheckingDirect] = useState(true)

    /* page transition key */
    useEffect(() => {
        if (prevPath.current !== pathname) {
            setPageKey(pathname)
            prevPath.current = pathname
        }
    }, [pathname])

    /* role guard and direct user check */
    useEffect(() => {
        // Wait for auth to initialize before making redirection decisions
        if (authLoading) return;

        const token = localStorage.getItem("token") || localStorage.getItem("resellerToken");
        const r = (authRole || "").toLowerCase();

        // 1. Unauthenticated -> Login
        if (!token || !user) {
            if (pathname.includes("/admin")) {
                router.push("/admin-login");
            } else if (!pathname.includes("/login") && !pathname.includes("/landing")) {
                router.push("/login");
            }
            return;
        }

        // 2. Direct User Status Check (Business Owners / Users)
        const checkDirectStatus = async () => {
            try {
                // 🔥 FIX: Include "business" role in the check
                if ((r === "business_owner" || r === "user" || r === "business") && token && !isDirectUser) {
                    try {
                        const profile = await userService.getMe(token);
                        if (profile.parent_role === "admin") {
                            setIsDirectUser(true);
                        }
                    } catch (profileErr) {
                        console.log("⚠️ Could not fetch user profile, assuming not direct user:", profileErr);
                    }
                }
            } catch (err) {
                console.error("Layout status check failed", err);
            } finally {
                setCheckingDirect(false);
            }
        };

        // 🔥 FIX: Include "business" role in the condition
        if (r === "business_owner" || r === "user" || r === "business") {
            checkDirectStatus();
        } else {
            setCheckingDirect(false);
        }

        // 3. Handle Root Dashboard Redirect
        if (pathname === "/dashboard" || pathname === "/dashboard/") {
            if (r === "admin") router.push("/dashboard/admin");
            else if (r === "reseller") router.push("/dashboard/reseller/analytics");
            else router.push("/dashboard/user");
            return;
        }

        // 4. Admin Guards: Only allow access to /dashboard/admin
        if (r === "admin") {
            if (!pathname.startsWith("/dashboard/admin")) {
                // If admin types /dashboard/user or /dashboard/reseller manually
                router.push("/dashboard/admin");
                return;
            }
            return;
        }

        // 5. Non-Admin trying to access /admin
        if (pathname.startsWith("/dashboard/admin") && r !== "admin") {
            router.push("/dashboard"); // Root redirect above will handle correct destination
            return;
        }

        // 6. Reseller/User Cross-Access Logic 
        // 🔥 FIX: Check actual role from user object, not just authRole
        const actualRole = user?.role || authRole || "";
        const normalizedRole = actualRole.toLowerCase();
        
        console.log("🔍 Dashboard routing check:", { 
            pathname, 
            authRole, 
            userRole: user?.role, 
            actualRole, 
            normalizedRole,
            isDirectUser 
        });

        if (normalizedRole === "reseller") {
            if (pathname.startsWith("/dashboard/user")) {
                console.log("🔀 Reseller trying to access user dashboard, redirecting...");
                router.push("/dashboard/reseller/analytics");
            }
        } else if (normalizedRole === "user" || normalizedRole === "business_owner" || normalizedRole === "business") {
            if (pathname.startsWith("/dashboard/reseller")) {
                if (!isDirectUser && !checkingDirect) {
                    console.log("🔀 User trying to access reseller dashboard, redirecting...");
                    router.push("/dashboard/user");
                }
            }
        }
    }, [pathname, router, authLoading, authRole, user, isDirectUser, checkingDirect]);

    const sidebarW = collapsed ? "4rem" : "16rem"
    const isUserMode = pathname.startsWith("/dashboard/user")

    if ((authLoading || checkingDirect) && isUserMode) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
               <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    const renderSidebar = () => {
        // 🔥 FIX: Use the same role detection logic as routing
        const actualRole = user?.role || authRole || "";
        const normalizedRole = actualRole.toLowerCase();
        
        console.log("🎨 Sidebar rendering:", { 
            isUserMode, 
            isDirectUser, 
            authRole, 
            userRole: user?.role, 
            actualRole, 
            normalizedRole 
        });
        
        if (normalizedRole === "admin") {
            return <AdminSidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(p => !p)} />
        }
        if (isUserMode && !isDirectUser) {
            return <UserSidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(p => !p)} />
        }
        return <Sidebar collapsed={collapsed} toggleSidebar={() => setCollapsed(p => !p)} />
    }

    return (
        /* ── Viewport-locked layout to prevent fixed elements from moving ── */
        <div className="h-screen flex overflow-hidden bg-[#F5F7FA]">

            {renderSidebar()}

            <main
                key={pageKey}
                className="flex-1 min-w-0 overflow-y-auto page-enter relative"
                style={{
                    marginLeft: sidebarW,
                    transition: "margin-left 0.3s cubic-bezier(0.22,1,0.36,1)",
                    padding: "1.5rem",
                    height: "100vh",
                }}
            >
                {children}
            </main>

            <ChatBot />
        </div>
    )
}

