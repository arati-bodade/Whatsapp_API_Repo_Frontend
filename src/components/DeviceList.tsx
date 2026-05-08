"use client";

import React, { useEffect, useState } from 'react';
import { deviceService, Device } from '@/services/deviceService';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getErrorMessage } from '@/utils/error';
import { useModal } from '@/context/ModalContext';
import { API_BASE_URL } from '@/config/api';
import { 
    Plus, 
    RefreshCw, 
    Trash2, 
    QrCode, 
    Smartphone, 
    CheckCircle2, 
    AlertCircle, 
    ExternalLink, 
    ShieldCheck, 
    Activity,
    Info,
    X,
    ChevronRight,
    Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeviceList({ userId }: { userId: string }) {
    const [unofficialDevices, setUnofficialDevices] = useState<Device[]>([]);
    const [officialDevices, setOfficialDevices] = useState<Device[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [activeActionDeviceId, setActiveActionDeviceId] = useState<string | null>(null);
    const { showAlert, showConfirm } = useModal();

    // Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newDeviceName, setNewDeviceName] = useState("");
    
    // API URL for monitoring endpoints
    const API_URL = API_BASE_URL.replace('/api', '');

    const fetchDevices = async () => {
        try {
            setLoading(true);

            // 🔥 FIXED: Use separate endpoints for strict device type filtering with force sync
            const [unofficial, official] = await Promise.all([
                deviceService.getUnofficialDevices(true), // Force sync to get latest status
                deviceService.getOfficialDevices()
            ]);

            setUnofficialDevices(unofficial);
            setOfficialDevices(official);
        } catch (error) {
            console.error("Failed to fetch devices", getErrorMessage(error));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchDevices();
        }
    }, [userId]);

    // 🔥 ENHANCED: Improved polling with stability checks and debouncing
    useEffect(() => {
        if (!userId) return;

        // Monitor all devices for any status changes, not just logout
        const allDeviceIds = unofficialDevices.map(d => d.device_id);

        if (allDeviceIds.length === 0) return;

        // 🔥 ENHANCED: Track status history for stability
        const statusHistory: Record<string, Array<{status: string, timestamp: number}>> = {};
        
        const intervalId = setInterval(async () => {
            try {
                // 🔥 FIXED: Reduced polling frequency from 5s to 20s to prevent backend overload
                const unofficial = await deviceService.getUnofficialDevices(false); // false = no force sync

                let statusChanged = false;
                let criticalChange = false;

                // 🔥 ENHANCED: Add stability check - only update if status is stable for 2 consecutive polls
                const stableChanges: Array<{device: Device, oldStatus: string, newStatus: string}> = [];
                
                for (const oldDevice of unofficialDevices) {
                    const latestDevice = unofficial.find((d: Device) => d.device_id === oldDevice.device_id);
                    
                    if (latestDevice && latestDevice.session_status !== oldDevice.session_status) {
                        // 🔥 ENHANCED: Initialize status history if needed
                        if (!statusHistory[latestDevice.device_id]) {
                            statusHistory[latestDevice.device_id] = [];
                        }
                        
                        // Add current status to history
                        statusHistory[latestDevice.device_id].push({
                            status: latestDevice.session_status,
                            timestamp: Date.now()
                        });
                        
                        // Keep only last 3 entries
                        if (statusHistory[latestDevice.device_id].length > 3) {
                            statusHistory[latestDevice.device_id].shift();
                        }
                        
                        // 🔥 ENHANCED: Check for status stability
                        const history = statusHistory[latestDevice.device_id];
                        const isStable = history.length >= 2 && 
                                       history[history.length - 1].status === history[history.length - 2].status;
                        
                        // 🔥 FIXED: Ignore rapid status thrashing between connected/disconnected
                        const isThrashing = (
                            (oldDevice.session_status === 'connected' && latestDevice.session_status === 'disconnected') ||
                            (oldDevice.session_status === 'disconnected' && latestDevice.session_status === 'connected')
                        );
                        
                        // Only update if status is stable and not thrashing
                        if (isStable && !isThrashing) {
                            stableChanges.push({
                                device: latestDevice,
                                oldStatus: oldDevice.session_status,
                                newStatus: latestDevice.session_status
                            });

                            // 🔥 FIXED: Mark critical changes for immediate UI update
                            if (latestDevice.session_status === 'connected' || latestDevice.session_status === 'logged_out') {
                                criticalChange = true;
                            } else {
                                statusChanged = true;
                            }
                        } else if (isThrashing) {
                            console.warn(`⚠️ Status thrashing detected for device ${latestDevice.device_id}: ${oldDevice.session_status} -> ${latestDevice.session_status}`);
                        } else if (!isStable) {
                            console.log(`⏳ Status not yet stable for device ${latestDevice.device_id}: ${latestDevice.session_status}`);
                        }
                    }
                }

                // 🔥 FIXED: Only update UI if there are stable changes
                if (stableChanges.length > 0) {
                    console.log(`🔄 Updating ${stableChanges.length} devices with stable status changes`);
                    setUnofficialDevices(unofficial);
                    
                    if (criticalChange) {
                        // Force immediate refresh for critical changes
                        setTimeout(fetchDevices, 1000);
                    }
                }

                if (statusChanged && stableChanges.length > 0) {
                    // Update state to reflect new statuses
                    console.log('🔄 Stable device status changes:', stableChanges);
                    
                    // If critical change, also refresh official devices
                    if (criticalChange) {
                        try {
                            const official = await deviceService.getOfficialDevices();
                            setOfficialDevices(official);
                        } catch (err) {
                            console.warn('Failed to refresh official devices:', err);
                        }
                    }
                }
            } catch (error) {
                console.warn('Device status polling error:', error);
                // 🔥 FIXED: Don't show alerts for polling errors to reduce noise
            }
        }, 20000); // 🔥 FIXED: Increased from 5s to 20s to reduce backend load

        return () => clearInterval(intervalId);
    }, [userId, unofficialDevices]);

    const handleAddDevice = () => {
        setNewDeviceName("");
        setShowAddModal(true);
    };

    const submitAddDevice = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeviceName.trim()) return;
        
        setActionLoading(true);

        try {
            console.log("🔧 Creating new device:", { deviceName: newDeviceName });

            await deviceService.addDevice(newDeviceName);
            console.log("✅ Device created successfully");

            setShowAddModal(false);
            // Force refetch to ensure UI reflects DB state immediately
            await fetchDevices();
        } catch (error) {
            console.error("❌ Failed to add device:", error);
            showAlert("Error", `Failed to add device: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(false);
        }
    };

    const handleLogout = async (deviceId: string, deviceName: string) => {
        // 🔥 REQUIREMENT: "Logout = Remove" (Hard Rule)
        showConfirm(
            "Confirm Disconnect",
            `Are you sure you want to disconnect "${deviceName}"? The device will be removed permanently.`,
            async () => {
                try {
                    setActiveActionDeviceId(deviceId);
                    console.log("🗑️ Logging out device:", { deviceId, deviceName });

                    await deviceService.logoutDevice(deviceId);
                    console.log("✅ Device logged out successfully");

                    // Regardless of backend response details, we treat it as removed
                    showAlert("Success", "Device disconnected and removed successfully!");

                    // Force refetch to ensure UI reflects DB state immediately
                    fetchDevices(); // No await needed to speed up UI feedback
                } catch (error: any) {
                    console.error("❌ Logout failed:", error);
                    // Even if it fails (e.g. 404), refresh the list as it might be gone from DB
                    fetchDevices();
                    if (error.response?.status !== 404 && error.response?.status !== 401) {
                        showAlert("Error", `Failed to logout device: ${error.response?.data?.detail || error.response?.data?.error || 'Unknown error'}`);
                    }
                } finally {
                    setActiveActionDeviceId(null);
                }
            }
        );
    };

    const handleHealDevices = async () => {
        try {
            setActionLoading(true);
            const result = await deviceService.healOrphanedDevices();
            showAlert("Heal Results", result.message);
            await fetchDevices();
        } catch (error) {
            console.error("Heal failed:", error);
            showAlert("Error", `Failed to heal devices: ${getErrorMessage(error)}`);
        } finally {
            setActionLoading(false);
        }
    };

    
    const handleReconnect = async (device: Device) => {
        try {
            setActiveActionDeviceId(device.device_id);
            await deviceService.reconnectDevice(device.device_id);
            await fetchDevices();
            showAlert("Success", "Reconnection initiated successfully!");
        } catch (error) {
            console.error("Reconnect failed:", error);
            showAlert("Error", `Failed to reconnect: ${getErrorMessage(error)}`);
        } finally {
            setActiveActionDeviceId(null);
        }
    };

    const handleConnect = async (device: Device) => {
        try {
            setActiveActionDeviceId(device.device_id);
            // 🔥 Force a quick sync with engine before opening QR to see if it's already connected
            console.log("🔄 Syncing status before connection for:", device.device_name);
            
            // Only sync if it's currently disconnected or unknown
            if (device.session_status === 'disconnected' || device.session_status === 'orphaned' || device.session_status === 'expired') {
                await deviceService.getUnofficialDevices(true); // true = force sync
            }
            
            setSelectedDevice(device);
            setShowQR(true);
        } catch (error) {
            console.warn("Sync before connect failed, showing QR anyway", error);
            setSelectedDevice(device);
            setShowQR(true);
        } finally {
            setActiveActionDeviceId(null);
        }
    };

    const handleScanSuccess = async (token: string) => {
        console.log("✅ QR scan successful for device:", selectedDevice?.device_name);
        setShowQR(false);
        setActiveActionDeviceId(null);
        // Force refetch to ensure UI reflects DB state immediately
        await fetchDevices();
        showAlert("Success", "Device Connected Successfully!");
    };

    const StatusPulse = ({ active }: { active: boolean }) => (
        <span className="relative flex h-3 w-3">
            {active && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
        </span>
    );

    const renderDeviceCard = (device: Device) => {
        const isOfficial = device.device_type === 'official';
        const isConnected = device.session_status === 'connected';
        const isCreated = device.session_status === 'created' || device.session_status === 'pending';
        const isQRReady = device.session_status === 'qr_ready' || device.session_status === 'qr_generated';

        return (
            <motion.div
                key={device.device_id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-white p-6 rounded-2xl shadow-sm border border-gray-100/80 hover:shadow-md hover:border-blue-100 transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
                {/* Background Decor */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-[0.03] group-hover:scale-110 transition-transform duration-500 ${isConnected ? 'bg-emerald-500' : 'bg-blue-500'}`} />

                <div className="relative">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-emerald-50' : 'bg-blue-50'}`}>
                                {isOfficial ? (
                                    <ShieldCheck className={`w-6 h-6 ${isConnected ? 'text-emerald-600' : 'text-blue-600'}`} />
                                ) : (
                                    <Smartphone className={`w-6 h-6 ${isConnected ? 'text-emerald-600' : 'text-blue-600'}`} />
                                )}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 text-lg group-hover:text-blue-700 transition-colors">
                                    {device.device_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <StatusPulse active={isConnected} />
                                    <span className={`text-xs font-semibold uppercase tracking-wider ${isConnected ? 'text-emerald-600' : 'text-gray-500'}`}>
                                        {isConnected ? 'Active' : isQRReady ? 'Ready to pair' : isCreated ? 'Setup pending' : 'Offline'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {device.last_active && (
                            <div className="text-right">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Last Sync</span>
                                <span className="text-xs text-gray-600 font-medium">
                                    {new Date(device.last_active).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Type</span>
                            <span className="text-xs font-semibold text-gray-700 capitalize">{device.device_type}</span>
                        </div>
                        <div className="bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">Security</span>
                            <span className="text-xs font-semibold text-gray-700">Encrypted</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 relative">
                    {isOfficial ? (
                        <>
                            <div className="flex-1 flex items-center justify-center gap-2 text-xs font-bold text-blue-700 bg-blue-50/50 rounded-xl border border-blue-100 py-2.5">
                                <Activity className="w-3.5 h-3.5" />
                                Cloud Active
                            </div>
                            <button
                                onClick={() => handleLogout(device.device_id, device.device_name)}
                                disabled={activeActionDeviceId === device.device_id}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 disabled:opacity-40"
                                title="Delete Device"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </>
                    ) : (
                        <>
                            {isConnected ? (
                                <button
                                    onClick={() => showAlert("Manage Device", "Opening device console...")}
                                    disabled={activeActionDeviceId === device.device_id}
                                    className="flex-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-100 py-2.5 rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-sm hover:shadow active:scale-[0.98]"
                                >
                                    <Activity className="w-4 h-4" />
                                    Manage
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleConnect(device)}
                                    disabled={activeActionDeviceId === device.device_id}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl transition-all font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-60"
                                >
                                    <QrCode className="w-4 h-4" />
                                    {activeActionDeviceId === device.device_id ? 'Loading...' : 'Pair Device'}
                                </button>
                            )}

                            <button
                                onClick={() => handleLogout(device.device_id, device.device_name)}
                                disabled={activeActionDeviceId === device.device_id}
                                className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all border border-transparent hover:border-red-100 disabled:opacity-40"
                                title="Delete Device"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 min-h-screen">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-blue-600" />
                        Linked Devices
                    </h2>
                    <p className="text-gray-500 font-medium flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-500" />
                        Manage your active WhatsApp instances
                    </p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleAddDevice}
                        disabled={actionLoading || unofficialDevices.length >= 5}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-blue-200 font-bold text-sm active:scale-95 disabled:opacity-50"
                        title={unofficialDevices.length >= 5 ? "Maximum limit of 5 devices reached" : ""}
                    >
                        {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                        Add Device
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-bold animate-pulse">Initializing Secure Sessions...</p>
                </div>
            ) : (
                <div className="space-y-10">
                    {/* Unofficial Devices Column */}
                    <section>
                        <div className="flex items-center justify-between mb-8 px-2">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-100 p-2 rounded-xl">
                                    <Smartphone className="w-6 h-6 text-blue-700" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">QR Linked Devices</h3>
                                    <p className="text-sm text-gray-500 font-medium">Browser & Web based connections</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-gray-100 shadow-sm border-b-4 border-b-blue-600">
                                <span className="text-2xl font-black text-blue-700 leading-none">{unofficialDevices.length}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">/ 5 Slots</span>
                            </div>
                        </div>

                        {unofficialDevices.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-16 text-center shadow-sm"
                            >
                                <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                                    <Smartphone className="w-12 h-12" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">No Devices Coupled</h3>
                                <p className="text-gray-500 max-w-sm mx-auto mb-8 font-medium leading-relaxed">
                                    Link your WhatsApp account using a QR code to start automating your communications.
                                </p>
                                <button
                                    onClick={handleAddDevice}
                                    disabled={unofficialDevices.length >= 5}
                                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl transition-all shadow-xl shadow-blue-100 font-bold active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Initialize First Device
                                </button>
                            </motion.div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <AnimatePresence mode="popLayout">
                                    {unofficialDevices.map(renderDeviceCard)}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>
                </div>
            )}

            {showQR && selectedDevice && (
                <div className="fixed inset-0 bg-[#0c1317] bg-opacity-95 flex items-center justify-center p-4 z-50">
                    <div className="bg-[#111b21] rounded-lg shadow-2xl max-w-4xl w-full relative overflow-hidden flex flex-col md:flex-row">
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-6 right-6 text-gray-400 hover:text-white z-10"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Left Side: Instructions */}
                        <div className="p-8 md:p-12 flex-1 text-gray-200">
                            <h2 className="text-3xl font-light mb-12 text-white">Log in to WhatsApp</h2>
                            
                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-white text-[#111b21] flex items-center justify-center font-semibold mt-1">
                                        1
                                    </div>
                                    <p className="text-xl leading-relaxed">
                                        Scan the QR code with your phone's camera
                                    </p>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-white text-[#111b21] flex items-center justify-center font-semibold mt-1">
                                        2
                                    </div>
                                    <p className="text-xl leading-relaxed flex items-center gap-2">
                                        Tap the link to open WhatsApp 
                                        <span className="inline-block bg-[#25d366] p-1 rounded-full text-white">
                                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                        </span>
                                    </p>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 w-8 h-8 rounded-full bg-white text-[#111b21] flex items-center justify-center font-semibold mt-1">
                                        3
                                    </div>
                                    <p className="text-xl leading-relaxed">
                                        Scan the QR code again to link to your account
                                    </p>
                                </div>
                            </div>

                            <div className="mt-16">
                                <a href="https://faq.whatsapp.com/1317564962315842/?cms_platform=android&lang=en" target="_blank" rel="noopener noreferrer" className="text-[#00a884] flex items-center gap-2 hover:underline text-lg">
                                    Need help?
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Right Side: QR Code Area */}
                        <div className="p-8 md:p-12 bg-[#111b21] flex items-center justify-center">
                            <div className="bg-white p-4 rounded-lg shadow-xl">
                                <QRCodeDisplay
                                    deviceId={selectedDevice.device_id}
                                    userId={userId}
                                    onScanSuccess={handleScanSuccess}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 🔥 ADD DEVICE MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative overflow-hidden"
                        >
                            {/* Modal Header Decor */}
                            <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-blue-500 to-indigo-600" />
                            
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-blue-50 p-3 rounded-2xl">
                                    <Smartphone className="w-8 h-8 text-blue-600" />
                                </div>
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">New QR Instance</h3>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    Provide a recognizable name for your new WhatsApp connection instance.
                                </p>
                            </div>

                            <form onSubmit={submitAddDevice} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Instance Identifier</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={newDeviceName}
                                            onChange={(e) => setNewDeviceName(e.target.value)}
                                            placeholder="e.g. Sales Team iPhone"
                                            className="w-full pl-4 pr-12 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-900 font-bold placeholder:text-gray-300 shadow-sm"
                                            autoFocus
                                            required
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors">
                                            <Info className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-gray-400 italic ml-1 flex items-center gap-1">
                                        <Activity className="w-3 h-3" />
                                        Each instance creates a unique virtual session
                                    </p>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 px-4 py-4 text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all font-bold text-sm"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={actionLoading || !newDeviceName.trim()}
                                        className="flex-1 px-4 py-4 text-white bg-blue-600 rounded-2xl hover:bg-blue-700 transition-all font-bold text-sm shadow-xl shadow-blue-100 flex items-center justify-center gap-2 group disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <>
                                                Deploy Instance
                                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
