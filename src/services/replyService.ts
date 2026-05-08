import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

// Helper to get headers
const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {};
    const token = localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        (JSON.parse(localStorage.getItem('user') || '{}').token);
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export interface InboxMessage {
    id: string;
    device_id: string;
    phone_number: string;
    contact_name?: string;  // Contact name from WhatsApp
    incoming_message: string;
    incoming_time: string;
    is_replied: boolean;
    is_outgoing: boolean;       // true = WE sent this message
    reply_message?: string;
    reply_time?: string;
    device_name?: string;
    is_incoming?: boolean;
    unread?: boolean;
}

export interface DeviceInfo {
    device_id: string;
    device_name: string;
    session_status: string;
    is_connected: boolean;
    unread_count?: number;
    message_count?: number;
}

export const replyService = {
    getInbox: async (deviceId?: string): Promise<InboxMessage[]> => {
        const url = deviceId
            ? `${API_URL}/replies?device_id=${deviceId}`
            : `${API_URL}/replies`;
        try {
            const response = await axios.get(url, { headers: getAuthHeaders() });
            // Handle wrapper object { success: true, data: [...] }
            const data = response.data?.data || response.data;
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Error in getInbox service:", error);
            return [];
        }
    },

    getChatSummary: async (deviceId?: string): Promise<any[]> => {
        const url = deviceId
            ? `${API_URL}/replies/chat-summary?device_id=${deviceId}`
            : `${API_URL}/replies/chat-summary`;
        try {
            const response = await axios.get(url, { headers: getAuthHeaders() });
            return response.data.data || [];
        } catch (error) {
            console.error("Error fetching chat summary:", error);
            return [];
        }
    },

    getActiveDevices: async (): Promise<DeviceInfo[]> => {
        const response = await axios.get(`${API_URL}/replies/active-devices`, { headers: getAuthHeaders() });
        return response.data.data || [];
    },

    sendReply: async (messageId: string, phone: string, deviceId: string, text: string) => {
        const response = await axios.post(
            `${API_URL}/replies/send`,
            {
                message_id: messageId,
                phone: phone,
                device_id: deviceId,
                reply_text: text
            },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    markAsRead: async (phoneNumber: string, deviceId?: string) => {
        const response = await axios.post(`${API_URL}/replies/mark-read`,
            {
                phone_number: phoneNumber,
                device_id: deviceId
            },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    // --- Quick Replies ---
    getQuickReplies: async (): Promise<QuickReply[]> => {
        const response = await axios.get(`${API_URL}/quick-replies`, { headers: getAuthHeaders() });
        return response.data;
    },

    createQuickReply: async (shortcut: string, text: string): Promise<QuickReply> => {
        const response = await axios.post(`${API_URL}/quick-replies`,
            { shortcut, text },
            { headers: getAuthHeaders() }
        );
        return response.data;
    },

    deleteQuickReply: async (id: string) => {
        await axios.delete(`${API_URL}/quick-replies/${id}`, { headers: getAuthHeaders() });
    }
};

export interface QuickReply {
    id: string;
    shortcut: string;
    text: string;
}
