import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/constants';

const API_URL = `${API_BASE_URL}/busi_users`; // Base URL for business users

export interface BusinessRegisterData {
    parent_reseller_id: string;
    role?: string;
    status?: string;
    whatsapp_mode?: string;
    profile: {
        name: string;
        username: string;
        email: string;
        phone: string;
        password: string;
    };
    business: {
        business_name: string;
        business_description?: string;
        erp_system?: string;
        gstin?: string;
    };
    address?: {
        full_address?: string;
        pincode?: string;
        country?: string;
    };
    wallet?: {
        credits_allocated: number;
    };
}

export interface BusinessLoginData {
    email: string;
    password: string;
}

export interface BusinessProfile {
    busi_user_id: string; // UUID serialized as string
    role: string;
    status: string;
    profile: {
        name: string;
        username: string;
        email: string;
        phone: string;
        created_at?: string;
    };
    business: {
        business_name: string;
        business_description?: string;
        erp_system?: string;
        gstin?: string;
    };
    wallet: {
        credits_allocated: number;
        credits_used: number;
        credits_remaining: number;
    };
    whatsapp_mode: string;
    address?: {
        full_address?: string;
        pincode?: string;
        country?: string;
    };
    // [NEW]
    plan_name?: string;
    plan_expiry?: string;
    connection_status?: 'connected' | 'disconnected';
}

export const businessService = {
    // Register a new business (Called by Reseller)
    register: async (data: BusinessRegisterData, token: string) => {
        const response = await axios.post(`${API_URL}/register`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Register a direct business (Called by Admin)
    registerDirect: async (data: any, token: string) => {
        const response = await axios.post(`${API_BASE_URL}/admin/direct-users`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Login as a Business User
    login: async (data: BusinessLoginData) => {
        const response = await axios.post(`${API_URL}/login`, data, { timeout: 15000 }); // 15s timeout
        return response.data;
    },

    // Get Current Business User Profile
    getProfile: async (token: string) => {
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Update Current Business User Profile
    updateProfile: async (token: string, data: any) => {
        const response = await axios.put(`${API_URL}/me`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get all businesses for a reseller (Called by Reseller)
    getBusinessesByReseller: async (resellerId: string, token: string) => {
        const response = await axios.get(`${API_URL}/reseller/${resellerId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get Reseller Analytics (Stats for user management page)
    getAnalytics: async (token: string) => {
        const response = await axios.get(`${API_URL}/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Update a business user
    update: async (userId: string, data: any, token: string) => {
        const response = await axios.put(`${API_URL}/${userId}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Delete a business user
    delete: async (userId: string, token: string) => {
        const response = await axios.delete(`${API_URL}/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // [NEW] Get Current User's Plan
    getMyPlan: async (token: string) => {
        const response = await axios.get(`${API_URL}/me/plan`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // [NEW] Get Available Plans
    getAvailablePlans: async (token: string) => {
        const response = await axios.get(`${API_URL}/plans/available`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getDashboardStats: async () => {
        const response = await axios.get(`${API_BASE_URL}/user/dashboard/stats`);
        return response.data;
    },

    getDashboardGraphData: async () => {
        const response = await axios.get(`${API_BASE_URL}/user/dashboard/graph-data`);
        return response.data;
    },
};

export default businessService;
