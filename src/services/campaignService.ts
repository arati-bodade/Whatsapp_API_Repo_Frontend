import axios from '@/config/axios';

// Try to use environment variable, fallback to localhost for development
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
};

export interface CampaignCreateRequest {
    sheet_id: string;
    name?: string;
    device_ids: string[];
    templates: {
        content: string;
        media_url?: string;
        media_type?: string;
        delay_override?: number
    }[];
    warm_mode?: boolean;
    scheduled_at?: string;
}

export const campaignService = {
    listCampaigns: async (skip: number = 0, limit: number = 100) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/campaign/?skip=${skip}&limit=${limit}`, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to list campaigns');
        }
    },

    createCampaign: async (data: CampaignCreateRequest | FormData) => {
        try {
            const isFormData = data instanceof FormData;
            const headers = getAuthHeaders().headers;

            const response = await axios.post(
                `${API_BASE_URL}/api/campaign/create`,
                data,
                {
                    headers: {
                        ...headers,
                        'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to create campaign');
        }
    },

    startCampaign: async (campaignId: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/campaign/${campaignId}/start`, {}, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to start campaign');
        }
    },

    pauseCampaign: async (campaignId: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/campaign/${campaignId}/pause`, {}, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to pause campaign');
        }
    },

    resumeCampaign: async (campaignId: string) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/api/campaign/${campaignId}/resume`, {}, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to resume campaign');
        }
    },

    getCampaignStatus: async (campaignId: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/campaign/${campaignId}/status`, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to get campaign status');
        }
    },

    getCampaignLogs: async (campaignId: string) => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/campaign/${campaignId}/logs`, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to get campaign logs');
        }
    },
    deleteCampaign: async (campaignId: string) => {
        try {
            const response = await axios.delete(`${API_BASE_URL}/api/campaign/${campaignId}`, getAuthHeaders());
            return response.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || 'Failed to delete campaign');
        }
    }
};
