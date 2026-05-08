import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

export interface UserAnalytics {
    total_users: number;
    active_users: number;
    inactive_users: number;
    plan_expired_users: number;
}

export interface BusinessUser {
    busi_user_id: string;
    role: string;
    status: string;
    parent_reseller_id: string;
    parent_role: string;
    created_at: string;
    profile: {
        name: string;
        username: string;
        email: string;
        phone: string;
    };
    business: {
        business_name: string;
        gstin?: string;
    };
    address?: {
        pincode?: string;
    };
    wallet: {
        credits_allocated: number;
        credits_used: number;
        credits_remaining: number;
    };
    whatsapp_mode: string;
    plan_name?: string;
    plan_expiry?: string;
}

const userService = {
    getMyUsers: async (token: string): Promise<BusinessUser[]> => {
        const response = await axios.get(`${API_URL}/busi_users/my-users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    getAnalytics: async (token: string): Promise<UserAnalytics> => {
        const response = await axios.get(`${API_URL}/busi_users/analytics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    createUser: async (data: any, token: string) => {
        const response = await axios.post(`${API_URL}/busi_users/register`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    registerUser: async (data: any) => {
        const response = await axios.post(`${API_URL}/busi_users/register`, data);
        return response.data;
    },

    updateUser: async (id: string, data: any, token: string) => {
        const response = await axios.put(`${API_URL}/busi_users/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    deleteUser: async (id: string, token: string) => {
        await axios.delete(`${API_URL}/busi_users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    getMe: async (token: string): Promise<BusinessUser> => {
        const response = await axios.get(`${API_URL}/busi_users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    requestPasswordReset: async (email: string) => {
        const response = await axios.post(`${API_URL}/auth/password-reset/request`, { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string) => {
        const response = await axios.post(`${API_URL}/auth/password-reset/confirm`, { token, new_password: newPassword });
        return response.data;
    }
};

export default userService;
