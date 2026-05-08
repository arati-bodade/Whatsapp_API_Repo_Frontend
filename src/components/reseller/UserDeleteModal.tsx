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
import { BusinessUser } from "@/services/userService"
import userService from "@/services/userService"
import { useState } from "react"
import { Loader2, AlertTriangle } from "lucide-react"

interface DeleteUserModalProps {
    user: BusinessUser | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export default function DeleteUserModal({ user, open, onOpenChange, onSuccess }: DeleteUserModalProps) {
    const [isLoading, setIsLoading] = useState(false)

    const handleDelete = async () => {
        if (!user) return
        setIsLoading(true)
        try {
            const token = localStorage.getItem("token")
            if (!token) return

            await userService.deleteUser(user.busi_user_id, token)
            onSuccess()
            onOpenChange(false)
        } catch (error) {
            console.error("Failed to delete user", error)
            alert("Failed to delete user. Please try again.")
        } finally {
            setIsLoading(false)
        }
    }

    if (!user) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <div className="flex flex-col items-center text-center p-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>

                    <DialogHeader>
                        <DialogTitle className="text-xl">Delete User?</DialogTitle>
                        <DialogDescription className="mt-2 text-center">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">{user.profile.name}</span>?
                            <br />
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex gap-3 w-full mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 bg-red-600 hover:bg-red-700"
                            onClick={handleDelete}
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete User"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
