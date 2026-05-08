/**
 * React Hook for WhatsApp Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { whatsappService } from '@/services/whatsapp';

export const useWhatsApp = (deviceId) => {
  const [status, setStatus] = useState('disconnected');
  const [qr, setQr] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check device status
  const checkStatus = useCallback(async () => {
    if (!deviceId) return;
    
    try {
      const result = await whatsappService.getDeviceStatus(deviceId);
      setStatus(result.status);
      setIsConnected(result.status === 'connected');
      setError(null);
    } catch (err) {
      setError(err.message);
      setStatus('error');
      setIsConnected(false);
    }
  }, [deviceId]);

  // Initialize session and get QR
  const initializeSession = useCallback(async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await whatsappService.pollQR(deviceId);
      
      if (result.status === 'connected') {
        setStatus('connected');
        setIsConnected(true);
        setQr(null);
      } else if (result.status === 'qr_ready') {
        setStatus('qr_ready');
        setIsConnected(false);
        setQr(result.qr);
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Send message
  const sendMessage = useCallback(async (to, message, type = 'text') => {
    if (!deviceId || !isConnected) {
      throw new Error('Device not connected');
    }
    
    try {
      const result = await whatsappService.sendMessage(deviceId, to, message, type);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [deviceId, isConnected]);

  // Reconnect device
  const reconnect = useCallback(async () => {
    if (!deviceId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await whatsappService.reconnectDevice(deviceId);
      
      // Wait for reconnection
      const result = await whatsappService.waitForConnection(deviceId);
      
      if (result.success) {
        setStatus('connected');
        setIsConnected(true);
        setQr(null);
      }
    } catch (err) {
      setError(err.message);
      setStatus('error');
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [deviceId]);

  // Auto-check status periodically
  useEffect(() => {
    if (!deviceId) return;
    
    const interval = setInterval(() => {
      checkStatus();
    }, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [deviceId, checkStatus]);

  // Initial status check
  useEffect(() => {
    if (deviceId) {
      checkStatus();
    }
  }, [deviceId, checkStatus]);

  return {
    status,
    qr,
    isLoading,
    error,
    isConnected,
    initializeSession,
    sendMessage,
    reconnect,
    checkStatus,
  };
};

export default useWhatsApp;
