import api from '@/config/axios';
import { API_BASE_URL } from '@/config/constants';

// No need for custom interceptors here as @/config/axios already handles 
// token injection and automatic 401 refresh retries.

export interface GoogleSheet {
    id: string; // UUID serialized as string in JSON
    sheet_name: string;
    spreadsheet_id: string;
    worksheet_name: string;
    status: 'ACTIVE' | 'PAUSED' | 'ERROR';
    total_rows: number;
    connected_at: string; // ISO datetime string
    last_synced_at?: string; // ISO datetime string or null
    trigger_enabled: boolean;
    trigger_config?: any;
    user_id?: string | null; // UUID serialized as string or null
    message_template?: string | null;
    created_at?: string | null; // ISO datetime string or null
    updated_at?: string | null; // ISO datetime string or null
    available_sheets?: string[]; // Array of available sheet names
}

export interface TriggerHistory {
    id: string; // UUID serialized as string in JSON
    sheet_id: string; // UUID serialized as string in JSON
    phone_number: string;
    message_content: string;
    status: string;
    triggered_at: string; // ISO datetime string
    error_message?: string | null;
    row_data?: any;
    official_message_id?: string;
}

export interface Trigger {
    trigger_id: string;
    sheet_id?: string;
    device_id?: string;
    trigger_type: string;
    is_enabled: boolean;
    last_triggered_at?: string;
    created_at?: string;
    device_name?: string;
    sheet_name?: string;
    phone_column?: string;
    status_column?: string;
    trigger_column?: string;
    trigger_value?: string;
    message_template?: string;
    send_time_column?: string;
    message_column?: string;
    webhook_url?: string;
    scheduled_at?: string;
    source_type?: string;
    media_url?: string;
    media_type?: string;
    multi_device_ids?: string[];
    multi_templates?: string[];
    trigger_config?: any;
    // 🔥 NEW: Trigger statistics
    total_rows?: number;
    processed_rows?: number;
    completion_status?: string; // "pending", "running", "completed"
}

