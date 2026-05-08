"use client"

import { useState, useEffect } from "react"
import DashboardLayout from "@/components/layout/DashboardLayout"
import { ProfileHeader, ProfileStats, PersonalInfoSection, BusinessInfoSection, AccountDetailsSection, SecuritySettingsSection } from "@/components/profile/ProfileComponents"
import businessService, { BusinessProfile } from "@/services/businessService"

export default function ProfilePage() {
    const [profileData, setProfileData] = useState<BusinessProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) return
                const data = await businessService.getProfile(token)
                setProfileData(data)
            } catch (err) {
                console.error("Failed to load profile:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [])

    const handleUpdate = async (updatedData: any) => {
        const token = localStorage.getItem("token")
        if (!token) return
        const refreshed = await businessService.getProfile(token)
        setProfileData(refreshed)
    }

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        )
    }

    return (
        <DashboardLayout>
            <div className="space-y-8 max-w-7xl mx-auto">

                {/* Header Section */}
                <ProfileHeader data={profileData} onUpdate={handleUpdate} />

                {/* Stats Row */}
                <ProfileStats data={profileData} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Info Column */}
                    <div className="lg:col-span-2 space-y-8">
                        <PersonalInfoSection data={profileData} onUpdate={handleUpdate} />
                        <BusinessInfoSection data={profileData} onUpdate={handleUpdate} />
                    </div>

                    {/* Side Column */}
                    <div className="space-y-6">
                        <AccountDetailsSection data={profileData} />
                        <SecuritySettingsSection />
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
