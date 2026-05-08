import api from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

// No need for custom interceptors here as @/config/axios already handles 
// token injection and automatic 401 refresh retries.

export const googleSheetUnofficialService = {
    // Text Only
    sendBulkMessages: async (deviceId: string, deviceName: string, messages: { number: string, message: string }[]) => {
        try {
            const payload = {
                id: deviceId,
                name: deviceName,
                messages: messages
            };
            const response = await api.post('unofficial/bulk-send-messages', payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        } catch (error: any) {
            console.error("Bulk Send Text Failed", error);
            throw new Error(error.userMessage || error.message || 'Failed to send bulk messages');
        }
    },

    // File Only
    sendBulkFiles: async (deviceId: string, deviceName: string, file: File, numbers: string[]) => {
        try {
            const formData = new FormData();
            formData.append('device_id', deviceId);
            formData.append('device_name', deviceName);
            formData.append('file', file);

            numbers.forEach(num => {
                formData.append('recipients', num);
            });

            const response = await api.post('unofficial/bulk-send-files', formData);
            return response.data;
        } catch (error: any) {
            console.error("Bulk Send Files Failed", error);
            throw new Error(error.userMessage || error.message || 'Failed to send bulk files');
        }
    },

    // File + Text
    sendBulkFilesWithText: async (deviceId: string, deviceName: string, file: File, messageText: string, numbers: string[]) => {
        try {
            const formData = new FormData();
            formData.append('device_id', deviceId);
            formData.append('device_name', deviceName);
            formData.append('file', file);
            formData.append('text', messageText);

            numbers.forEach(num => {
                formData.append('recipients', num);
            });

            const response = await api.post('unofficial/bulk-send-files-with-text', formData);
            return response.data;
        } catch (error: any) {
            console.error("Bulk Send Files with Text Failed", error);
            throw new Error(error.userMessage || error.message || 'Failed to send bulk files with text');
        }
    },

    // Dynamic Router
    sendDynamic: async (
        deviceId: string,
        deviceName: string,
        numbers: string[],
        messageTexts: string[], // mapped messages for each number
        file: File | null,
        commonMessageText: string // The template message with variables replaced, or just text
    ) => {
        if (!deviceId || !deviceName) {
            throw new Error("Device ID and Name are required");
        }

        if (numbers.length === 0) {
            throw new Error("No valid phone numbers provided");
        }

        if (file && commonMessageText) {
            return await googleSheetUnofficialService.sendBulkFilesWithText(
                deviceId, deviceName, file, commonMessageText, numbers
            );
        } else if (file && !commonMessageText) {
            return await googleSheetUnofficialService.sendBulkFiles(
                deviceId, deviceName, file, numbers
            );
        } else {
            // Text only needs {number, message} format
            const messages = numbers.map((num, i) => ({
                number: num,
                message: messageTexts[i] || commonMessageText
            }));
            return await googleSheetUnofficialService.sendBulkMessages(
                deviceId, deviceName, messages
            );
        }
    }
};
