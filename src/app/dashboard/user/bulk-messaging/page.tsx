"use client";

import { useState, useEffect } from "react";
import {
    FileSpreadsheet,
    Smartphone,
    Send,
    CheckCircle,
    AlertCircle,
    MessageSquare,
    Image as ImageIcon
} from "lucide-react";
import { googleSheetService, GoogleSheet } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { campaignService } from "@/services/campaignService";
import { usePlanStatus } from "@/hooks/usePlanStatus";
import { PlanRestrictionModal } from "@/components/plans/PlanRestrictionModal";

export default function BulkMessagingPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);

    const [selectedSheetId, setSelectedSheetId] = useState("");
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
    const [templates, setTemplates] = useState([
        { id: 1, content: "" },
        { id: 2, content: "" },
        { id: 3, content: "" },
        { id: 4, content: "" },
        { id: 5, content: "" },
    ]);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [sourceType, setSourceType] = useState<"sheet" | "file">("sheet");
    const [dataSourceFile, setDataSourceFile] = useState<File | null>(null);

    const { isValid, loading: planLoading, refreshPlanStatus } = usePlanStatus();
    const [showPlanModal, setShowPlanModal] = useState(false);

    const [loadingConfig, setLoadingConfig] = useState(true);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
    const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
    const [campaignStatus, setCampaignStatus] = useState<any>(null);
    const [campaignLogs, setCampaignLogs] = useState<any[]>([]);
    const [isActionLoading, setIsActionLoading] = useState(false);

    const [lastProcessedCount, setLastProcessedCount] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeCampaignId) {
            console.log("🚀 Starting Optimized Poller for Campaign:", activeCampaignId);
            interval = setInterval(async () => {
                try {
                    const statusData = await campaignService.getCampaignStatus(activeCampaignId);
                    setCampaignStatus(statusData);

                    // 🔥 PERFORMANCE OPTIMIZATION: Only fetch logs if counts have changed
                    const currentProcessed = (statusData.sent_count || 0) + (statusData.failed_count || 0);
                    if (currentProcessed !== lastProcessedCount || statusData.status === "Completed") {
                        try {
                            const logsData = await campaignService.getCampaignLogs(activeCampaignId);
                            if (logsData && logsData.logs) {
                                setCampaignLogs(logsData.logs);
                                setLastProcessedCount(currentProcessed);
                            }
                        } catch (e) {
                            console.error("Failed to fetch logs", e);
                        }
                    }

                    // 🔥 HARD STOP: Case-insensitive completion check & total recipients safeguard
                    const currentStatus = (statusData.status || "").toLowerCase();
                    const isFinished = ["completed", "failed", "success", "stopped"].includes(currentStatus);
                    
                    const progressFinished = statusData.total_recipients > 0 && 
                                            currentProcessed >= statusData.total_recipients;

                    if (isFinished || progressFinished) {
                        console.log(`✅ Campaign ${activeCampaignId} finished. Cleaning up poller.`);
                        setActiveCampaignId(null);
                        setSending(false);
                        // Final log fetch to be sure
                        try {
                            const finalLogs = await campaignService.getCampaignLogs(activeCampaignId);
                            if (finalLogs?.logs) setCampaignLogs(finalLogs.logs);
                        } catch {}
                        
                        setStatus({ 
                            type: "success", 
                            text: `Campaign finished! Sent: ${statusData.sent_count}, Failed: ${statusData.failed_count}` 
                        });
                        clearInterval(interval);
                    }
                } catch (e) {
                    console.error("Failed to fetch status", e);
                    // If 404, the campaign might be deleted or lost
                }
            }, 3000); // Increased to 3s for better performance
        }
        return () => {
            if (interval) {
                console.log("⏹️ Poller Cleanup");
                clearInterval(interval);
            }
        };
    }, [activeCampaignId, lastProcessedCount]);

    const handlePauseCampaign = async () => {
        if (!activeCampaignId) return;
        setIsActionLoading(true);
        try {
            await campaignService.pauseCampaign(activeCampaignId);
            setStatus({ type: "success", text: "Campaign paused successfully." });
            setCampaignStatus((prev: any) => ({ ...prev, status: "Paused" }));
        } catch (error: any) {
            setStatus({ type: "error", text: error.message || "Failed to pause campaign." });
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleResumeCampaign = async () => {
        if (!activeCampaignId) return;
        setIsActionLoading(true);
        try {
            await campaignService.resumeCampaign(activeCampaignId);
            setStatus({ type: "success", text: "Campaign resumed successfully." });
            setCampaignStatus((prev: any) => ({ ...prev, status: "Running" }));
        } catch (error: any) {
            setStatus({ type: "error", text: error.message || "Failed to resume campaign." });
        } finally {
            setIsActionLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoadingConfig(true);
        try {
            const userId = localStorage.getItem("user_id");
            if (userId) {
                // Load only connected unofficial devices
                const deviceData = await deviceService.getConnectedUnofficialDevices();
                setDevices(deviceData.slice(0, 5)); // Limit to 5 devices for the UI as per requirement
            }

            // Load sheets
            const sheetData = await googleSheetService.listSheets();
            setSheets(sheetData);
        } catch (error) {
            console.error("Failed to load generic config", error);
        } finally {
            setLoadingConfig(false);
        }
    };

    const toggleDevice = (deviceId: string) => {
        setSelectedDeviceIds(prev =>
            prev.includes(deviceId)
                ? prev.filter(id => id !== deviceId)
                : [...prev, deviceId]
        );
    };

    const handleTemplateChange = (id: number, field: string, value: string) => {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    };

    const isFormValid = () => {
        if (sourceType === "sheet" && !selectedSheetId) return false;
        if (sourceType === "file" && !dataSourceFile) return false;
        if (selectedDeviceIds.length === 0) return false;

        // Check if at least one template is filled
        const atLeastOneTemplate = templates.some(t => t.content.trim().length > 0);
        if (!atLeastOneTemplate) return false;

        return true;
    };

    const handleSendCampaign = async () => {
        if (!isFormValid()) {
            setStatus({ type: "error", text: "Please select a sheet, at least 1 device, and fill at least 1 template." });
            return;
        }

        // NEW: Check Plan Validity
        if (!isValid) {
            setShowPlanModal(true);
            return;
        }

        setSending(true);
        setStatus(null);

        const filledTemplates = templates
            .filter(t => t.content.trim().length > 0);

        const payload: any = {
            name: `Bulk Campaign - ${new Date().toLocaleString()}`,
            device_ids: selectedDeviceIds,
            templates: filledTemplates.map(t => ({
                content: t.content.trim(),
                delay_override: undefined
            })),
        };

        if (sourceType === "sheet") {
            payload.sheet_id = selectedSheetId;
        }

        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));
        if (selectedFile) {
            formData.append("file", selectedFile);
        }
        if (sourceType === "file" && dataSourceFile) {
            formData.append("data_file", dataSourceFile);
        }

        try {
            console.log("Creating campaign with FormData:", payload);
            const campaignData = await campaignService.createCampaign(formData);
            const campaignId = campaignData?.id;

            if (campaignId) {
                console.log("Campaign created, starting campaign:", campaignId);
                await campaignService.startCampaign(campaignId);
                setActiveCampaignId(campaignId);
                setCampaignStatus({ total_recipients: 0, sent_count: 0, failed_count: 0, status: "Starting..." });
            }

            setStatus({ type: "success", text: "Campaign created and started successfully! Tracking progress..." });

            // Optional: Reset form on success
            // setSelectedSheetId("");
            // setSelectedDeviceIds([]);
            // setTemplates(templates.map(t => ({...t, content: ""})));

        } catch (error: any) {
            console.error("Failed to start campaign:", error);
            setStatus({ type: "error", text: error.message || "Failed to start campaign. Please try again." });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-background p-6 md:p-8 font-sans">
            {/* NEW: Plan Restriction Modal */}
            <PlanRestrictionModal 
                isOpen={showPlanModal} 
                onClose={() => setShowPlanModal(false)} 
                title="Failed to send message"
                message="Failed to send message. Please purchase a plan."
            />
            
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Send Bulk Message</h1>
                    <p className="text-muted-foreground mt-2 font-medium">Send high-volume campaigns using multiple devices and message templates.</p>
                </div>

                {status && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                        {status.type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                        <p className="font-medium text-sm">{status.text}</p>
                    </div>
                )}

                {/* Progress Details Card */}
                {campaignStatus && (
                    <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-emerald-500/20 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-foreground">Campaign Progress</h2>
                            <div className="flex items-center gap-2">
                                {campaignStatus.status === "Running" && (
                                    <button
                                        onClick={handlePauseCampaign}
                                        disabled={isActionLoading}
                                        className="px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 transition-colors cursor-pointer"
                                    >
                                        PAUSE
                                    </button>
                                )}
                                {campaignStatus.status === "Paused" && (
                                    <button
                                        onClick={handleResumeCampaign}
                                        disabled={isActionLoading}
                                        className="px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer"
                                    >
                                        RESUME
                                    </button>
                                )}
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${campaignStatus.status === 'Running' ? 'bg-emerald-100 text-emerald-800' : campaignStatus.status === 'Paused' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {campaignStatus.status}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center mt-2">
                            <div className="bg-background p-4 rounded-xl border border-border">
                                <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Total</p>
                                <p className="text-2xl font-bold text-foreground">{campaignStatus.total_recipients}</p>
                            </div>
                            <div className="bg-emerald-50 p-4 rounded-xl">
                                <p className="text-xs text-emerald-600 uppercase font-bold">Sent</p>
                                <p className="text-2xl font-bold text-emerald-700">{campaignStatus.sent_count}</p>
                            </div>
                            <div className="bg-red-50 p-4 rounded-xl">
                                <p className="text-xs text-red-600 uppercase font-bold">Failed</p>
                                <p className="text-2xl font-bold text-red-700">{campaignStatus.failed_count}</p>
                            </div>
                        </div>
                        {activeCampaignId && (
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${Math.min(100, ((campaignStatus.sent_count + campaignStatus.failed_count) / Math.max(1, campaignStatus.total_recipients)) * 100)}%` }}></div>
                            </div>
                        )}

                        {/* Message Logs Table */}
                        {campaignLogs.length > 0 && (
                            <div className="mt-6 border-t border-emerald-50 pt-6">
                                <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                                    <MessageSquare size={16} className="text-emerald-500" />
                                    Live Message Logs
                                </h3>
                                <div className="max-h-60 overflow-y-auto rounded-lg border border-border bg-background/50">
                                    <table className="min-w-full text-left text-xs">
                                        <thead className="bg-white sticky top-0 border-b border-gray-100">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold text-gray-500">Recipient</th>
                                                <th className="px-4 py-3 font-semibold text-gray-500">Status</th>
                                                <th className="px-4 py-3 font-semibold text-gray-500">Retries</th>
                                                <th className="px-4 py-3 font-semibold text-gray-500">Time</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 bg-white">
                                            {campaignLogs.map((log: any) => (
                                                <tr key={log.id} className="hover:bg-gray-50/50">
                                                    <td className="px-4 py-3 text-gray-700 font-mono">{log.recipient}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${log.status.toUpperCase() === 'SENT' ? 'bg-emerald-100 text-emerald-700' :
                                                            log.status.toUpperCase() === 'FAILED' ? 'bg-red-100 text-red-700' :
                                                                'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {log.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-500">{log.retry_count}</td>
                                                    <td className="px-4 py-3 text-gray-400 font-mono">{new Date(log.created_at).toLocaleTimeString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* Left Column */}
                    <div className="space-y-8">

                        {/* Section 1: Data Source Selection */}
                        <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                        <FileSpreadsheet size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">1. Data Source</h2>
                                        <p className="text-xs text-muted-foreground font-medium">Choose your recipient list</p>
                                    </div>
                                </div>
                            </div>

                            {/* Source Tabs */}
                            <div className="flex bg-background p-1 rounded-xl mb-6 border border-border">
                                <button
                                    onClick={() => setSourceType("sheet")}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${sourceType === "sheet" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    Google Sheet
                                </button>
                                <button
                                    onClick={() => setSourceType("file")}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${sourceType === "file" ? "bg-emerald-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                                >
                                    CSV / Excel File
                                </button>
                            </div>

                            {sourceType === "sheet" ? (
                                <div>
                                    <select
                                        value={selectedSheetId}
                                        onChange={(e) => setSelectedSheetId(e.target.value)}
                                        disabled={loadingConfig || sheets.length === 0}
                                        className="w-full p-4 bg-background border border-border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-sm text-foreground font-medium"
                                    >
                                        <option value="">
                                            {loadingConfig ? "Loading sheets..." : (sheets.length === 0 ? "No sheets available" : "Select a connected Google Sheet...")}
                                        </option>
                                        {sheets.map(sheet => (
                                            <option key={sheet.id} value={sheet.id}>{sheet.sheet_name}</option>
                                        ))}
                                    </select>
                                    {!selectedSheetId && !loadingConfig && (
                                        <p className="text-xs text-red-500 mt-2 ml-1">* Sheet selection is required.</p>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <div 
                                        className={`mt-2 flex justify-center rounded-xl border-2 border-dashed px-6 py-8 transition-all cursor-pointer ${dataSourceFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border hover:border-emerald-500/30'}`}
                                        onClick={() => document.getElementById('data-file-upload')?.click()}
                                    >
                                        <div className="text-center">
                                            <FileSpreadsheet className={`mx-auto h-10 w-10 ${dataSourceFile ? 'text-emerald-500' : 'text-muted-foreground'}`} />
                                            <div className="mt-4 flex text-sm leading-6 text-foreground justify-center font-bold">
                                                <span>{dataSourceFile ? dataSourceFile.name : "Upload Data Source"}</span>
                                                <input 
                                                    id="data-file-upload" 
                                                    name="data-file-upload" 
                                                    type="file" 
                                                    accept=".csv, .xlsx, .xls"
                                                    className="sr-only" 
                                                    onChange={(e) => setDataSourceFile(e.target.files ? e.target.files[0] : null)} 
                                                />
                                            </div>
                                            <p className="text-xs leading-5 text-muted-foreground mt-1">
                                                {dataSourceFile ? `(${(dataSourceFile.size / 1024 / 1024).toFixed(2)} MB)` : "Excel or CSV containing phone column"}
                                            </p>
                                        </div>
                                    </div>
                                    {dataSourceFile && (
                                        <button 
                                            onClick={() => setDataSourceFile(null)}
                                            className="mt-3 text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 mx-auto"
                                        >
                                            Remove File
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Optional Section: File Upload */}
                        <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-600 flex items-center justify-center">
                                    <ImageIcon size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">Optional: Attach Media</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Send an image or document with your messages</p>
                                </div>
                            </div>

                            <div>
                                <div className="mt-2 flex justify-center rounded-xl border border-dashed border-gray-300 px-6 py-10 transition-colors hover:border-pink-300 hover:bg-pink-50/30">
                                    <div className="text-center">
                                        <ImageIcon className="mx-auto h-12 w-12 text-gray-300" aria-hidden="true" />
                                        <div className="mt-4 flex text-sm leading-6 text-gray-600 justify-center">
                                            <label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md bg-white font-semibold text-pink-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-pink-600 focus-within:ring-offset-2 hover:text-pink-500"
                                            >
                                                <span>Upload a file</span>
                                                <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)} />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs leading-5 text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </div>
                                {selectedFile && (
                                    <div className="mt-4 flex items-center justify-between p-3 bg-pink-50 rounded-lg border border-pink-100">
                                        <div className="flex items-center space-x-3 overflow-hidden">
                                            <div className="flex-shrink-0">
                                                <ImageIcon className="h-5 w-5 text-pink-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {selectedFile.name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSelectedFile(null)}
                                            className="ml-4 flex-shrink-0 bg-white rounded-md text-sm font-medium text-pink-600 hover:text-pink-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Section 2: Device Selection */}
                        <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                                    <Smartphone size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">2. Select Devices</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Choose up to 5 devices for sending (Round Robin)</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {loadingConfig ? (
                                    <p className="text-sm text-gray-500">Loading devices...</p>
                                ) : devices.length === 0 ? (
                                    <p className="text-sm text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">No connected devices found. Please connect devices first.</p>
                                ) : (
                                    devices.map((device, idx) => (
                                        <div
                                            key={device.device_id}
                                            onClick={() => toggleDevice(device.device_id)}
                                            className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all select-none ${selectedDeviceIds.includes(device.device_id)
                                                ? 'bg-blue-500/10 border-blue-500 shadow-sm'
                                                : 'bg-background border-border hover:border-blue-500/50'
                                                }`}
                                        >
                                            <div className="flex-shrink-0">
                                                <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedDeviceIds.includes(device.device_id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300 bg-white'}`}>
                                                    {selectedDeviceIds.includes(device.device_id) && (
                                                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-semibold text-sm ${selectedDeviceIds.includes(device.device_id) ? 'text-blue-900' : 'text-gray-800'}`}>
                                                    {device.device_name || `Device ${idx + 1}`}
                                                </span>
                                                <span className="text-xs text-gray-500 font-mono mt-0.5">ID: {device.device_id.substring(0, 8)}...</span>
                                            </div>
                                            <div className="ml-auto">
                                                <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider ${device.session_status === 'connected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                    {device.session_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            {selectedDeviceIds.length === 0 && !loadingConfig && devices.length > 0 && (
                                <p className="text-xs text-red-500 mt-3 ml-1">* At least 1 device is required.</p>
                            )}
                        </div>

                    </div>

                    {/* Right Column: Templates & Send Action */}
                    <div className="space-y-8 flex flex-col h-full">

                        {/* Section 3: Message Templates */}
                        <div className="bg-card rounded-2xl p-6 md:p-8 shadow-sm border border-border flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                                    <MessageSquare size={20} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-foreground">3. Message Templates</h2>
                                    <p className="text-xs text-muted-foreground font-medium">Fill up to 5 templates to vary your messages & prevent bans.</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {templates.map((template, idx) => (
                                    <div key={template.id} className="space-y-2 p-4 bg-background rounded-xl border border-border">
                                        <div className="relative">
                                            <label className="absolute -top-2 left-3 bg-card px-1 text-[10px] uppercase font-bold text-purple-600 z-10">
                                                Template {template.id} - Message Content
                                            </label>
                                            <textarea
                                                value={template.content}
                                                onChange={(e) => handleTemplateChange(template.id, 'content', e.target.value)}
                                                placeholder={`Enter message variation ${idx + 1} ...`}
                                                rows={2}
                                                className="w-full pt-4 pb-3 px-4 border border-border rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm resize-none bg-background text-foreground relative z-0"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {!templates.some(t => t.content.trim().length > 0) && (
                                <p className="text-xs text-red-500 mt-4 ml-1">* At least 1 message template must be filled.</p>
                            )}
                        </div>

                        {/* Send Button Card */}
                        <div className="bg-card rounded-2xl p-6 md:p-8 shadow-lg border border-border sticky bottom-6 z-20">
                            <button
                                onClick={handleSendCampaign}
                                disabled={sending || !isFormValid()}
                                className={`w-full py-4 rounded-xl flex items-center justify-center gap-3 font-bold text-lg transition-all
                  ${sending
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : !isFormValid()
                                            ? 'bg-emerald-50 text-emerald-300 cursor-not-allowed border border-emerald-100'
                                            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg hover:shadow-emerald-500/30 hover:-translate-y-0.5'
                                    }`}
                            >
                                {sending ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Send Campaign
                                    </>
                                )}
                            </button>
                            {!isFormValid() && (
                                <p className="text-center text-xs text-gray-400 mt-3">Please complete all required fields above to enable sending.</p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
