"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { 
    ProfileHeader, 
    ProfileStats, 
    PersonalInfoSection, 
    BusinessInfoSection, 
    AccountDetailsSection, 
    SecuritySettingsSection 
} from "@/components/profile/ProfileComponents"
import ProfilePhotoSection from "@/components/profile/ProfilePhotoSection"
import resellerService from "@/services/resellerService"
import profilePhotoService from "@/services/profilePhotoService"
import { Loader2 } from "lucide-react"

export default function ResellerProfilePage() {
    const router = useRouter()
    const [data, setData] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null)

    // Handle profile photo updates
    const handlePhotoUpdate = (photoUrl: string | null) => {
        setProfilePhotoUrl(photoUrl)
        // Update the data object as well
        if (data) {
            setData({
                ...data,
                profile_image: photoUrl
            })
        }
    }

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (!token) {
                router.push("/login")
                return
            }

            const [profileData, photoData] = await Promise.all([
                resellerService.getProfile(token),
                profilePhotoService.getMyProfilePhoto(token)
            ])

            // The profile API returns different data than dashboard, so we need to get the correct used credits
            // Let's use the analytics API like the dashboard does to get consistent data
            try {
                // Import analytics service to get the same data as dashboard
                const { analyticsService } = await import('@/services/analyticsService');
                const token = localStorage.getItem("token") || localStorage.getItem("resellerToken");
                
                if (token && profileData.reseller_id) {
                    const analyticsData = await analyticsService.getResellerDashboard(profileData.reseller_id);
                    
                    console.log('Analytics data:', analyticsData);
                    
                    const totalCredits = analyticsData.total_credits || profileData.wallet?.total_credits || 0;
                    const usedCredits = analyticsData.used_credits || 0;
                    const calculatedRemaining = Math.max(0, totalCredits - usedCredits);

                    const mappedData = {
                        ...profileData,
                        profile_image: photoData.photo_url,
                        wallet: {
                            credits_allocated: totalCredits,
                            credits_used: usedCredits,
                            credits_remaining: calculatedRemaining,
                            available_credits: calculatedRemaining
                        },
                        business: profileData.business || { business_name: null, organization_type: null, erp_system: null },
                        profile: profileData.profile || {},
                        address: profileData.address || {},
                        bank: profileData.bank || { bank_name: null },
                        whatsapp_mode: "active",
                        id: profileData.reseller_id
                    };

                    setData(mappedData);
                    setProfilePhotoUrl(photoData.photo_url);
                    return;
                }
            } catch (analyticsError) {
                console.error('Failed to fetch analytics data:', analyticsError);
            }

            // Fallback to original logic if analytics fails
            const wallet = profileData.wallet || {};
            const usedCredits = wallet.used_credits || wallet.credits_used || wallet.distributed_credits || 0;
            const totalCredits = wallet.total_credits || wallet.credits_allocated || 0;
            const calculatedRemaining = Math.max(0, totalCredits - usedCredits);

            const mappedData = {
                ...profileData,
                wallet: {
                    credits_allocated: totalCredits,
                    credits_used: usedCredits,
                    credits_remaining: calculatedRemaining,
                    available_credits: calculatedRemaining
                },
                business: profileData.business || { business_name: null, organization_type: null, erp_system: null },
                profile: profileData.profile || {},
                address: profileData.address || {},
                bank: profileData.bank || { bank_name: null },
                whatsapp_mode: "active",
                id: profileData.reseller_id
            }

            setData(mappedData);
        } catch (err: any) {
            console.error("Failed to fetch reseller profile", err)
            setError("Failed to load profile data.")
            if (err.response?.status === 401) {
                router.push("/login")
            }
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, [router])

    const handleUpdate = async (updatedFields: any) => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("resellerToken")
            if (!token) return;

            await resellerService.updateProfile(token, updatedFields);
            // Refresh data after update
            await fetchProfile();
        } catch (err) {
            console.error("Update failed:", err);
            throw err;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[80vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="flex items-center justify-center min-h-[80vh] text-red-500 font-bold">
                {error || "No profile data found."}
            </div>
        )
    }

    return (
        <div className="p-8 space-y-6 bg-gray-50/20 min-h-screen">
            {/* Header Section */}
            <ProfileHeader data={data} onUpdate={handleUpdate} />

            {/* Stats Row */}
            <ProfileStats data={data} isLoading={isLoading} />

            {/* Main Content Grid - 3 Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info Column */}
                <div className="lg:col-span-2 space-y-6">
                    <PersonalInfoSection data={data} onUpdate={handleUpdate} />
                    <BusinessInfoSection data={data} onUpdate={handleUpdate} />
                </div>
                
                {/* Sidebar Column */}
                <div className="space-y-6">
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
