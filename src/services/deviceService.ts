import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL.replace('/api', '');

export interface Device {
    device_id: string; // UUID serialized as string
    busi_user_id: string; // UUID serialized as string
    device_name: string;
    device_type: string;
    session_status: 'created' | 'qr_ready' | 'qr_generated' | 'connected' | 'disconnected' | 'pending' | 'expired' | 'orphaned' | 'disabled' | 'logged_out';
    qr_last_generated?: string;
    last_active?: string;
    created_at: string;
    is_active?: boolean;
    disconnected_at?: string;
    is_official?: boolean;
}

export interface DeviceSession {
    session_id: string;
    device_id: string;
    session_token: string;
    is_valid: boolean;
    expires_at: string;
    created_at: string;
}

export const deviceService = {
    getDevices: async (status?: string) => {
        try {
            const response = await axios.get(`${API_URL}/api/devices/`, {
                params: { session_status: status }
            });
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch devices:', error);
            throw error;
        }
    },

    // 🔥 NEW: Get only official devices
    getOfficialDevices: async (page: number = 1, size: number = 20) => {
        try {
            const response = await axios.get(`${API_URL}/api/devices/official/list`, {
                params: { page, size }
            });
            return response.data.devices || [];
        } catch (error) {
            console.error('Failed to fetch official devices:', error);
            throw error;
        }
    },

    // 🔥 NEW: Get only unofficial devices
    getUnofficialDevices: async (sync: boolean = false, page: number = 1, size: number = 20) => {
        try {
            const response = await axios.get(`${API_URL}/api/devices/unofficial/list`, {
                params: { sync, page, size }
            });
            return response.data.devices || [];
        } catch (error) {
            console.error('Failed to fetch unofficial devices:', error);
            throw error;
        }
    },

    // 🔥 NEW: Get connected unofficial devices for Manage Replies
    getConnectedUnofficialDevices: async () => {
        try {
            const response = await axios.get(`${API_URL}/api/devices/unofficial/connected`);
            return response.data.devices || [];
        } catch (error) {
            console.error('Failed to fetch connected unofficial devices:', error);
            throw error;
        }
    },

    addDevice: async (deviceName: string, deviceType: string = 'web') => {
        try {
            const response = await axios.post(`${API_URL}/api/devices/register`, {
                device_name: deviceName,
                device_type: deviceType
            });
            return response.data;
        } catch (error: any) {
            // Handle device limit errors specifically
            if (error.response?.status === 400) {
                const errorMessage = error.response.data?.detail || '';
                if (errorMessage.includes('Device limit reached')) {
                    throw new Error(errorMessage);
                }
            }
            throw error;
        }
    },

    logoutDevice: async (deviceId: string) => {
        try {
            const response = await axios.delete(`${API_URL}/api/devices/${deviceId}`);
            return response.data;
        } catch (error) {
            console.error('Failed to logout device:', error);
            throw error;
        }
    },

    deleteDevice: async (deviceId: string) => {
        // Legacy method - use logoutDevice instead
        console.warn('deleteDevice is deprecated, use logoutDevice instead');
        return await deviceService.logoutDevice(deviceId);
    },

    healOrphanedDevices: async () => {
        try {
            const response = await axios.post(`${API_URL}/api/devices/heal/orphaned`);
            return response.data;
        } catch (error) {
            console.error('Failed to heal devices:', error);
            throw error;
        }
    },

    startDevice: async (deviceId: string) => {
        // 🔥 CRITICAL: Prevent duplicate /start calls with debouncing
        const startKey = `start_${deviceId}`;
        const now = Date.now();
        
        // Check if we recently called start for this device (within 10 seconds)
        const lastStart = (window as any)[startKey];
        if (lastStart && (now - lastStart) < 10000) {
            console.warn(`⏸️ Start request blocked for ${deviceId} - too soon after last request`);
            throw new Error('START_COOLDOWN: Please wait before starting another session');
        }
        
        // Record this start attempt
        (window as any)[startKey] = now;
        
        try {
            const response = await axios.post(`${API_URL}/api/devices/${deviceId}/start`);
            return response.data;
        } catch (error) {
            // Clear start attempt on error
            delete (window as any)[startKey];
            console.error('Failed to start device session:', error);
            throw error;
        }
    },

    getQRCode: async (deviceId: string, userId: string) => {
        try {
            const response = await axios.get(`${API_URL}/api/devices/${deviceId}/qr`);
            return response.data;
        } catch (error) {
            // Let the component handle 429 (Cooldown), 409 (Connected), 502 (Engine Error)
            throw error;
        }
    },

    // 🔥 NEW: QR lifecycle management with proper caching and cooldown handling
    getQRCodeOnce: async (deviceId: string, userId: string) => {
        try {
            const response = await axios.get(`${API_URL}/api/devices/${deviceId}/qr`);
            return response.data;
        } catch (error: any) {
            // Handle specific error cases
            if (error.response?.status === 429) {
                const retryAfter = error.response.data?.retry_after || 30;
                throw new Error(`QR generation cooldown active. Retry in ${retryAfter}s`);
            }
            if (error.response?.status === 502) {
                const errorData = error.response.data;
                if (errorData.detail?.includes('ENGINE_NOT_READY')) {
                    throw new Error('Engine not ready - check configuration');
                }
            }
            throw error;
        }
    },

    // 🔥 NEW: Smart QR polling with lifecycle management
    pollQRWithLifecycle: async (deviceId: string, userId: string, callbacks: {
        onQRReceived?: (qrData: any) => void;
        onDeviceConnected?: () => void;
        onError?: (error: string) => void;
        onStatusUpdate?: (status: string) => void;
    } = {}) => {
        const {
            onQRReceived,
            onDeviceConnected,
            onError,
            onStatusUpdate
        } = callbacks;

        let pollCount = 0;
        const maxPolls = 15; // Maximum polls to prevent infinite loops
        const pollInterval = 5000; // 5 seconds between polls

        const poll = async (): Promise<void> => {
            try {
                pollCount++;
                onStatusUpdate?.(`Checking device status... (${pollCount}/${maxPolls})`);

                // First try to get QR (will use cache if available)
                const qrResponse = await axios.get(`${API_URL}/api/devices/${deviceId}/qr`);

                if (qrResponse.status === 200) {
                    const qrData = qrResponse.data;

                    // Check if QR is cached or fresh
                    if (qrData.qr_code || qrData.qr) {
                        onStatusUpdate?.('QR code received');
                        onQRReceived?.(qrData);

                        // Continue polling to check if device gets connected
                        setTimeout(() => {
                            if (pollCount < maxPolls) {
                                poll();
                            } else {
                                onError?.('Maximum polling attempts reached');
                            }
                        }, pollInterval);
                        return;
                    }

                    // Check if device is already connected
                    if (qrData.status === 'connected') {
                        onStatusUpdate?.('Device already connected');
                        onDeviceConnected?.();
                        return;
                    }
                }

                // If we haven't received QR or connected yet, continue polling
                if (pollCount < maxPolls) {
                    setTimeout(() => poll(), pollInterval);
                } else {
                    onError?.('QR polling timeout - please try again');
                }

            } catch (error: any) {
                if (error.response?.status === 429) {
                    const retryAfter = error.response.data?.retry_after || 30;
                    onStatusUpdate?.(`Rate limited. Retrying in ${retryAfter}s...`);
                    setTimeout(() => poll(), retryAfter * 1000);
                    return;
                }

                if (error.response?.status === 409) {
                    onStatusUpdate?.('Device already connected');
                    onDeviceConnected?.();
                    return;
                }

                onError?.(error.message || 'QR polling failed');
            }
        };

        return poll();
    },

    // 🔥 NEW: Device status monitoring for lifecycle management
    monitorDeviceStatus: async (deviceId: string, callbacks: {
        onConnected?: () => void;
        onDisconnected?: () => void;
        onError?: (error: string) => void;
    } = {}) => {
        const { onConnected, onDisconnected, onError } = callbacks;

        const checkStatus = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/devices/${deviceId}/connected`);
                const isConnected = response.data.connected;

                if (isConnected) {
                    onConnected?.();
                } else {
                    onDisconnected?.();
                }
            } catch (error: any) {
                onError?.(error.message || 'Status check failed');
            }
        };

        return checkStatus();
    },

    reconnectDevice: async (deviceId: string) => {
        try {
            const response = await axios.post(`${API_URL}/api/devices/${deviceId}/disconnect`);
            return response.data;
        } catch (error) {
            console.error('Failed to reconnect device:', error);
            throw error;
        }
    },

    sendMessage: async (userId: string, receiver: string, text: string, deviceId?: string) => {
        const payload: any = {
            user_id: userId,
            receiver_number: receiver,
            message_text: text
        };

        if (deviceId) {
            payload.device_id = deviceId;
        }

        const response = await axios.post(`${API_URL}/api/unified/send-message`, payload);
        return response.data;
    }
};
