import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/constants';

const API_URL = `${API_BASE_URL}/resellers`;

// interface for Reseller data types
export interface ResellerProfile {
    name: string;
    username: string;
    email: string;
    phone: string;
    password?: string;
    reseller_id?: string;
    role?: string;
    status?: string;
    wallet?: {
        total_credits: number;
        available_credits: number;
        used_credits: number;
    };
    business?: BusinessData;
    address?: AddressData;
    bank?: BankData;
    plan_name?: string;
    plan_expiry?: string;
}

export interface BusinessData {
    business_name?: string;
    organization_type?: string;
    business_description?: string;
    erp_system?: string;
    gstin?: string;
}

export interface AddressData {
    full_address?: string;
    pincode?: string;
    country?: string;
}

export interface BankData {
    bank_name?: string;
}

export interface ResellerRegisterData {
    profile: ResellerProfile;
    business?: BusinessData;
    address?: AddressData;
    bank?: BankData;
}

export interface ResellerLoginData {
    email: string;
    password: string;
}

const resellerService = {
    register: async (data: ResellerRegisterData) => {
        const response = await axios.post(`${API_URL}/register`, data);
        return response.data;
    },

    login: async (data: ResellerLoginData) => {
        const response = await axios.post(`${API_URL}/login`, data);
        return response.data;
    },

    getProfile: async (token: string) => {
        const response = await axios.get(`${API_URL}/me`, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
        return response.data;
    },

    updateProfile: async (token: string, data: any) => {
        const response = await axios.put(`${API_URL}/me`, data, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
        return response.data;
    },

    changePassword: async (token: string, data: any) => {
        // Calling /api/auth/change-password endpoint
        // Since API_URL is /api/resellers, we need to construct the URL correctly.
        // The backend uses API_BASE_URL
        const AUTH_API_URL = `${API_BASE_URL}/auth`;
        const response = await axios.post(`${AUTH_API_URL}/change-password`, data, {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true
        });
        return response.data;
    }
};

export default resellerService;
