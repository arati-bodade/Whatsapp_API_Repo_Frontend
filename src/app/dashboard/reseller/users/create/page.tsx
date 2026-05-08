"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { businessService, BusinessRegisterData } from '@/services/businessService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label"; // Label component not present, removed import 
// Actually, I didn't see Label in the file list earlier? 
// Let's check the list_dir output from step 7... 
// "avatar.tsx", "badge.tsx", "button.tsx", "card.tsx", "dialog.tsx", "input.tsx", "progress.tsx", "separator.tsx", "sheet.tsx", "table.tsx"
// Label is missing. I will use standard <label> tags with appropriate classes.
import { Loader2 } from "lucide-react";

export default function CreateUserPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<BusinessRegisterData>({
        parent_reseller_id: '', // Will be set on submit from localStorage
        role: 'business_owner',
        status: 'active',
        whatsapp_mode: 'unofficial',
        profile: {
            name: '',
            username: '',
            email: '',
            phone: '',
            password: '',
        },
        business: {
            business_name: '',
            business_description: '',
            erp_system: '',
            gstin: '',
        },
        address: {
            full_address: '',
            pincode: '',
            country: '',
        },
        wallet: {
            credits_allocated: 0,
        },
    });

    const handleChange = (section: keyof BusinessRegisterData, field: string, value: string | number) => {
        setFormData(prev => {
            const currentSection = prev[section];
            if (typeof currentSection === 'object' && currentSection !== null) {
                return {
                    ...prev,
                    [section]: {
                        ...currentSection,
                        [field]: value
                    }
                };
            }
            return prev;
        });
    };

    const handleTopLevelChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
            let resellerId = localStorage.getItem('reseller_id') || localStorage.getItem('user_id');

            // Fix: Handle 'undefined' string values
            if (resellerId === 'undefined') resellerId = null;

            if (!token || !resellerId) {
                setError("Authentication session missing. Please login again.");
                return;
            }

            const payload: BusinessRegisterData = {
                ...formData,
                parent_reseller_id: resellerId
            };

            await businessService.register(payload, token);
            router.push('/dashboard/reseller/users');
        } catch (err) {
            console.error("Failed to create user:", err);
            const error = err as AxiosError<{ detail: string }>;
            setError(error.response?.data?.detail || "Failed to create user. Please check your inputs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex-1 p-8 pt-6 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Create Business User</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>Enter the details for the new business user.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        {/* Basic Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Basic Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Full Name *
                                    </label>
                                    <Input
                                        required
                                        placeholder="John Doe"
                                        value={formData.profile.name}
                                        onChange={(e) => handleChange('profile', 'name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Username *
                                    </label>
                                    <Input
                                        required
                                        placeholder="johndoe"
                                        value={formData.profile.username}
                                        onChange={(e) => handleChange('profile', 'username', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Email *
                                    </label>
                                    <Input
                                        required
                                        type="email"
                                        placeholder="john@example.com"
                                        value={formData.profile.email}
                                        onChange={(e) => handleChange('profile', 'email', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Phone *
                                    </label>
                                    <Input
                                        required
                                        placeholder="+1234567890"
                                        value={formData.profile.phone}
                                        onChange={(e) => handleChange('profile', 'phone', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Password *
                                    </label>
                                    <Input
                                        required
                                        type="password"
                                        placeholder="Secure password"
                                        value={formData.profile.password}
                                        onChange={(e) => handleChange('profile', 'password', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <h3 className="text-lg font-medium">Business Details</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Business Name *
                                    </label>
                                    <Input
                                        required
                                        placeholder="Acme Corp"
                                        value={formData.business.business_name}
                                        onChange={(e) => handleChange('business', 'business_name', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Description
                                    </label>
                                    <Input
                                        placeholder="Business description"
                                        value={formData.business.business_description || ''}
                                        onChange={(e) => handleChange('business', 'business_description', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        ERP System
                                    </label>
                                    <Input
                                        placeholder="e.g., SAP, Tally"
                                        value={formData.business.erp_system || ''}
                                        onChange={(e) => handleChange('business', 'erp_system', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        GSTIN
                                    </label>
                                    <Input
                                        placeholder="GSTIN Number"
                                        value={formData.business.gstin || ''}
                                        onChange={(e) => handleChange('business', 'gstin', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-6 space-y-4">
                            <h3 className="text-lg font-medium">Address</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Full Address
                                    </label>
                                    <Input
                                        placeholder="123 Street, City"
                                        value={formData.address?.full_address || ''}
                                        onChange={(e) => handleChange('address', 'full_address', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Pincode
                                    </label>
                                    <Input
                                        placeholder="123456"
                                        value={formData.address?.pincode || ''}
                                        onChange={(e) => handleChange('address', 'pincode', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Country
                                    </label>
                                    <Input
                                        placeholder="Country"
                                        value={formData.address?.country || ''}
                                        onChange={(e) => handleChange('address', 'country', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.push('/dashboard/reseller/users')}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create User
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
