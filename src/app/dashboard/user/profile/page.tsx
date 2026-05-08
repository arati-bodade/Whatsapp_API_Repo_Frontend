"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ProfileHeader, ProfileStats, PersonalInfoSection, BusinessInfoSection, AccountDetailsSection, SecuritySettingsSection } from "@/components/profile/ProfileComponents"
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection"
import businessService, { BusinessProfile } from "@/services/businessService"
import profilePhotoService from "@/services/profilePhotoService"
import { Loader2 } from "lucide-react"

export default function UserProfilePage() {
    const router = useRouter()
    const [data, setData] = useState<BusinessProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)

    // Handle profile photo updates
    const handlePhotoUpdate = (photoUrl: string | null) => {
        console.log('Profile photo updated:', photoUrl)
        setProfilePhotoUrl(photoUrl)
        // Update the data object as well
        if (data) {
            const updatedData = {
                ...data,
                profile: {
                    ...data.profile,
                    profile_image: photoUrl
                }
            }
            console.log('Updated profile data:', updatedData)
            setData(updatedData)
        }
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                const [profileData, photoData] = await Promise.all([
                    businessService.getProfile(token),
                    profilePhotoService.getMyProfilePhoto(token)
                ])

                // Merge profile data with photo data
                const mergedData = {
                    ...profileData,
                    profile: {
                        ...profileData.profile,
                        profile_image: photoData.photo_url
                    }
                }

                setData(mergedData)
                setProfilePhotoUrl(photoData.photo_url)
                console.log('Fetched profile photo URL:', photoData.photo_url)
                console.log('Merged data with photo:', mergedData)
            } catch (err: any) {
                console.error("Failed to fetch profile", err)
                setError("Failed to load profile data.")
                if (err.response?.status === 401) {
                    router.push("/login")
                }
            } finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[50vh] text-red-500">
                {error || "No profile data available."}
            </div>
        )
    }

    const handleUpdate = async (updatedData: any) => {
        try {
            const token = localStorage.getItem("token")
            if (!token) return
            
            // Call the actual update API
            await businessService.updateProfile(token, updatedData)
            
            // Refetch to get clean data
            const refreshed = await businessService.getProfile(token)
            setData(refreshed)
        } catch (err) {
            console.error("Failed to update profile", err)
            // You could set an error state here to show a toast or alert
        }
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto">

            {/* Header Section */}
            <ProfileHeader data={data} onUpdate={handleUpdate} />

            {/* Stats Row */}
            <ProfileStats data={data} isLoading={isLoading} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-8">
                    <PersonalInfoSection data={data} onUpdate={handleUpdate} />
                    <BusinessInfoSection data={data} onUpdate={handleUpdate} />
                </div>
                
                {/* Sidebar Column */}
                <div className="space-y-8">
                    {/* ProfilePhotoSection hidden as requested - actions are available in the header */}
                    {/* <ProfilePhotoSection 
                        currentPhotoUrl={profilePhotoUrl}
                        onPhotoUpdate={handlePhotoUpdate}
                    /> */}
                    <AccountDetailsSection data={data} />
                    <SecuritySettingsSection />
                </div>
            </div>
        </div>
    )
}
