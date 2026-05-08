"use client"

import Link from "next/link"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { Users, Wifi, WifiOff, Clock, Search, Eye, Edit2, Trash2, Plus, Loader2, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import userService, { BusinessUser, UserAnalytics } from "@/services/userService"
import resellerService from "@/services/resellerService"
import { useRouter } from "next/navigation"
import CreditDistributionComponent from "@/components/reseller/CreditDistributionComponent"
import ViewUserModal from "@/components/reseller/UserViewModal"
import EditUserModal from "@/components/reseller/UserEditModal"
import DeleteUserModal from "@/components/reseller/UserDeleteModal"

function AnalyticsCard({ title, value, icon: Icon, colorClass, iconColorClass }: any) {
    return (
        <div className={`${colorClass} rounded-xl p-6 text-white relative overflow-hidden`}>
            <div className="relative z-10">
                <p className="text-sm font-medium opacity-90 uppercase tracking-wide mb-2">{title}</p>
                <h3 className="text-3xl font-bold">{value}</h3>
            </div>
            <div className={`absolute right-4 bottom-4 p-3 rounded-full ${iconColorClass} bg-opacity-20`}>
                <Icon className="h-6 w-6 text-white" />
            </div>
        </div>
    )
}

export default function UsersPage() {
    const router = useRouter()
    const [searchQuery, setSearchQuery] = useState("")
    const [users, setUsers] = useState<BusinessUser[]>([])
    const [analytics, setAnalytics] = useState<UserAnalytics>({
        total_users: 0,
        active_users: 0,
        inactive_users: 0,
        plan_expired_users: 0
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<BusinessUser | null>(null)
    const [resellerId, setResellerId] = useState<string | null>(null)

    // View & Delete Modal States
    const [isViewOpen, setIsViewOpen] = useState(false)
    const [viewUser, setViewUser] = useState<BusinessUser | null>(null)
    const [isDeleteOpen, setIsDeleteOpen] = useState(false)
    const [deleteUser, setDeleteUser] = useState<BusinessUser | null>(null)

    const [isCreditSheetOpen, setIsCreditSheetOpen] = useState(false)
    const [creditUser, setCreditUser] = useState<{ id: string, name: string, business_name: string } | null>(null)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            // Get Reseller ID
            const profile = await resellerService.getProfile(token)
            if (profile && profile.user_id) {
                setResellerId(profile.user_id)
            }

            const [usersData, analyticsData] = await Promise.all([
                userService.getMyUsers(token),
                userService.getAnalytics(token)
            ])
            setUsers(usersData)
            setAnalytics(analyticsData)

        } catch (error) {
            console.error("Failed to fetch data:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const filteredUsers = users.filter(user => {
        const query = searchQuery.toLowerCase()
        return (
            user.profile.name.toLowerCase().includes(query) ||
            user.profile.email.toLowerCase().includes(query) ||
            user.business.business_name.toLowerCase().includes(query) ||
            user.profile.phone.includes(query)
        )
    })

    const openViewUser = (user: BusinessUser) => {
        setViewUser(user)
        setIsViewOpen(true)
    }

    const openEditUser = (user: BusinessUser) => {
        setEditingUser(user)
        setIsEditOpen(true)
    }

    const openDeleteUser = (user: BusinessUser) => {
        setDeleteUser(user)
        setIsDeleteOpen(true)
    }

    const openCreditDist = (user: BusinessUser) => {
        setCreditUser({
            id: user.busi_user_id,
            name: user.profile.name,
            business_name: user.business.business_name
        })
        setIsCreditSheetOpen(true)
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-6 w-6 text-blue-600" />
                            User Management
                        </h1>
                        <p className="text-gray-500 mt-1">Manage and monitor all your users</p>
                    </div>

                    <Link href="/dashboard/reseller/create-business">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add New User
                        </Button>
                    </Link>

                    <ViewUserModal
                        user={viewUser}
                        open={isViewOpen}
                        onOpenChange={setIsViewOpen}
                    />

                    <EditUserModal
                        user={editingUser}
                        open={isEditOpen}
                        onOpenChange={setIsEditOpen}
                        onSuccess={fetchData}
                    />

                    <DeleteUserModal
                        user={deleteUser}
                        open={isDeleteOpen}
                        onOpenChange={setIsDeleteOpen}
                        onSuccess={fetchData}
                    />

                    <Dialog open={isCreditSheetOpen} onOpenChange={setIsCreditSheetOpen}>
                        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0">
                            <DialogHeader className="p-6 pb-2">
                                <DialogTitle>Credit Distribution</DialogTitle>
                                <DialogDescription>
                                    Distribute credits to your business users.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="px-6 pb-6">
                                <CreditDistributionComponent preSelectedUser={creditUser} />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Analytics */}
                <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
                        User Analytics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <AnalyticsCard
                            title="TOTAL USERS"
                            value={analytics.total_users}
                            icon={Users}
                            colorClass="bg-blue-500"
                            iconColorClass="bg-blue-600"
                        />
                        <AnalyticsCard
                            title="CONNECTED"
                            value={analytics.active_users}
                            icon={Wifi}
                            colorClass="bg-green-500"
                            iconColorClass="bg-green-600"
                        />
                        <AnalyticsCard
                            title="DISCONNECTED"
                            value={analytics.inactive_users}
                            icon={WifiOff}
                            colorClass="bg-red-500"
                            iconColorClass="bg-red-600"
                        />
                        <AnalyticsCard
                            title="PLAN EXPIRED"
                            value={analytics.plan_expired_users}
                            icon={Clock}
                            colorClass="bg-orange-500"
                            iconColorClass="bg-orange-600"
                        />
                    </div>
                </div>

                {/* Search & Table */}
                <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-4 border-b">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by name, email, mobile, or company..."
                                className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">USER</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">COMPANY</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">CONTACT</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">PLAN</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">STATUS</th>
                                    <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">ACTIONS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                        <tr key={user.busi_user_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{user.profile.name}</div>
                                                <div className="text-gray-500 text-xs">{user.profile.email}</div>
                                                <div className="text-gray-400 text-xs mt-0.5">Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{user.business.business_name}</div>
                                                <div className="text-gray-500 text-xs">{user.business.gstin || "No GSTIN"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{user.profile.phone}</div>
                                                <div className="text-gray-500 text-xs">{user.address?.pincode || "No Pincode"}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                                    <svg className="mr-1.5 h-3 w-3 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                    </svg>
                                                    DEMO
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${user.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                                                        }`}></span>
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openCreditDist(user)}
                                                        className="p-1 text-purple-600 hover:bg-purple-50 rounded"
                                                        title="Distribute Credits"
                                                    >
                                                        <Coins className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openViewUser(user)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="View Details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openEditUser(user)}
                                                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteUser(user)}
                                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                            No users found matching "{searchQuery}"
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
