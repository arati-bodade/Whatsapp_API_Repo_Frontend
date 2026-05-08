/**
 * WhatsApp Service Client
 * Communicates with the integrated WhatsApp engine
 */

import { WHATSAPP_ENGINE_URL } from '@/config/api';

class WhatsAppService {
  constructor() {
    this.baseUrl = WHATSAPP_ENGINE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(error.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('WhatsApp Service Error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Get all sessions
  async getSessions() {
    return this.request('/sessions');
  }

  // Get QR code for device
  async getQR(deviceId) {
    return this.request(`/session/${deviceId}/qr`);
  }

  // Get device status
  async getDeviceStatus(deviceId) {
    return this.request(`/session/${deviceId}/status`);
  }

  // Send message
  async sendMessage(deviceId, to, message, type = 'text') {
    return this.request(`/session/${deviceId}/message`, {
      method: 'POST',
      body: JSON.stringify({ to, message, type }),
    });
  }

  // Reconnect device
  async reconnectDevice(deviceId) {
    return this.request(`/session/${deviceId}/reconnect`, {
      method: 'POST',
    });
  }

  // Poll for QR status
  async pollQR(deviceId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const result = await this.getQR(deviceId);
        
        if (result.status === 'connected') {
          return { success: true, status: 'connected' };
        }
        
        if (result.status === 'qr_ready' && result.qr) {
          return { success: true, status: 'qr_ready', qr: result.qr };
        }
        
        if (result.status === 'generating') {
          // Still generating, wait and try again
          await new Promise(resolve => setTimeout(resolve, interval));
          continue;
        }
        
        // Error status
        return { success: false, error: result.message || 'Unknown error' };
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('QR generation timeout');
  }

  // Wait for connection
  async waitForConnection(deviceId, maxAttempts = 30, interval = 2000) {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const status = await this.getDeviceStatus(deviceId);
        
        if (status.status === 'connected') {
          return { success: true, status: 'connected' };
        }
        
        if (status.status === 'not_found') {
          return { success: false, error: 'Device session not found' };
        }
        
        // Still connecting or QR, wait and try again
        await new Promise(resolve => setTimeout(resolve, interval));
        continue;
        
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    throw new Error('Connection timeout');
  }
}

export const whatsappService = new WhatsAppService();
export default whatsappService;
