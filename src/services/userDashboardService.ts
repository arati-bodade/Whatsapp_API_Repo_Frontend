import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/user`;

export const userDashboardService = {
    getDevices: async (token: string) => {
        try {
            // The backend /user/devices endpoint already identifies the user via token.
            // There is no need to pass a manual user ID or call unauthenticated sync endpoints.
            const response = await axios.get(`${API_URL}/devices`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('getDevices error:', error);
            // Return empty array instead of exposing mock data or failing silently
            return [];
        }
    },

    sendUnofficialMessage: async (token: string, receiver: string, message: string) => {
        // First, get the connected device - strictly enforcing WEB/UNOFFICIAL types
        const devices = await userDashboardService.getDevices(token);
        const connectedDevice = devices.find((d: any) =>
            d.session_status === "connected" &&
            d.device_type === "web" // 🔥 STRICT FILTER
        );

        if (!connectedDevice) {
            throw new Error("No connected unofficial device found. Please scan QR code in the Devices tab.");
        }

        // Use authenticated endpoint ONLY
        try {
            const response = await axios.post(`${API_URL}/message/unofficial`, {
                receiver_number: receiver,
                message_text: message,
                device_id: connectedDevice.device_id
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Authenticated message failed:', error);
            // 🔥 REMOVED ENGINE FALLBACK - Fail clearly if backend is down
            throw error;
        }
    },

    getDeliveryReports: async (token: string, startDate?: string, endDate?: string) => {
        const params: any = {};
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const response = await axios.get(`${API_URL}/delivery-reports`, {
            headers: { Authorization: `Bearer ${token}` },
            params
        });
        return response.data;
    }
};
