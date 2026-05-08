"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BusinessUser } from "@/services/userService"
import userService from "@/services/userService"
import { useState, useEffect } from "react"
import { Loader2 } from "lucide-react"

interface EditUserModalProps {
    user: BusinessUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function EditUserModal({ user, open, onOpenChange, onSuccess }: EditUserModalProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        username: "",
        email: "",
        phone: "",
        business_name: "",
        gstin: "",
        pincode: ""
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.profile.name || "",
                username: user.profile.username || "",
                email: user.profile.email || "",
                phone: user.profile.phone || "",
                business_name: user.business.business_name || "",
                gstin: user.business.gstin || "",
                pincode: user.address?.pincode || ""
            })
        }
    }, [user])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            if (!token) return

            const updatePayload = {
                profile: {
                    name: formData.name,
                    username: formData.username,
                    email: formData.email,
                    phone: formData.phone
                },
                business: {
                    business_name: formData.business_name,
                    gstin: formData.gstin || undefined
                },
                address: {
                    pincode: formData.pincode || undefined
                }
            }

            await userService.updateUser(user.busi_user_id, updatePayload, token)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to update user", error)
            alert("Failed to update user. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 bg-slate-50 border-b border-slate-100">
                    <DialogTitle>Edit User Profile</DialogTitle>
                    <DialogDescription>
                        Update the business user's account details.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Full Name</label>
                            <Input name="name" value={formData.name} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Username</label>
                            <Input name="username" value={formData.username} onChange={handleInputChange} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Email</label>
                            <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone</label>
                            <Input name="phone" value={formData.phone} onChange={handleInputChange} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Business Name</label>
                        <Input name="business_name" value={formData.business_name} onChange={handleInputChange} required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">GSTIN (Optional)</label>
                            <Input name="gstin" value={formData.gstin} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Pincode (Optional)</label>
                            <Input name="pincode" value={formData.pincode} onChange={handleInputChange} />
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
