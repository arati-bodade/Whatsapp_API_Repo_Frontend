import axiosInstance from "@/config/axios";
import { API_BASE_URL } from "@/config/constants";

export interface ResellerAlert {
    alert_id: string;
    sub_user_id: string;
    sub_user_name: string;
    plan_name: string;
    required_credits: number;
    available_credits: number;
    shortage: number;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    status: "UNRESOLVED" | "RESOLVED";
    attempt_count: number;
    last_attempt_at: string;
    resolved_at: string | null;
    created_at: string;
}

export interface ResellerAlertStats {
    status_counts: Record<string, number>;
    top_sub_users: { name: string; count: number }[];
    top_plans: { name: string; count: number }[];
    lost_revenue_estimation: number;
    total_failed_attempts: number;
}

export interface PaginatedAlerts {
    alerts: ResellerAlert[];
    total: number;
    page: number;
    page_size: number;
}

const resellerAlertService = {
    async getAlerts(params: { 
        status?: string; 
        severity?: string; 
        page?: number; 
        page_size?: number 
    } = {}): Promise<PaginatedAlerts> {
        const response = await axiosInstance.get(`${API_BASE_URL}/reseller/alerts`, { params });
        return response.data;
    },

    async getStats(): Promise<ResellerAlertStats> {
        const response = await axiosInstance.get(`${API_BASE_URL}/reseller/alerts/stats`);
        return response.data;
    },

    async resolveAlert(alertId: string): Promise<{ success: boolean; message: string }> {
        const response = await axiosInstance.post(`${API_BASE_URL}/reseller/alerts/${alertId}/resolve`);
        return response.data;
    }
};

export default resellerAlertService;
