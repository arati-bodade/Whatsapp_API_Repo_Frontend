"use client";

import { useEffect, useState } from "react";
import {
    Users, RefreshCw, Download, FileSpreadsheet,
    Smartphone, AlertCircle, Grid3x3, Users2,
    TrendingUp, Crown, Shield, Star, Search
} from "lucide-react";
import { deviceService, Device } from "@/services/deviceService";
import { useModal } from "@/context/ModalContext";
import { API_BASE_URL, WHATSAPP_ENGINE_URL } from "@/config/constants";

interface WhatsAppGroup {
    id: string;
    name: string;
    subject: string;
    participants: number;
}

export default function WhatsAppGroupExtractPage() {
    const { showAlert } = useModal();
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [groups, setGroups] = useState<WhatsAppGroup[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    
    const [loadingDevices, setLoadingDevices] = useState(true);
    const [scanningGroups, setScanningGroups] = useState(false);
    const [downloadingXLS, setDownloadingXLS] = useState<string | null>(null);

    useEffect(() => {
        loadDevices();
    }, []);

    const loadDevices = async () => {
        setLoadingDevices(true);
        try {
            const data = await deviceService.getDevices("connected");
            setDevices(data);
        } catch (error) {
            console.error("Failed to load devices", error);
            showAlert("Error", "Failed to load connected devices");
        } finally {
            setLoadingDevices(false);
        }
    };

    const handleScanGroups = async () => {
        if (!selectedDeviceId) {
            showAlert("Device Required", "Please select a device first");
            return;
        }

        setScanningGroups(true);
        setGroups([]);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showAlert("Error", "No authentication token found");
                return;
            }

            const response = await fetch(
                `${API_BASE_URL}/groups/whatsapp/scan?device_id=${selectedDeviceId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            const data = await response.json();
            
            if (response.ok && data.success) {
                setGroups(data.groups || []);
                showAlert("Success", `Found ${data.total} WhatsApp groups`);
            } else {
                const errorMsg = data.detail || "Failed to scan groups";
                if (errorMsg.includes("404") || errorMsg.includes("device") || errorMsg.includes("session")) {
                    showAlert("Device Not Connected", "The selected device is not connected to WhatsApp Engine. Please connect the device first and try again.");
                } else {
                    showAlert("Scan Failed", errorMsg);
                }
            }
        } catch (error: any) {
            console.error("Failed to scan groups", error);
            const errorMsg = error.message || error.toString();
            if (errorMsg.includes("404") || errorMsg.includes("device") || errorMsg.includes("session")) {
                showAlert("Device Not Connected", "The selected device is not connected to WhatsApp Engine. Please connect the device first and try again.");
            } else {
                showAlert("Error", errorMsg);
            }
        } finally {
            setScanningGroups(false);
        }
    };

    const handleDownloadXLS = async (groupId: string, groupName: string) => {
        setDownloadingXLS(groupId);
        
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                showAlert("Error", "No authentication token found");
                return;
            }

            // Get the engine URL from constants
            const engineUrl = WHATSAPP_ENGINE_URL;
            
            const response = await fetch(
                `${engineUrl}/session/${selectedDeviceId}/group-export/${groupId}`,
                {
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );

            if (!response.ok) {
                throw new Error("Failed to download XLS file");
            }

            // Get the blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `${groupName}_contacts.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            showAlert("Success", "XLS file downloaded successfully");
        } catch (error: any) {
            console.error("Failed to download XLS", error);
            showAlert("Error", error.message || "Failed to download XLS file");
        } finally {
            setDownloadingXLS(null);
        }
    };

    // Filter groups based on search query
    const filteredGroups = groups.filter(group => 
        group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        group.subject.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-linear-to-br from-slate-50 via-emerald-50 to-blue-50">
            {/* Header with gradient background */}
            <div className="bg-linear-to-r from-emerald-600 via-teal-600 to-blue-600 shadow-2xl">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="text-white">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                                    <Grid3x3 className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">WhatsApp Group Extract</h1>
                                    <p className="text-emerald-100 text-sm mt-1">Extract WhatsApp group members and download as XLS</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs flex items-center gap-2 border border-white/30">
                                    <Users className="w-3 h-3" />
                                    Group Members
                                </span>
                                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs flex items-center gap-2 border border-white/30">
                                    <FileSpreadsheet className="w-3 h-3" />
                                    XLS Export
                                </span>
                                <span className="px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs flex items-center gap-2 border border-white/30">
                                    <TrendingUp className="w-3 h-3" />
                                    Advanced Analytics
                                </span>
                            </div>
                        </div>
                        <div className="hidden md:block">
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                                <Users2 className="w-12 h-12 text-white mb-2" />
                                <p className="text-white text-sm font-medium">Powerful Extraction</p>
                                <p className="text-emerald-100 text-xs">Export with precision</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Device Selection Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-800">Select Device</h2>
                    </div>
                    
                    {loadingDevices ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                                <RefreshCw className="w-5 h-5 text-emerald-600 animate-spin" />
                                <span className="text-emerald-700 font-medium">Loading devices...</span>
                            </div>
                        </div>
                    ) : devices.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-linear-to-r from-red-50 to-orange-50 rounded-xl border border-red-200">
                                <AlertCircle className="w-5 h-5 text-red-600" />
                                <span className="text-red-700 font-medium">No connected devices found</span>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <select
                                value={selectedDeviceId}
                                onChange={(e) => setSelectedDeviceId(e.target.value)}
                                className="w-full p-4 border-2 border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-700 font-medium"
                            >
                                <option value="">Select a connected device...</option>
                                {devices.map(device => (
                                    <option key={device.device_id} value={device.device_id}>
                                        {device.device_name} ({device.device_type || 'Unknown Type'})
                                    </option>
                                ))}
                            </select>

                            <button
                                onClick={handleScanGroups}
                                disabled={!selectedDeviceId || scanningGroups}
                                className="w-full flex items-center justify-center gap-3 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
                            >
                                <RefreshCw className={`w-5 h-5 ${scanningGroups ? 'animate-spin' : ''}`} />
                                {scanningGroups ? 'Scanning Groups...' : 'Scan WhatsApp Groups'}
                            </button>
                        </div>
                    )}
                </div>

                {groups.length > 0 && (
                    <div>
                        {/* Groups Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl">
                                    <Users className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">WhatsApp Groups</h2>
                                    <p className="text-gray-500 text-sm">{groups.length} groups found</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-linear-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200">
                                    {groups.length} Total
                                </span>
                                {filteredGroups.length !== groups.length && (
                                    <span className="px-3 py-1.5 bg-linear-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-xs font-medium border border-blue-200">
                                        {filteredGroups.length} Filtered
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="mb-6">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search groups by name or subject..."
                                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl bg-white/80 backdrop-blur-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-gray-700 placeholder-gray-400"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                                    >
                                        <div className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </div>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Groups Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredGroups.map((group, index) => (
                                <div
                                    key={index}
                                    className="group relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 hover:shadow-2xl transition-all duration-300 overflow-hidden"
                                >
                                    {/* Gradient Background */}
                                    <div className="absolute inset-0 bg-linear-to-br from-emerald-50 via-teal-50 to-blue-50 opacity-50"></div>
                                    
                                    {/* Card Content */}
                                    <div className="relative p-6">
                                        {/* Group Icon */}
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-linear-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg">
                                                <Users className="w-6 h-6 text-white" />
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {group.participants > 100 && (
                                                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                                )}
                                                {group.participants > 500 && (
                                                    <Crown className="w-4 h-4 text-purple-500 fill-purple-500" />
                                                )}
                                                {group.participants > 50 && (
                                                    <Shield className="w-4 h-4 text-blue-500 fill-blue-500" />
                                                )}
                                            </div>
                                        </div>

                                        {/* Group Info */}
                                        <div className="mb-4">
                                            <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2">
                                                {group.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Users2 className="w-4 h-4" />
                                                <span>{group.participants.toLocaleString()} members</span>
                                            </div>
                                        </div>

                                        {/* Download Button */}
                                        <button
                                            onClick={() => handleDownloadXLS(group.id, group.name)}
                                            disabled={downloadingXLS === group.id}
                                            className="w-full flex items-center justify-center gap-2 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] font-medium"
                                        >
                                            <Download className={`w-4 h-4 ${downloadingXLS === group.id ? 'animate-bounce' : ''}`} />
                                            {downloadingXLS === group.id ? 'Downloading...' : 'Download XLS'}
                                        </button>
                                    </div>

                                    {/* Hover Effect Border */}
                                    <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-emerald-300 transition-all duration-300 pointer-events-none"></div>
                                </div>
                            ))}
                        </div>

                        {/* No Search Results */}
                        {filteredGroups.length === 0 && searchQuery && (
                            <div className="text-center py-12">
                                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-8 max-w-md mx-auto">
                                    <div className="p-4 bg-linear-to-r from-gray-100 to-gray-200 rounded-2xl inline-block mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">No Groups Found</h3>
                                    <p className="text-gray-600 text-sm mb-4">No groups match "{searchQuery}"</p>
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="px-4 py-2 bg-linear-to-r from-emerald-600 to-teal-600 text-white rounded-lg hover:from-emerald-700 hover:to-teal-700 transition-all text-sm font-medium"
                                    >
                                        Clear Search
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {groups.length === 0 && !scanningGroups && selectedDeviceId && (
                    <div className="text-center py-16">
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-12 max-w-md mx-auto">
                            <div className="p-4 bg-linear-to-r from-gray-100 to-gray-200 rounded-2xl inline-block mb-6">
                                <Users className="w-12 h-12 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-3">No Groups Found</h3>
                            <p className="text-gray-600 mb-6">Click "Scan WhatsApp Groups" to fetch your groups and start extracting member data.</p>
                            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                <span>Ready to scan</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
