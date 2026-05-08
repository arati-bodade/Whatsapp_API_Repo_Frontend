import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/audit-logs`;

export interface FieldUpdate {
    field: string;
    previousValue: any;
    newValue: any;
}

export interface AuditLog {
    id: string;
    action_type: string;
    module: string;
    description: string;
    performed_by: {
        id: string;
        name: string;
        role: string;
    };
    affected_user?: {
        id: string;
        name: string;
        email: string;
    };
    timestamp: string;
    created_at: string;
    changes_made?: (string | FieldUpdate)[];
    ip_address?: string;
}

export interface AuditLogResponse {
    total: number;
    filtered: number;
    last_activity_days_ago: number;
    logs: AuditLog[];
}

export const auditLogService = {
    async getLogs(params?: { 
        module?: string, 
        action?: string, 
        search?: string, 
        start_date?: string, 
        end_date?: string,
        limit?: number,
        skip?: number
    }): Promise<AuditLogResponse> {
        const response = await axios.get(`${API_URL}/me`, {
            params
        });
        return response.data;
    }
};
