import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/official-whatsapp`;

export interface Template {
    id: number;
    busi_user_id: string;
    template_name: string;
    template_status: string;
    category: string;
    language: string;
    content: string;
    meta_template_id?: string;
    created_at: string;
    updated_at: string;
}

export interface CreateTemplateRequest {
    template_name: string;
    category: string;
    language: string;
    content: string;
    meta_template_id?: string;
}

export interface SyncResult {
    success: boolean;
    message: string;
    data?: { count: number };
    error_message?: string;
}

const templatesService = {
    getTemplates: async (token: string): Promise<Template[]> => {
        const response = await axios.get(`${API_URL}/config/templates`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        // Ensure we always return an array
        const data = response.data;
        return Array.isArray(data) ? data : [];
    },

    createTemplate: async (token: string, templateData: CreateTemplateRequest): Promise<Template> => {
        const response = await axios.post(`${API_URL}/config/templates`, templateData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    syncTemplates: async (token: string): Promise<SyncResult> => {
        const response = await axios.post(`${API_URL}/config/sync-templates`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default templatesService;
