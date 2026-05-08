import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL;

export interface Group {
    group_id: string;
    name: string;
    contact_count: number;
    description?: string;
}

export interface SendMessageResponse {
    success: boolean;
    total_groups: number;
    total_contacts: number;
    sent: number;
    failed: number;
}

export interface ContactItem {
    name: string;
    phone: string;
}

const groupService = {
    getGroups: async (token: string): Promise<Group[]> => {
        const response = await axios.get(`${API_URL}/groups/`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    createGroup: async (token: string, name: string, description?: string): Promise<Group> => {
        const response = await axios.post(`${API_URL}/groups/create`,
            { name, description },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    getGroupContacts: async (token: string, groupId: string): Promise<ContactItem[]> => {
        const response = await axios.get(`${API_URL}/groups/${groupId}/contacts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    addContacts: async (token: string, groupId: string, contacts: ContactItem[]): Promise<any> => {
        const response = await axios.post(`${API_URL}/groups/${groupId}/contacts`,
            { contacts },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    sendMessage: async (token: string, groupIds: string[], message: string = "", channel: 'unofficial' | 'official' = 'unofficial', templateName?: string, templateData?: any, language: string = "en_US"): Promise<SendMessageResponse> => {
        // Ensure token is clean
        const cleanToken = token.trim().replace(/^Bearer\s+/i, '');

        const payload: any = { group_ids: groupIds, channel };
        if (message) payload.message = message;
        if (templateName) payload.template_name = templateName;
        if (templateData) payload.template_data = templateData;
        if (language) payload.language_code = language;

        const response = await axios.post(`${API_URL}/groups/send-message`,
            payload,
            {
                headers: {
                    'Authorization': `Bearer ${cleanToken}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    },

    deleteGroup: async (token: string, groupId: string): Promise<any> => {
        const response = await axios.delete(`${API_URL}/groups/${groupId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    deleteContact: async (token: string, groupId: string, phone: string): Promise<any> => {
        const response = await axios.delete(`${API_URL}/groups/${groupId}/contacts/${phone}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    scanWhatsAppGroups: async (token: string, deviceId: string): Promise<any> => {
        const response = await axios.get(`${API_URL}/groups/whatsapp/scan?device_id=${deviceId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    exportGroupMembers: async (token: string, deviceId: string, groupName: string): Promise<any> => {
        const response = await axios.post(`${API_URL}/groups/whatsapp/export`,
            { device_id: deviceId, group_name: groupName },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    }
};

export default groupService;
