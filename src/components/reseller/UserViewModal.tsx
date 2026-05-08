"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { BusinessUser } from "@/services/userService"
import { Mail, Phone, MapPin, Building2, Wallet, CheckCircle2, XCircle, FileText } from "lucide-react"

interface ViewUserModalProps {
    user: BusinessUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ViewUserModal({ user, open, onOpenChange }: ViewUserModalProps) {
    if (!user) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 bg-slate-50 border-b border-slate-100">
                    <DialogTitle className="text-xl">User Profile</DialogTitle>
                    <DialogDescription>
                        Detailed information for {user.profile.name}
                    </DialogDescription>
                </DialogHeader>

                <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                    {/* Status Section */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                            <span className="font-medium text-gray-900 capitalize">{user.status}</span>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100 uppercase">
                            {user.role}
                        </div>
                    </div>

                    {/* Personal Details */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Personal Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Email Address</p>
                                    <p className="text-sm font-medium text-gray-900 break-all">{user.profile.email}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Phone</p>
                                    <p className="text-sm font-medium text-gray-900">{user.profile.phone}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Username</p>
                                    <p className="text-sm font-medium text-gray-900">{user.profile.username}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Business Details */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Business Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 sm:col-span-2">
                                <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Business Name</p>
                                    <p className="text-sm font-medium text-gray-900">{user.business.business_name}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">GSTIN</p>
                                    <p className="text-sm font-medium text-gray-900">{user.business.gstin || "N/A"}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                <div>
                                    <p className="text-xs text-gray-500">Pincode</p>
                                    <p className="text-sm font-medium text-gray-900">{user.address?.pincode || "N/A"}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wallet Summary */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Credit Wallet</h3>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-center">
                                <p className="text-xs text-blue-600 font-medium uppercase">Allocated</p>
                                <p className="text-lg font-bold text-blue-700">{user.wallet.credits_allocated}</p>
                            </div>
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-center">
                                <p className="text-xs text-orange-600 font-medium uppercase">Used</p>
                                <p className="text-lg font-bold text-orange-700">{user.wallet.credits_used}</p>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100 text-center">
                                <p className="text-xs text-green-600 font-medium uppercase">Balance</p>
                                <p className="text-lg font-bold text-green-700">{user.wallet.credits_remaining}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
