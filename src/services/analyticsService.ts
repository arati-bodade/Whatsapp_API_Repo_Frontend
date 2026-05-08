import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/reseller-analytics`;

export interface BusinessUserStats {
    user_id: string;
    business_name: string;
    credits_allocated: number;
    credits_used: number;
    credits_remaining: number;
    messages_sent: number;
}

export interface Transaction {
    id: string;
    type: string;
    description: string;
    amount: number;
    date: string;
    status: string;
}

export interface TrafficSourceData {
    name: string;
    value: number;
    percentage: number;
}

export interface ResellerDashboardResponse {
    reseller_id: string;
    total_credits: number;
    used_credits: number;
    remaining_credits: number;
    wallet_balance: number;
    messages_sent: number;
    business_users: BusinessUserStats[];
    recent_transactions: Transaction[];

    // New Sections
    plan_details: {
        plan_type: string;
        expiry: string;
    };
    account_info: {
        user_type: string;
        username: string;
        full_name: string; // Added field
        email: string;
        reseller_id: string;
    };
    traffic_source: TrafficSourceData[];
    graph_data: any[];

    last_updated: string;
}

// Helper to get auth header
const getAuthHeader = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token') || localStorage.getItem('resellerToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const analyticsService = {
    async getResellerDashboard(resellerId: string): Promise<ResellerDashboardResponse> {
        const response = await axios.get(`${API_URL}/dashboard/${resellerId}`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    async regenerateAnalytics(resellerId: string): Promise<ResellerDashboardResponse> {
        const response = await axios.post(`${API_URL}/analytics/${resellerId}`, {}, {
            headers: getAuthHeader()
        });
        return response.data;
    }
};
