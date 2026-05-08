import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/official-whatsapp/config`;

export interface WhatsAppOfficialConfig {
    business_number: string;
    waba_id: string;
    phone_number_id: string;
    access_token: string;
    template_status: string;
}

export interface OfficialWhatsAppConfigData {
    busi_user_id: string;
    whatsapp_official: WhatsAppOfficialConfig;
    is_active?: boolean;
}

export interface WhatsAppTemplate {
    id: number;
    busi_user_id: string;
    template_name: string;
    template_status: string;
    category: string;
    language: string;
    content: string;
    meta_template_id: string;
    created_at: string;
    updated_at: string;
}

export interface WhatsappApiResponse {
    success: boolean;
    message: string;
    data?: any;
    error_code?: string;
    error_message?: string;
}

export interface WebhookLog {
    id: number;
    busi_user_id: string;
    webhook_event: any;
    event_type: string;
    processed: boolean;
    error_message?: string;
    created_at: string;
}

export const officialWhatsappService = {
    // Create Config
    createConfig: async (data: OfficialWhatsAppConfigData, token: string) => {
        const response = await axios.post(`${API_URL}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get Config
    getConfig: async (token: string) => {
        const response = await axios.get(`${API_URL}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Update Config
    updateConfig: async (data: Partial<OfficialWhatsAppConfigData>, token: string) => {
        const response = await axios.put(`${API_URL}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Sync Templates
    syncTemplates: async (token: string) => {
        const response = await axios.post(`${API_URL}/sync-templates`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get Templates
    getTemplates: async (token: string) => {
        const response = await axios.get(`${API_URL}/templates`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Send Text Message
    sendTextMessage: async (to: string, content: string, token: string) => {
        const response = await axios.post(`${API_URL}/send-text`, {
            to_number: to,
            content: content
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Send Template Message
    sendTemplateMessage: async (to: string, templateName: string, templateData: any, language: string, token: string) => {
        const response = await axios.post(`${API_URL}/send-template`, {
            to_number: to,
            template_name: templateName,
            template_data: templateData,
            language_code: language
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get Business Profile
    getBusinessProfile: async (token: string) => {
        const response = await axios.get(`${API_URL}/business-profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Check Health
    checkHealth: async (token: string) => {
        const response = await axios.get(`${API_URL}/health`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Get Webhook Logs
    getWebhookLogs: async (token: string, limit: number = 50) => {
        const response = await axios.get(`${API_URL}/webhook-logs`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { limit }
        });
        return response.data;
    },

    // Send Media Message (Image / Video / Document)
    sendMediaMessage: async (to: string, file: File | string, caption: string, token: string) => {
        const formData = new FormData();
        formData.append("to_number", to);
        if (typeof file === "string") {
            formData.append("file_path", file);
        } else {
            formData.append("file", file);
        }
        if (caption) {
            formData.append("caption", caption);
        }

        const response = await axios.post(`${API_URL}/send-media`, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                // Do NOT set Content-Type — axios auto-sets multipart boundary
            }
        });
        return response.data;
    }
};

export default officialWhatsappService;
