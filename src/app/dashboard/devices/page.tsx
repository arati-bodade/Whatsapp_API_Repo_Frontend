"use client";

import DeviceList from "@/components/DeviceList";
import { useAuth } from "@/context/AuthContext";

export default function DevicesPage() {
    const { user } = useAuth();
    
    // Get real user ID from authentication context
    const userId = user?.id || "";

    if (!userId) {
        return (
            <div className="min-h-screen bg-gray-50/50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500">Please log in to view devices.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Device Management</h1>
                    <p className="mt-2 text-gray-600">Manage your connected WhatsApp devices and sessions.</p>
                </div>

                <DeviceList userId={userId} />
            </div>
        </div>
    );
}