export const googleSheetService = {
    listSheets: async () => {
        const response = await api.get<GoogleSheet[]>('google-sheets/');
        return response.data;
    },

    connectSheet: async (data: { sheet_name: string, spreadsheet_id: string, worksheet_name?: string }) => {
        const response = await api.post<GoogleSheet>('google-sheets/connect', data);
        return response.data;
    },

    deleteSheet: async (sheetId: string) => {
        const response = await api.delete(`google-sheets/${sheetId}`);
        return response.data;
    },

    fetchRows: async (sheetId: string, worksheetName?: string) => {
        const params = worksheetName ? { worksheet_name: worksheetName } : {};
        const response = await api.get<{ headers: string[], rows: any[] }>(`google-sheets/${sheetId}/rows`, { params });
        return response.data;
    },

    setTrigger: async (sheetId: string, data: {
        trigger_type: string;
        is_enabled: boolean;
        message_template?: string;
        phone_column?: string;
        trigger_column?: string;
        status_column?: string;
        trigger_value?: string;
        schedule_column?: string;
        webhook_url?: string;
        execution_interval?: number;
        send_time_column?: string;
        message_column?: string;
        device_id?: string;
        scheduled_at?: string;
    }) => {
        const payload = {
            sheet_id: sheetId, // Add required sheet_id field
            ...data
        };
        const response = await api.post(`google-sheets/${sheetId}/triggers`, payload);
        return response.data;
    },

    listTriggers: async (sheetId: string) => {
        const response = await api.get(`google-sheets/${sheetId}/triggers`);
        return response.data;
    },

    listAllTriggers: async () => {
        const response = await api.get<Trigger[]>(`google-sheets/triggers/all`);
        return response.data;
    },

    startTrigger: async (triggerId: string) => {
        const response = await api.post(`google-sheets/triggers/${triggerId}/start`);
        return response.data;
    },

    stopTrigger: async (triggerId: string) => {
        const response = await api.post(`google-sheets/triggers/${triggerId}/stop`);
        return response.data;
    },

    deleteTrigger: async (triggerId: string) => {
        const response = await api.delete(`google-sheets/triggers/${triggerId}`);
        return response.data;
    },

    getTriggerHistory: async (sheetId: string) => {
        try {
            // The backend returns a direct array: List[Dict]
            const response = await api.get<TriggerHistory[]>(`google-sheets/${sheetId}/history`);

            // Check if response.data is directly the array
            if (Array.isArray(response.data)) {
                return response.data;
            }

            // Legacy/Fallback check if it's wrapped (unlikely given current backend, but safe to keep)
            const wrapped = response.data as any;
            if (wrapped && Array.isArray(wrapped.data)) {
                return wrapped.data;
            }

            console.warn('Unexpected API response structure for trigger history:', response.data);
            return [];
        } catch (error) {
            console.error('Failed to fetch trigger history:', error);
            return [];
        }
    },


    getAllTriggerHistory: async () => {
        try {
            const response = await api.get<{ data: TriggerHistory[], success: boolean }>('google-sheets/triggers/history');
            return response.data.data || [];
        } catch (error) {
            console.error('Failed to fetch all trigger history:', error);
            return [];
        }
    },

    manualSend: async (data: {
        template_name?: string;
        language_code?: string;
        phone_column: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        selected_rows?: any[];
        sheet_id: string;
        send_all?: boolean;
    }) => {
        const response = await api.post(`google-sheets/${data.sheet_id}/manual-send`, data);
        return response.data;
    },

    // ✅ NEW: Official Template Messaging Methods
    getTemplates: async (sheetId: string) => {
        const response = await api.get(`google-sheets/${sheetId}/templates`);
        return response.data;
    },

    sendOfficialTemplate: async (sheetId: string, data: {
        template_name: string;
        language_code?: string;
        phone_column: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        selected_rows?: any[];
        send_all?: boolean;
    }) => {
        const response = await api.post(`google-sheets/${sheetId}/official-template-send`, data);
        return response.data;
    },

    createOfficialTemplateTrigger: async (sheetId: string, data: {
        trigger_type: string;
        is_enabled?: boolean;
        template_name: string;
        language_code?: string;
        phone_column?: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        trigger_column?: string;
        trigger_value?: string;
        status_column?: string;
        schedule_column?: string;
        webhook_url?: string;
        execution_interval?: number;
    }) => {
        const response = await api.post(`google-sheets/${sheetId}/official-template-triggers`, data);
        return response.data;
    },

    // ✅ NEW: Google Sheet Messaging (supports both text and template)
    sendGoogleSheetMessage: async (sheetId: string, data: {
        mode: 'text' | 'template';
        phone_column: string;
        text_message?: string;
        template_name?: string;
        language_code?: string;
        header_param_columns?: string[];
        body_param_columns?: string[];
        button_param_columns?: { [key: string]: string };
        selected_rows?: any[];
        send_all?: boolean;
    }) => {
        const response = await api.post(`google-sheets/${sheetId}/messaging`, data);
        return response.data;
    },

    // ✅ NEW: Get Official Config Status
    getOfficialConfigStatus: async () => {
        const response = await api.get('google-sheets/official-config/status');
        return response.data;
    },

    // ✅ NEW: Verify available worksheets for a connected sheet
    getAvailableWorksheets: async (sheetId: string) => {
        const response = await api.get<string[]>(`google-sheets/${sheetId}/worksheets`);
        return response.data;
    },

    // ✅ NEW: Trigger Polling Control
    getPollingStatus: async () => {
        const response = await api.get<{ is_running: boolean, status: string }>('google-sheets/triggers/polling/status');
        return response.data;
    },

    startPolling: async (interval: number = 30) => {
        const response = await api.post('google-sheets/triggers/polling/start', null, { params: { interval } });
        return response.data;
    },

    stopPolling: async () => {
        const response = await api.post('google-sheets/triggers/polling/stop');
        return response.data;
    },

    fireTriggersNow: async () => {
        const response = await api.post('google-sheets/triggers/polling/fire-now');
        return response.data;
    },

    clearTriggerHistory: async () => {
        const response = await api.delete('google-sheets/triggers/history/clear');
        return response.data;
    },

    createTrigger: async (payload: any) => {
        // This supports both JSON and Multipart (for media upload)
        if (payload instanceof FormData) {
            // Extract sheet_id from FormData payload
            const payloadData = JSON.parse(payload.get('payload') as string);
            const sheetId = payloadData.sheet_id;
            
            // If sheetId exists, use sheet-specific endpoint, otherwise use standalone
            const url = sheetId ? `google-sheets/${sheetId}/triggers` : `google-sheets/triggers`;
            
            const response = await api.post(url, payload, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            return response.data;
        } else {
            const url = payload.sheet_id ? `google-sheets/${payload.sheet_id}/triggers` : `google-sheets/triggers`;
            const response = await api.post(url, payload);
            return response.data;
        }
    }
};
