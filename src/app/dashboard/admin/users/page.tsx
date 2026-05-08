"use client"
import { useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import { 
    Users, Search, Filter, MoreVertical, Eye, Edit2, 
    Trash2, UserPlus, ArrowUpDown, ChevronLeft, 
    ChevronRight, CheckCircle2, XCircle, Clock, AlertTriangle, Download, X
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { getGlobalUsers, deleteGlobalUser, updateGlobalUser } from "@/config/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function AdminUsersPage() {
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [roleFilter, setRoleFilter] = useState("all")
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    const [viewUser, setViewUser] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    const [editUser, setEditUser] = useState<any>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ name: "", email: "", company: "" });
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<any>(null);
    const [notification, setNotification] = useState<{show: boolean, type: 'success' | 'error' | 'info', title: string, message: string}>({
        show: false,
        type: 'success',
        title: '',
        message: ''
    });

    const showNotification = (type: 'success' | 'error' | 'info', title: string, message: string) => {
        setNotification({ show: true, type, title, message });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, show: false }));
        }, 5000);
    };

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await getGlobalUsers();
                setUsers(data);
            } catch (err) {
                console.error("Failed to load users", err);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const handleDeleteUser = (user: any) => {
        setUserToDelete(user);
        setIsDeleteModalOpen(true);
    };

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        setIsDeleting(true);
        try {
            const response = await deleteGlobalUser(userToDelete.id);
            // Real-time update: remove from local state
            setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
            setIsDeleteModalOpen(false);
            setUserToDelete(null);
            showNotification('success', 'User Deleted', response.message || "The user has been permanently removed from the system.");
        } catch (err: any) {
            console.error("Failed to delete user", err);
            const errorMessage = err.response?.data?.detail || "Failed to delete user. Please try again.";
            showNotification('error', 'Deletion Failed', errorMessage);
        } finally {
            setIsDeleting(false);
        }
    };

    const router = useRouter();
    const handleViewUser = (user: any) => {
        router.push(`/dashboard/admin/users/${user.id}?from=directory`);
    };

    const handleEditUser = (user: any) => {
        setEditUser(user);
        setEditFormData({
            name: user.name || "",
            email: user.email || "",
            company: user.company || ""
        });
        setIsEditModalOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editUser) return;
        setIsSaving(true);
        try {
            await updateGlobalUser(editUser.id, {
                name: editFormData.name,
                email: editFormData.email,
                business_name: editFormData.company
            });
            
            // Update local state to reflect changes
            setUsers(prev => prev.map(u => {
                if (u.id === editUser.id) {
                    return { ...u, name: editFormData.name, email: editFormData.email, company: editFormData.company };
                }
                return u;
            }));
            
            setIsEditModalOpen(false);
            showNotification('success', 'Profile Updated', "The user's profile information has been successfully saved.");
        } catch (err) {
            console.error("Failed to update user", err);
            showNotification('error', 'Update Failed', "System was unable to process the profile update. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case "active":
                return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Active</Badge>
            case "inactive":
                return <Badge className="bg-rose-500/10 text-rose-600 border-rose-500/20 px-2 py-0.5"><XCircle className="w-3 h-3 mr-1" /> Inactive</Badge>
            case "pending":
                return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>
            default:
                return <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 px-2 py-0.5">{status}</Badge>
        }
    }

    const handleExport = () => {
        const filteredUsers = users.filter(u => {
            const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                  u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  u.company?.toLowerCase().includes(searchQuery.toLowerCase()));
            
            const matchesStatus = statusFilter === "all" || u.status === statusFilter;
            const matchesRole = roleFilter === "all" || u.role === roleFilter;

            return matchesSearch && matchesStatus && matchesRole;
        });

        if (!filteredUsers.length) {
            showNotification('info', 'No Data', "There are no users matching the current filters to export.");
            return;
        }

        const headers = ["Name", "Email", "Company", "Role", "Status", "Joined At", "Created By"];
        const csvContent = [
            headers.join(","),
            ...filteredUsers.map(u => [
                `"${(u.name || "").replace(/"/g, '""')}"`,
                `"${(u.email || "").replace(/"/g, '""')}"`,
                `"${(u.company || "").replace(/"/g, '""')}"`,
                `"${(u.role || "").replace(/"/g, '""')}"`,
                `"${(u.status || "").replace(/"/g, '""')}"`,
                `"${u.joined || ""}"`,
                `"${(u.created_by_name || "").replace(/"/g, '""')}"`
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `users_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center space-x-2">
                 <div className="w-8 h-8 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                 <p className="font-bold text-slate-500">Loading User Directory...</p>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto relative">
            {/* Custom Notification Module */}
            {notification.show && (
                <div className="fixed top-24 right-8 z-[100] animate-in slide-in-from-right-full duration-500">
                    <div className={`p-4 rounded-2xl shadow-2xl flex items-center gap-4 border backdrop-blur-md transition-all ${
                        notification.type === 'success' 
                            ? 'bg-emerald-600 text-white border-emerald-400/30' 
                            : notification.type === 'error'
                            ? 'bg-rose-600 text-white border-rose-400/30'
                            : 'bg-indigo-600 text-white border-indigo-400/30'
                    }`}>
                        <div className="bg-white/20 p-2 rounded-xl">
                            {notification.type === 'success' && <CheckCircle2 className="w-6 h-6" />}
                            {notification.type === 'error' && <XCircle className="w-6 h-6" />}
                            {notification.type === 'info' && <AlertTriangle className="w-6 h-6" />}
                        </div>
                        <div className="min-w-[180px]">
                            <p className="font-black text-sm uppercase tracking-tighter">{notification.title}</p>
                            <p className="text-xs font-bold opacity-90">{notification.message}</p>
                        </div>
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-white hover:bg-white/10 ml-2 h-8 w-8 p-0 rounded-lg"
                            onClick={() => setNotification(prev => ({ ...prev, show: false }))}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        User Directory
                    </h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Infrastructure Management • Users</p>
                </div>
                {/* <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-6 rounded-2xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2">
                    <UserPlus className="w-5 h-5" />
                    Register New User
                </Button> */}
            </div>

            {/* Content Card */}
            <Card className="border-none shadow-2xl shadow-slate-200/60 rounded-[2.5rem] overflow-hidden bg-white/80 backdrop-blur-xl">
                <CardHeader className="p-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="relative w-full md:w-[400px] group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                        <Input 
                            placeholder="Search users, email, or companies..." 
                            className="pl-12 h-14 bg-slate-50/50 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 transition-all font-medium"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="h-12 w-[160px] rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 focus:ring-indigo-600/10">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="all" className="font-bold text-slate-600">All Status</SelectItem>
                                <SelectItem value="active" className="font-bold text-emerald-600">Active</SelectItem>
                                <SelectItem value="inactive" className="font-bold text-rose-600">Inactive</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="h-12 w-[160px] rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-50 focus:ring-indigo-600/10">
                                <Filter className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                <SelectItem value="all" className="font-bold text-slate-600">All Roles</SelectItem>
                                <SelectItem value="Reseller" className="font-bold text-indigo-600">Reseller</SelectItem>
                                <SelectItem value="Direct Business" className="font-bold text-indigo-600">Direct Business</SelectItem>
                                <SelectItem value="Managed User" className="font-bold text-indigo-600">Managed User</SelectItem>
                            </SelectContent>
                        </Select>
                        
                        <Button 
                            variant="outline" 
                            className="h-12 px-4 rounded-xl border-slate-200 font-bold text-indigo-600 hover:bg-indigo-50 border-indigo-100 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                            onClick={handleExport}
                        >
                            <Download className="w-5 h-5" />
                            Export CSV
                        </Button>
                        {/* <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 font-bold text-slate-400">
                            <MoreVertical className="w-5 h-5" />
                        </Button> */}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        <div className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition-colors group">
                                            User Info <ArrowUpDown className="w-3 h-3" />
                                        </div>
                                    </th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Company / Workspace</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Member Since</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Created By</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {users.length > 0 ? users
                                    .filter(u => {
                                        const matchesSearch = (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                                              u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                              u.company?.toLowerCase().includes(searchQuery.toLowerCase()));
                                        
                                        const matchesStatus = statusFilter === "all" || u.status === statusFilter;
                                        const matchesRole = roleFilter === "all" || u.role === roleFilter;

                                        return matchesSearch && matchesStatus && matchesRole;
                                    })
                                    .map((user) => (
                                    <tr key={user.id} className="group hover:bg-slate-50/50 transition-colors duration-200">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                                    <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs uppercase">
                                                        {user.name ? user.name.slice(0, 2) : "US"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <p className="font-black text-slate-900 truncate tracking-tight">{user.name}</p>
                                                    <p className="text-xs font-bold text-slate-400 truncate">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-700">{user.company}</p>
                                                <p className="text-[10px] uppercase font-black tracking-widest text-indigo-500/70">{user.role}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {getStatusBadge(user.status)}
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-sm font-bold text-slate-600">{user.joined !== "Unknown" ? new Date(user.joined).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : "Unknown"}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <Badge className="bg-indigo-50/50 text-indigo-600 border-indigo-100 font-black text-[10px] uppercase tracking-wider px-2 py-1">
                                                {user.created_by_name || "Unknown"}
                                            </Badge>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-2 group-hover:translate-x-0 transition-transform duration-300">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-indigo-500 bg-indigo-50/50 hover:text-white hover:bg-indigo-600 rounded-lg transition-all" 
                                                    title="View Details"
                                                    onClick={() => handleViewUser(user)}
                                                >
                                                    <Eye className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-emerald-500 bg-emerald-50/50 hover:text-white hover:bg-emerald-600 rounded-lg transition-all" 
                                                    title="Edit Account"
                                                    onClick={() => handleEditUser(user)}
                                                >
                                                    <Edit2 className="w-4.5 h-4.5" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-9 w-9 text-rose-500 bg-rose-50/50 hover:text-white hover:bg-rose-600 rounded-lg transition-all" 
                                                    title="Delete Account"
                                                    onClick={() => handleDeleteUser(user)}
                                                >
                                                    <Trash2 className="w-4.5 h-4.5" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-10 text-center text-slate-400 font-bold">
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Showing {users.length > 0 ? 1 : 0} to {users.length} of {users.length} users</p>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" className="w-10 h-10 p-0 rounded-xl border-slate-200 text-slate-400" disabled>
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            {[1, 2, 3].map(p => (
                                <Button 
                                    key={p} 
                                    variant={p === 1 ? 'default' : 'outline'} 
                                    className={`w-10 h-10 p-0 rounded-xl font-bold transition-all ${p === 1 ? 'bg-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {p}
                                </Button>
                            ))}
                            <Button variant="outline" className="w-10 h-10 p-0 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50">
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View User Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl">
                    <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-black text-xs uppercase">
                                    {viewUser?.name ? viewUser.name.slice(0, 2) : "US"}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <span className="block">{viewUser?.name}</span>
                                <span className="text-xs font-bold text-slate-400 block mt-1">{viewUser?.email}</span>
                            </div>
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Role</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{viewUser?.role}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                                <div>{viewUser?.status && getStatusBadge(viewUser.status)}</div>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Company</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">{viewUser?.company}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Member Since</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300">
                                    {viewUser?.joined !== "Unknown" ? new Date(viewUser?.joined).toLocaleDateString() : "Unknown"}
                                </p>
                            </div>
                            <div className="col-span-2 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 rounded-2xl border border-indigo-100/50 dark:border-indigo-800/30">
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 mb-1 flex items-center gap-2">
                                    <Clock className="w-3 h-3" />
                                    Active Plan
                                </p>
                                <p className="font-bold text-indigo-700 dark:text-indigo-300 text-lg">{viewUser?.plan || "No Plan Active"}</p>
                            </div>
                            <div className="col-span-2 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">User ID</p>
                                <p className="font-bold text-slate-700 dark:text-slate-300 text-xs break-all">{viewUser?.id}</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                        <Button onClick={() => setIsViewModalOpen(false)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl py-6 tracking-wide shadow-none">
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl">
                    <DialogHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Edit2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            Edit User Profile
                        </DialogTitle>
                    </DialogHeader>
                    <div className="p-8 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Name</label>
                            <Input 
                                value={editFormData.name} 
                                onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                                className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Email Address</label>
                            <Input 
                                type="email"
                                value={editFormData.email} 
                                onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 font-medium"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Company / Business Name</label>
                            <Input 
                                value={editFormData.company} 
                                onChange={(e) => setEditFormData({...editFormData, company: e.target.value})}
                                className="h-12 bg-slate-50/50 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 font-medium"
                            />
                        </div>
                        
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-2xl p-4 flex items-start gap-3 mt-6">
                            <div className="mt-0.5">
                                <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Note on Roles & Status</p>
                                <p className="text-[10px] font-medium text-indigo-600/80 dark:text-indigo-400 mt-1">To maintain system integrity, role assignments and active status changes should be managed through plan assignments and credit allocations, not through direct profile edits.</p>
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsEditModalOpen(false)} 
                            className="h-12 px-6 rounded-xl border-slate-200 font-bold text-slate-600 hover:bg-slate-100"
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleSaveEdit} 
                            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-lg shadow-indigo-600/20"
                            disabled={isSaving}
                        >
                            {isSaving ? "Saving..." : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
                <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none rounded-[2rem] shadow-2xl">
                    <div className="p-8 pt-10 text-center">
                        <div className="w-20 h-20 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <AlertTriangle className="w-10 h-10 text-rose-500" />
                        </div>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white mb-2 text-center">Confirm Delete</DialogTitle>
                            <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium text-center">
                                Are you sure you want to permanently delete <span className="font-black text-slate-900 dark:text-slate-200">"{userToDelete?.name}"</span>?
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex items-start gap-3 text-left">
                            <Clock className="w-4 h-4 text-amber-600 mt-0.5" />
                            <p className="text-[11px] font-bold text-amber-800 dark:text-amber-400 leading-relaxed">
                                This action is irreversible. All campaign history, message logs, and account data associated with this user will be permanently purged from the system.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex flex-row gap-3 items-center">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsDeleteModalOpen(false)} 
                            className="flex-1 h-14 rounded-2xl border-slate-200 font-bold text-slate-600 hover:bg-white"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button 
                            onClick={confirmDeleteUser} 
                            className="flex-1 h-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-95"
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Purging...
                                </div>
                            ) : "Delete Account"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
