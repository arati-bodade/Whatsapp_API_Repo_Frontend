"use client";

import React, { useEffect, useState, useRef } from "react";
import { deviceService } from "@/services/deviceService";

interface QRCodeDisplayProps {
  deviceId: string;
  userId: string;
  onScanSuccess: (token: string) => void;
}

export default function QRCodeDisplay({
  deviceId,
  userId,
  onScanSuccess,
}: QRCodeDisplayProps) {
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string>("initializing");
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onScanSuccessRef = useRef(onScanSuccess);

  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    isMounted.current = true;

    let hasStarted = false;

    const scheduleNext = (delay: number) => {
      if (!isMounted.current) return;
      timeoutRef.current = setTimeout(fetchQR, delay);
    };

    const handleConnected = () => {
      setStatus("connected");
      setLoading(false);
      setQrBase64(null);
      setRetryCount(0);
      onScanSuccessRef.current("real_connection_success");
    };

    const fetchQR = async () => {
      if (!isMounted.current) return;

      try {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (!qrBase64) setLoading(true);
        setError(null);

        // START SESSION FIRST
        if (!hasStarted) {
          try {
            await deviceService.startDevice(deviceId);
          } catch (e) {
            console.warn("Failed to start device session, continuing anyway", e);
          }
          hasStarted = true;
        }

        const data = await deviceService.getQRCode(deviceId, userId);

        if (!isMounted.current) return;

        console.log(' QR Response:', data);

        // CONNECTED
        if (data.status === "connected") {
          console.log(' Device already connected');
          handleConnected();
          return;
        }

        // QR READY (primary state)
        if ((data.status === "ready" || data.status === "qr_ready" || data.status === "qr_generated") && data.qr_code) {
          console.log(' QR Code ready for scanning');
          setQrBase64(data.qr_code);
          setStatus("scannable");
          setLoading(false);
          setRetryCount(0);
          scheduleNext(3000); // KEEP POLLING while waiting for scan
          return;
        }

        // Pending/connecting states - keep polling
        if (
          data.status === "pending" ||
          data.status === "initializing" ||
          data.status === "connecting" ||
          data.status === "created"
        ) {
          console.log(' Device in pending state:', data.status);
          setStatus("initializing");
          scheduleNext(2000); // Poll every 2 seconds as requested
          return;
        }

        // DISCONNECTED during QR scan flow - this is TRANSIENT
        // Baileys fires close→reconnect→open during QR handshake
        // Keep polling - do NOT stop here
        if (data.status === "disconnected") {
          console.log(' Device disconnected (may be transient during QR scan), continuing to poll...');
          setStatus("initializing");
          scheduleNext(2500);
          return;
        }

        // LOGGED OUT state
        if (data.status === "logged_out") {
          console.log(' Device logged out');
          setQrBase64(null);
          setStatus("logged_out");
          setLoading(false);
          return; // Stop polling completely
        }

        // Cooldown
        if (data.status === "cooldown") {
          console.log(' Device in cooldown state');
          scheduleNext(3000);
          return;
        }

        // Direct QR fallback
        if (data.qr_code && !data.status) {
          console.log(' Direct QR fallback');
          setQrBase64(data.qr_code);
          setStatus("scannable");
          setLoading(false);
          setRetryCount(0);
          scheduleNext(3000); // KEEP POLLING
          return;
        }

        // Fallback retry
        console.log(' Unknown status, retrying...');
        scheduleNext(2000);
      } catch (err: any) {
        if (!isMounted.current) return;

        console.error(' QR fetch error:', err);
        setLoading(false);

        const responseStatus = err.response?.status;
        const errorMessage = err.response?.data?.message || err.message;

        if (responseStatus === 409) {
          console.log('Device already connected');
          handleConnected();
          return;
        }

        // Handle QR cooldown errors
        if (errorMessage?.includes('QR_REQUEST_COOLDOWN')) {
          console.log('QR request cooldown, waiting...');
          scheduleNext(6000); // Wait longer for cooldown
          return;
        }

        if (responseStatus === 410) {
          setError("Device logged out. Please refresh or create a new device.");
          return;
        }

        if (responseStatus === 404) {
          setError("Device not found.");
          return;
        }

        if (
          responseStatus === 429 ||
          responseStatus === 502 ||
          responseStatus === 503 ||
          responseStatus === 500
        ) {
          console.log(' Server error, retrying...');
          scheduleNext(5000);
          return;
        }

        if (retryCount > 10) {
          setError(`Connection failed: ${errorMessage || 'Unknown error'}. Please try again.`);
          return;
        }

        setRetryCount((prev) => prev + 1);
        scheduleNext(5000);
      }
    };

    fetchQR();

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [deviceId, userId]);

  // UI STATES

  const getValidImgSrc = (qr: string | null): string | null => {
    if (!qr) return null;
    if (qr.startsWith("qr_code_placeholder_")) return null;
    if (qr.startsWith("data:image/")) return qr;

    // Basic sanity check for valid base64 string
    if (/^[A-Za-z0-9+/=]+$/.test(qr) && qr.length > 20) {
      return `data:image/png;base64,${qr}`;
    }

    return null;
  };

  const imgSrc = getValidImgSrc(qrBase64);

  if (status === "initializing" && loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 w-64 h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
        <p className="text-gray-500 font-medium">Initializing Connection...</p>
      </div>
    );
  }

  if (status === "connected") {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 w-64 h-64">
        <div className="text-[#00a884] font-bold text-2xl flex flex-col items-center gap-2">
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Connected
        </div>
        <p className="text-gray-500">Redirecting...</p>
      </div>
    );
  }

  if (status === "logged_out") {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4 bg-red-50 p-6 rounded-xl border border-red-200">
        <div className="text-red-600 font-bold text-lg text-center">
          Device logged out from mobile device. Please reconnect.
        </div>
        <p className="text-sm text-red-500 text-center max-w-sm">
          You requested a logout from your WhatsApp app. You will need to refresh this page and generate a new QR code to link again.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10 px-4">
        {error}
      </div>
    );
  }

  return (
    <div className="relative">
      {imgSrc ? (
        <img
          src={imgSrc}
          alt="WhatsApp QR"
          className="w-64 h-64 object-contain border-0"
        />
      ) : (
        <div className="w-64 h-64 bg-gray-50 flex items-center justify-center text-gray-400 border-0">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
            <div className="text-sm">
              {qrBase64?.startsWith("qr_code_placeholder_")
                ? "Connecting..."
                : "Loading QR..."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
