"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, CheckCircle, Database, FileText, Trash2, ArrowRight, Upload, HelpCircle, Settings, RefreshCcw, Save, MessageSquare, AlertCircle, Play, StopCircle, Zap, Smartphone, Send, CheckCircle2, XCircle, TrendingUp } from "lucide-react";
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { googleSheetService, GoogleSheet, TriggerHistory, Trigger } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { campaignService } from "@/services/campaignService";
import { useModal } from "@/context/ModalContext";

export default function UnofficialTriggerPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [history, setHistory] = useState<TriggerHistory[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedSheetId, setSelectedSheetId] = useState("");
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [triggers, setTriggers] = useState<Trigger[]>([]); 
    const [actionLoading, setActionLoading] = useState<string | null>(null); 
    const [refreshLoading, setRefreshLoading] = useState(false); 
    const { showAlert, showConfirm } = useModal();

    // Unofficial API Requirements
    const [allDevices, setAllDevices] = useState<Device[]>([]); 
    const [devices, setDevices] = useState<Device[]>([]); 

    const [sourceType, setSourceType] = useState<"sheet" | "file">("sheet");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dataSourceFile, setDataSourceFile] = useState<File | null>(null);
    const [selectedDeviceIds, setSelectedDeviceIds] = useState<string[]>([]);
    const [templates, setTemplates] = useState([
        { id: 1, content: "" },
        { id: 2, content: "" },
        { id: 3, content: "" },
        { id: 4, content: "" },
        { id: 5, content: "" },
    ]);

    // Using string config instead of official template
    const [triggerConfig, setTriggerConfig] = useState({
        trigger_type: "update_row",
        is_enabled: false,
        text_message: "",
        phone_column: "",
        trigger_column: "",
        trigger_value: "",
        status_column: "Status",
        send_time_column: "", // NEW: Send_time column for time-based triggers
        message_column: "" // NEW: Message column to get message content from sheet
    });
    const [saving, setSaving] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [firing, setFiring] = useState(false);
    const [scheduledAt, setScheduledAt] = useState("");
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreview, setMediaPreview] = useState<string | null>(null);
    const [dateError, setDateError] = useState<string | null>(null);
    
    // Track trigger completion and message status
    const [completedTriggers, setCompletedTriggers] = useState<Set<string>>(new Set());
    const [messageStatusMap, setMessageStatusMap] = useState<Map<string, { sent: number; total: number; lastUpdate: Date }>>(new Map());
    const [showCompletionPopup, setShowCompletionPopup] = useState<string | null>(null);
    const [cleaningTriggers, setCleaningTriggers] = useState(false);
    
    // Hidden triggers list - add trigger IDs to hide from UI
    const hiddenTriggerIds = new Set([
        '8d49d075-a46e-40e3-89dd-9b87310c77b2',
        '2a38bb65-bbdc-44f2-918a-80db53324b35', 
        '2bf27601-9f99-4068-a2d0-b249041a1440',
        '0505630f-06d1-42a5-8a23-ea5d72f8d538'
    ]);
    
    useEffect(() => {
        loadData();
        loadDevices();
        fetchHistory();
        fetchAllTriggers();

        // Only check polling status - do NOT auto-start triggers
        const checkPollingStatus = async () => {
            try {
                const status = await googleSheetService.getPollingStatus();
                setIsPolling(status.is_running);
            } catch (error) {
                console.error("Failed to check polling status", error);
            }
        };

        checkPollingStatus();

        const historyInterval = setInterval(() => {
            fetchHistory();
            fetchAllTriggers();
            checkPollingStatus();
        }, 10000);

        return () => {
            clearInterval(historyInterval);
        };
    }, []);

    // Monitor trigger status and show completion popups
    const monitorTriggerStatus = () => {
        triggers.forEach(trigger => {
            if (trigger.is_enabled && trigger.completion_status === "running") {
                // Check if trigger has completed
                const processedRows = trigger.processed_rows || 0;
                const totalRows = trigger.total_rows || 0;
                
                // Update message status map
                setMessageStatusMap(prev => {
                    const current = prev.get(trigger.trigger_id) || { sent: 0, total: totalRows, lastUpdate: new Date() };
                    return new Map(prev).set(trigger.trigger_id, {
                        sent: processedRows,
                        total: totalRows,
                        lastUpdate: new Date()
                    });
                });

                // Check if trigger just completed
                if (processedRows >= totalRows && totalRows > 0 && !completedTriggers.has(trigger.trigger_id)) {
                    setCompletedTriggers(prev => new Set(prev).add(trigger.trigger_id));
                    setShowCompletionPopup(trigger.trigger_id);
                    
                    // Show completion alert
                    showAlert("Success", `Trigger "${trigger.sheet_name || 'File Upload'}" has completed successfully! Sent ${processedRows} messages.`);
                }
            }
        });
    };

    // Add monitoring to the interval
    useEffect(() => {
        monitorTriggerStatus();
    }, [triggers, history]);

    const loadDevices = async () => {
        try {
            console.log("🔄 Loading devices for trigger page...");
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                console.error("No user ID found in localStorage");
                return;
            }
            
            // Force sync to get latest device status
            const allData = await deviceService.getUnofficialDevices(true); // true = force sync
            console.log(`📱 Loaded ${allData.length} total devices from unofficial list`);
            setAllDevices(allData); // Save all their devices so we can map names correctly in the table
            
            let finalDevices: Device[] = [];
            
            // Use the dedicated connected devices endpoint for better accuracy
            try {
                const connectedData = await deviceService.getConnectedUnofficialDevices();
                console.log(`✅ Loaded ${connectedData.length} connected devices from connected endpoint`);
                finalDevices = connectedData;
            } catch (connectedError) {
                console.warn("⚠️ Failed to get connected devices, falling back to filtered list:", connectedError);
                // Fallback to filtering all devices
                const connectedDevices = allData.filter((device: Device) => device.session_status === 'connected');
                console.log(`🔄 Fallback: Found ${connectedDevices.length} connected devices by filtering`);
                finalDevices = connectedDevices;
            }
            
            // Additional fallback: if still no devices, show all devices with a warning
            if (finalDevices.length === 0 && allData.length > 0) {
                console.warn("⚠️ No connected devices found, showing all devices for selection");
                finalDevices = allData;
            }
            
            setDevices(finalDevices);
            console.log(`📊 Final device count for selection: ${finalDevices.length}`);
        } catch (error) {
            console.error("❌ Failed to load devices:", error);
            showAlert("Device Load Error", "Failed to load devices. Please refresh the page.");
        }
    };

    useEffect(() => {
        if (sourceType === "sheet") {
            if (selectedSheetId) {
                const sheet = sheets.find(s => s.id === selectedSheetId);
                setSelectedSheet(sheet || null);
                if (sheet) {
                    loadSheetColumns(sheet.id);
                }
            } else {
                setSelectedSheet(null);
                setColumns([]);
            }
        }
    }, [selectedSheetId, sheets, sourceType]);

    const fetchTriggers = async (sheetId: string) => {
        try {
            const data = await googleSheetService.listTriggers(sheetId);
            setTriggers(data);
        } catch (error) {
            console.error("Failed to load triggers", error);
        }
    };

    const fetchAllTriggers = async () => {
        try {
            console.log("Fetching all triggers...");
            const triggerList = await googleSheetService.listAllTriggers();
            console.log("Fetched triggers:", triggerList);
            setTriggers(triggerList);
            
            // Debug: Check if specific trigger exists
            const targetTrigger = triggerList.find(t => t.trigger_id === '0505630f-06d1-42a5-8a23-ea5d72f8d538');
            if (targetTrigger) {
                console.log("Target trigger found:", targetTrigger);
            } else {
                console.log("Target trigger NOT found in fetched list");
                console.log("Available trigger IDs:", triggerList.map(t => t.trigger_id));
            }
        } catch (error) {
            console.error("Error fetching triggers:", error);
            // Try to fetch triggers from different endpoint as fallback
            try {
                console.log("Trying fallback trigger fetch...");
                const response = await fetch('/api/google-sheets/triggers/all', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("Fallback trigger data:", data);
                    setTriggers(data || []);
                }
            } catch (fallbackError) {
                console.error("Fallback fetch also failed:", fallbackError);
            }
        }
    };

    const loadData = async () => {
        setLoading(true);

        try {
            const sheetsData = await googleSheetService.listSheets();
            setSheets(sheetsData);
        } catch (error) {
            console.error("Failed to load sheets", error);
        }

        setLoading(false);
    };

    const loadSheetColumns = async (sheetId: string) => {
        try {
            const res = await googleSheetService.fetchRows(sheetId);
            if (res.headers) {
                setColumns(res.headers);

                const phoneCol = res.headers.find((c: string) =>
                    c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile')
                );
                const statusCol = res.headers.find((c: string) =>
                    c.toLowerCase().includes('status') || c.toLowerCase().includes('state')
                );
                const sendTimeCol = res.headers.find((c: string) =>
                    c.toLowerCase().includes('send_time') || c.toLowerCase().includes('time')
                );
                const messageCol = res.headers.find((c: string) =>
                    c.toLowerCase().includes('message') || c.toLowerCase().includes('text')
                );

                setTriggerConfig(prev => ({
                    ...prev,
                    phone_column: phoneCol || "",
                    status_column: statusCol || "Status",
                    send_time_column: sendTimeCol || "",
                    message_column: messageCol || ""
                }));
                
                // If message content is in a column, maybe we don't need templates
                // But user wants templates like bulk messaging
            }
        } catch (error) {
            console.error("Failed to load sheet columns", error);
        }
    };

    const handleClearHistory = async () => {
        showConfirm(
            "Clear History",
            "Are you sure you want to delete all trigger history? This cannot be undone.",
            async () => {
                setRefreshLoading(true);
                try {
                    await googleSheetService.clearTriggerHistory();
                    setHistory([]);
                    showAlert("Success", "✅ History cleared successfully!");
                } catch (error: any) {
                    console.error("Failed to clear history", error);
                    showAlert("Error", "❌ Failed to clear history");
                } finally {
                    setRefreshLoading(false);
                }
            }
        );
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

    const validateScheduledDate = (dateStr: string): boolean => {
        if (!dateStr) return true;
        
        try {
            // Debug logging
            console.log("Validating date:", dateStr);
            
            const selectedDate = new Date(dateStr.replace('T', ' '));
            const now = new Date();
            
            // Reset times to compare dates only
            const today = new Date(now);
            today.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            
            console.log("Selected date:", selectedDate.toDateString());
            console.log("Today:", today.toDateString());
            console.log("Is valid:", selectedDate >= today);
            
            return selectedDate >= today;
        } catch (error) {
            console.error("Date validation error:", error);
            return false;
        }
    };

    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newDate = e.target.value;
        const time = scheduledAt.split('T')[1] || new Date().toLocaleString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
        const fullDateTime = `${newDate}T${time}`;
        
        if (!validateScheduledDate(fullDateTime)) {
            setDateError("Past dates are not allowed. Please select a valid date.");
        } else {
            setDateError(null);
        }
        
        setScheduledAt(fullDateTime);
    };

    const setValidFutureDate = () => {
        const now = new Date();
        const nowPlus5 = new Date(now.getTime() + 5 * 60000); // Add 5 minutes
        const date = nowPlus5.toISOString().split('T')[0];
        const time = nowPlus5.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        const fullDateTime = `${date}T${time}`;
        
        console.log("Setting valid future date:", fullDateTime);
        setScheduledAt(fullDateTime);
        setDateError(null);
    };

    const fetchHistory = async () => {
        setRefreshLoading(true);
        try {
            const historyData = await googleSheetService.getAllTriggerHistory();
            setHistory(historyData);
        } catch (error: any) {
            console.error("Failed to fetch trigger history", error);

            // Defensive error handling
            let errorMessage = "Failed to refresh history";
            if (!error.response) {
                errorMessage = "Backend not reachable. Please try again later.";
            } else if (error.response.status >= 500) {
                errorMessage = "Server error. Please try again later.";
            }

            showAlert("Refresh Error", errorMessage);
        } finally {
            setRefreshLoading(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setMediaPreview(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                setMediaPreview(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setMediaFile(null);
        setMediaPreview(null);
    };

    const handleSaveTrigger = async () => {
        const isSheetSource = sourceType === "sheet";
        const hasSource = isSheetSource ? !!selectedSheetId : !!dataSourceFile;

        if (!hasSource || selectedDeviceIds.length === 0) {
            showAlert("Selection Required", `Please select a ${isSheetSource ? 'sheet' : 'file'} and at least one device`);
            return;
        }

        // Must have at least one template filled OR media attached
        const filledTemplates = templates.filter(t => t.content.trim().length > 0);
        if (filledTemplates.length === 0 && !mediaFile) {
            showAlert("Content Required", "Please provide at least one message template or attach a media file");
            return;
        }

        // Validate scheduled date for time-based triggers
        if (triggerConfig.trigger_type === 'time') {
            if (!scheduledAt) {
                showAlert("Date Required", "Please select a date and time for time-based triggers.");
                return;
            }
            if (!validateScheduledDate(scheduledAt)) {
                showAlert("Invalid Date", "Past dates are not allowed. Please select a valid date.");
                return;
            }
        }

        setSaving(true);
        try {
            const payload: any = {
                trigger_type: triggerConfig.trigger_type,
                phone_column: triggerConfig.phone_column,
                trigger_column: triggerConfig.trigger_column,
                trigger_value: triggerConfig.trigger_value,
                status_column: triggerConfig.status_column,
                send_time_column: triggerConfig.send_time_column,
                message_column: triggerConfig.message_column,
                is_enabled: true,
                // Only send scheduled_at for time-based triggers
                ...(triggerConfig.trigger_type === 'time' && scheduledAt ? { scheduled_at: scheduledAt.replace('T', ' ') } : {}),
                
                // Single device_id for backward compatibility
                device_id: selectedDeviceIds.length > 0 ? selectedDeviceIds[0] : null,
                
                // Fields for CampaignCreateRequest (Backend compatibility)
                device_ids: selectedDeviceIds,
                templates: filledTemplates.length > 0 
                    ? filledTemplates.map(t => ({ content: t.content.trim() })) 
                    : [{ content: "" }],
                
                // Fields for TriggerCreateRequest (Round Robin)
                multi_device_ids: selectedDeviceIds,
                multi_templates: filledTemplates.length > 0 ? filledTemplates.map(t => t.content.trim()) : [""]
            };

            console.log("[CAMPAIGN] Pre-flight payload verification:", payload);

            const formData = new FormData();
            formData.append("payload", JSON.stringify({
                sheet_id: isSheetSource ? selectedSheetId : "none",
                source_type: sourceType,
                ...payload
            }));
            
            // Attach media file if exists
            if (mediaFile) {
                formData.append("file", mediaFile);
            }
            
            // Attach data source file for file-based triggers
            if (!isSheetSource && dataSourceFile) {
                formData.append("data_file", dataSourceFile);
            }
            
            await googleSheetService.createTrigger(formData);

            showAlert("Success", "✅ Trigger created successfully with Round Robin and random delays active.");
            
            // Reset
            setTemplates(templates.map(t => ({...t, content: ""})));
            setSelectedDeviceIds([]);
            setMediaFile(null);
            setMediaPreview(null);
            fetchAllTriggers();
            fetchHistory();
        } catch (error: any) {
            console.error("Trigger creation error:", error);
            showAlert("Error", `❌ ${error.response?.data?.detail || error.message}`);
        } finally {
            setSaving(false);
        }
    };
    
    const handleFireNow = async () => {
        setFiring(true);
        try {
            await googleSheetService.fireTriggersNow();
            showAlert("Success", "🔥 Manual trigger scan initiated.");
            fetchHistory();
        } catch (error) {
            showAlert("Error", "Failed to fire triggers");
        } finally {
            setFiring(false);
        }
    };

    const handleStartPolling = async () => {
        try {
            await googleSheetService.startPolling(30);
            setIsPolling(true);
            showAlert("Engine Started", "🚀 Background automation scanner is now active.");
        } catch (error) {
            showAlert("Error", "Failed to start automation engine");
        }
    };

    const handleStopPolling = async () => {
        try {
            await googleSheetService.stopPolling();
            setIsPolling(false);
            showAlert("Engine Stopped", "🛑 Background automation scanner has been paused.");
        } catch (error) {
            showAlert("Error", "Failed to stop automation engine");
        }
    };

    const handleStartTrigger = async (triggerId: string, isCampaign: boolean = false) => {
        setActionLoading(triggerId);
        try {
            if (isCampaign) {
                await campaignService.startCampaign(triggerId);
            } else {
                await googleSheetService.startTrigger(triggerId);
            }
            showAlert("Success", "🚀 Messages starting now...");
            fetchAllTriggers();
        } catch (error: any) {
            console.error(error);
            showAlert("Error", "❌ Failed to start trigger");
        } finally {
            setActionLoading(null);
        }
    };

    const handleStopTrigger = async (triggerId: string) => {
        setActionLoading(triggerId);
        try {
            await googleSheetService.stopTrigger(triggerId);
            showAlert("Success", "✅ Trigger stopped successfully!");
            fetchAllTriggers();
        } catch (error: any) {
            console.error(error);
            showAlert("Error", "❌ Failed to stop trigger");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteTrigger = async (trigger: any) => {
        const triggerId = trigger.trigger_id;
        const isCampaign = !!trigger.is_campaign;

        showConfirm(
            "Delete Automation",
            `Are you sure you want to delete this ${isCampaign ? 'campaign' : 'trigger'}? This action cannot be undone.`,
            async () => {
                setActionLoading(triggerId);
                try {
                    if (isCampaign) {
                        await campaignService.deleteCampaign(triggerId);
                    } else {
                        await googleSheetService.deleteTrigger(triggerId);
                    }
                    showAlert("Success", "✅ Deleted successfully!");
                    fetchAllTriggers();
                } catch (error: any) {
                    console.error(error);
                    showAlert("Error", "❌ Failed to delete");
                } finally {
                    setActionLoading(null);
                }
            }
        );
    };

    const handleCleanAllTriggers = async () => {
        showConfirm(
            "Clean All Triggers",
            "Are you sure you want to delete all triggers? This action cannot be undone.",
            async () => {
                setCleaningTriggers(true);
                let deletedCount = 0;
                let errorCount = 0;
                
                try {
                    for (const trigger of triggers) {
                        try {
                            await googleSheetService.deleteTrigger(trigger.trigger_id);
                            deletedCount++;
                        } catch (error) {
                            console.error(`Failed to delete trigger ${trigger.trigger_id}:`, error);
                            errorCount++;
                        }
                    }
                    
                    showAlert(
                        "Cleanup Complete", 
                        `Successfully deleted ${deletedCount} trigger${deletedCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
                    );
                    
                    fetchAllTriggers();
                } catch (error) {
                    console.error("Cleanup failed:", error);
                    showAlert("Error", "Failed to clean up triggers");
                } finally {
                    setCleaningTriggers(false);
                }
            }
        );
    };

    const handleCleanCompletedTriggers = async () => {
        const completedTriggerList = triggers.filter(t => 
            completedTriggers.has(t.trigger_id) || t.completion_status === "completed"
        );
        
        if (completedTriggerList.length === 0) {
            showAlert("Info", "No completed triggers found to clean up.");
            return;
        }
        
        showConfirm(
            "Clean Completed Triggers",
            `Are you sure you want to delete ${completedTriggerList.length} completed trigger${completedTriggerList.length !== 1 ? 's' : ''}?`,
            async () => {
                setCleaningTriggers(true);
                let deletedCount = 0;
                let errorCount = 0;
                
                try {
                    for (const trigger of completedTriggerList) {
                        try {
                            await googleSheetService.deleteTrigger(trigger.trigger_id);
                            deletedCount++;
                        } catch (error) {
                            console.error(`Failed to delete trigger ${trigger.trigger_id}:`, error);
                            errorCount++;
                        }
                    }
                    
                    showAlert(
                        "Cleanup Complete", 
                        `Successfully deleted ${deletedCount} completed trigger${deletedCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`
                    );
                    
                    fetchAllTriggers();
                    setCompletedTriggers(new Set());
                } catch (error) {
                    console.error("Cleanup failed:", error);
                    showAlert("Error", "Failed to clean up completed triggers");
                } finally {
                    setCleaningTriggers(false);
                }
            }
        );
    };

    const getHistoryStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'sent': return 'bg-green-100 text-green-800 border-green-200';
            case 'failed': return 'bg-red-100 text-red-800 border-red-200';
            case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const handlePauseCampaign = async (id: string) => {
        try {
            await campaignService.pauseCampaign(id);
            fetchAllTriggers();
        } catch (e) {
            showAlert("Error", "❌ Failed to pause campaign");
        }
    };

    const handleResumeCampaign = async (id: string) => {
        try {
            await campaignService.resumeCampaign(id);
            fetchAllTriggers();
        } catch (e) {
            showAlert("Error", "❌ Failed to resume campaign");
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight flex items-center gap-2">
                        <Database className="w-6 h-6 text-emerald-600" />
                        Bulk Notification Triggers
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Automate bulk messages based on Google Sheet changes</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold flex items-center gap-1.5 shadow-sm border border-emerald-200">
                             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                             AUTOMATION ACTIVE
                        </span>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <button 
                        onClick={loadDevices} 
                        disabled={refreshLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all text-xs font-medium shadow-sm"
                    >
                        <Smartphone className={`w-3 h-3 ${refreshLoading ? 'animate-spin' : ''}`} />
                        Refresh Devices
                    </button>
                    <button 
                        onClick={fetchHistory} 
                        disabled={refreshLoading}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all text-xs font-medium shadow-sm"
                    >
                        <RefreshCcw className={`w-3 h-3 ${refreshLoading ? 'animate-spin text-blue-600' : ''}`} />
                        Refresh History
                    </button>
                </div>
            </div>

            {/* Unified Triggers List - Always show active automations */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100 mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-500" />
                        Active Triggers ({triggers.filter(trigger => !hiddenTriggerIds.has(trigger.trigger_id)).length})
                    </h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchAllTriggers}
                            disabled={refreshLoading}
                            className="flex items-center gap-2 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                        >
                            <RefreshCcw className={`w-4 h-4 ${refreshLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
                
                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                        <div className="font-mono">
                            <div>Total triggers loaded: {triggers.length}</div>
                            <div>Visible triggers: {triggers.filter(trigger => !hiddenTriggerIds.has(trigger.trigger_id)).length}</div>
                            <div>Hidden triggers: {triggers.filter(trigger => hiddenTriggerIds.has(trigger.trigger_id)).length}</div>
                            <div>Target trigger exists: {triggers.some(t => t.trigger_id === '0505630f-06d1-42a5-8a23-ea5d72f8d538') ? 'YES' : 'NO'}</div>
                            <div>Visible trigger IDs: {triggers.filter(trigger => !hiddenTriggerIds.has(trigger.trigger_id)).map(t => t.trigger_id?.substring(0, 8) + '...').join(', ') || 'None'}</div>
                            <div>Hidden trigger IDs: {triggers.filter(trigger => hiddenTriggerIds.has(trigger.trigger_id)).map(t => t.trigger_id?.substring(0, 8) + '...').join(', ') || 'None'}</div>
                        </div>
                    </div>
                )}
                
                {triggers.filter(trigger => !hiddenTriggerIds.has(trigger.trigger_id)).length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Device</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {triggers.filter(trigger => !hiddenTriggerIds.has(trigger.trigger_id)).map((trigger) => {
                                    const progress = trigger.total_rows && trigger.total_rows > 0
                                        ? Math.round((trigger.processed_rows || 0) / trigger.total_rows * 100)
                                        : 0;
                                    
                                    const getStatusBadge = () => {
                                        const messageStatus = messageStatusMap.get(trigger.trigger_id);
                                        const isCurrentlySending = trigger.is_enabled && trigger.completion_status === "running";
                                        
                                        if (isCurrentlySending) {
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                                                        <Send className="w-3 h-3 animate-pulse" />
                                                        Sending Messages
                                                    </span>
                                                    {messageStatus && (
                                                        <span className="text-xs text-gray-600 font-medium">
                                                            {messageStatus.sent} / {messageStatus.total} sent
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        } else if (trigger.completion_status === "completed" || completedTriggers.has(trigger.trigger_id)) {
                                            return (
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        Completed
                                                    </span>
                                                    <span className="text-xs text-green-600 font-medium">
                                                        {trigger.processed_rows || 0} messages sent
                                                    </span>
                                                </div>
                                            );
                                        } else if (trigger.is_enabled) {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    <Activity className="w-3 h-3" />
                                                    Active
                                                </span>
                                            );
                                        } else {
                                            return (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                                    <StopCircle className="w-3 h-3" />
                                                    Stopped
                                                </span>
                                            );
                                        }
                                    };
                                    
                                    return (
                                        <tr key={trigger.trigger_id}>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {trigger.sheet_name || "File Upload"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                                                {trigger.trigger_type.replace(/_/g, " ")}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-col gap-2">
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600 font-medium">
                                                            {trigger.is_enabled && trigger.completion_status === "running" ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Send className="w-3 h-3 text-emerald-600 animate-pulse" />
                                                                    Messages Sent
                                                                </span>
                                                            ) : (
                                                                "Progress"
                                                            )}
                                                        </span>
                                                        <span className="font-bold text-gray-900">
                                                            {trigger.processed_rows || 0} / {trigger.total_rows || 0}
                                                        </span>
                                                    </div>
                                                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                        <div 
                                                            className={`h-2 rounded-full transition-all duration-500 ${
                                                                trigger.is_enabled && trigger.completion_status === "running" 
                                                                    ? "bg-emerald-500 animate-pulse" 
                                                                    : completedTriggers.has(trigger.trigger_id)
                                                                    ? "bg-green-500"
                                                                    : "bg-blue-500"
                                                            }`}
                                                            style={{ width: `${progress}%` }}
                                                        />
                                                    </div>
                                                    {trigger.is_enabled && trigger.completion_status === "running" && (
                                                        <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                            <TrendingUp className="w-3 h-3" />
                                                            {progress}% Complete
                                                        </div>
                                                    )}
                                                    {completedTriggers.has(trigger.trigger_id) && (
                                                        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                            <CheckCircle2 className="w-3 h-3" />
                                                            All messages sent!
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                {getStatusBadge()}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {trigger.multi_device_ids && trigger.multi_device_ids.length > 0 
                                                    ? `${trigger.multi_device_ids.length} Devices (RR)` 
                                                    : allDevices.find(d => d.device_id === (trigger.device_id || trigger.device_name))?.device_name || trigger.device_name || "Official API"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                                                {!trigger.is_enabled ? (
                                                    <button
                                                        onClick={() => handleStartTrigger(trigger.trigger_id)}
                                                        disabled={actionLoading === trigger.trigger_id}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50 font-bold"
                                                    >
                                                        {actionLoading === trigger.trigger_id ? "..." : "Start"}
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={() => handleStopTrigger(trigger.trigger_id)}
                                                        disabled={actionLoading === trigger.trigger_id}
                                                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs disabled:opacity-50 font-bold"
                                                    >
                                                        {actionLoading === trigger.trigger_id ? "..." : "Stop"}
                                                    </button>
                                                )}
                                                
                                                <button
                                                    onClick={() => handleDeleteTrigger(trigger)}
                                                    disabled={actionLoading === trigger.trigger_id}
                                                    className="bg-gray-100 hover:bg-red-100 text-red-600 p-1.5 rounded disabled:opacity-50 transition-colors"
                                                    title="Delete Automation"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                            <Activity className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Triggers</h3>
                        <p className="text-gray-500 mb-6">
                            {process.env.NODE_ENV === 'development' 
                                ? "No triggers found. Check console for debugging info." 
                                : "Create a trigger to start automating your WhatsApp messages."}
                        </p>
                        <button
                            onClick={fetchAllTriggers}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                        >
                            Refresh Triggers
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trigger Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-emerald-600" />
                            Trigger Configuration
                        </h2>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-xl mb-6 border border-gray-200">
                        <button
                            onClick={() => {
                                setSourceType("sheet");
                                setColumns([]); // Clear file columns
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${sourceType === "sheet" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Google Sheet
                        </button>
                        <button
                            onClick={() => {
                                setSourceType("file");
                                setColumns([]); // Clear sheet columns
                            }}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold transition-all ${sourceType === "file" ? "bg-white text-emerald-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            CSV / Excel File
                        </button>
                    </div>

                    <div className="space-y-4">
                        {sourceType === "sheet" ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet</label>
                                <select value={selectedSheetId} onChange={(e) => setSelectedSheetId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select sheet</option>
                                    {sheets.map((sheet) => (
                                        <option key={sheet.id} value={sheet.id}>
                                            {sheet.sheet_name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
                                <div 
                                    className={`flex justify-center rounded-xl border-2 border-dashed px-6 py-6 transition-all cursor-pointer ${dataSourceFile ? 'border-emerald-500/50 bg-emerald-50' : 'border-gray-300 hover:border-emerald-500/30'}`}
                                    onClick={() => document.getElementById('trigger-file-upload')?.click()}
                                >
                                    <div className="text-center">
                                        <div className="text-sm font-bold text-gray-700">
                                            {dataSourceFile ? dataSourceFile.name : "Select CSV/Excel File"}
                                        </div>
                                        <input 
                                            id="trigger-file-upload" 
                                            type="file" 
                                            accept=".csv, .xlsx, .xls"
                                            className="sr-only" 
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] || null;
                                                setDataSourceFile(file);
                                                if (file) {
                                                    const reader = new FileReader();
                                                    const extension = file.name.split('.').pop()?.toLowerCase();

                                                    reader.onload = (evt: any) => {
                                                        try {
                                                            let headers: string[] = [];
                                                            if (extension === 'csv') {
                                                                const csv = Papa.parse(evt.target.result, { header: false, preview: 1 });
                                                                if (csv.data && csv.data.length > 0) {
                                                                    headers = csv.data[0] as string[];
                                                                }
                                                            } else {
                                                                const data = new Uint8Array(evt.target.result);
                                                                const workbook = XLSX.read(data, { type: 'array' });
                                                                const firstSheetName = workbook.SheetNames[0];
                                                                const worksheet = workbook.Sheets[firstSheetName];
                                                                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                                                                if (json.length > 0) {
                                                                    headers = json[0] as string[];
                                                                }
                                                            }
                                                            
                                                            // Filter out empty headers and sanitize
                                                            const cleanHeaders = headers.filter(h => !!h).map(h => String(h).trim());
                                                            setColumns(cleanHeaders);
                                                            
                                                            // Auto-guess common column names
                                                            const phoneKey = cleanHeaders.find(h => /phone|mobile|number|contact/i.test(h)) || cleanHeaders[0] || "";
                                                            const statusKey = cleanHeaders.find(h => /status/i.test(h)) || cleanHeaders[cleanHeaders.length - 1] || "";
                                                            const messageKey = cleanHeaders.find(h => /message|body|text/i.test(h)) || "";
                                                            
                                                            setTriggerConfig(prev => ({
                                                                ...prev,
                                                                phone_column: phoneKey,
                                                                status_column: statusKey,
                                                                message_column: messageKey
                                                            }));
                                                        } catch (err) {
                                                            console.error("Failed to parse headers", err);
                                                            showAlert("Error", "Could not read file headers. Please ensure the file is valid.");
                                                        }
                                                    };

                                                    if (extension === 'csv') {
                                                        reader.readAsText(file);
                                                    } else {
                                                        reader.readAsArrayBuffer(file);
                                                    }
                                                }
                                            }} 
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Unofficial API Badge */}
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-purple-600" />
                                <span className="text-sm font-medium text-purple-800">Unofficial API Active</span>
                            </div>
                            <p className="text-xs text-purple-600 mt-1">Using Connected WhatsApp Device</p>
                        </div>


                        {/* Message Column Selection */}

                        {/* Trigger Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                            <select 
                                value={triggerConfig.trigger_type} 
                                onChange={(e) => {
                                    const newType = e.target.value;
                                    setTriggerConfig(prev => ({ ...prev, trigger_type: newType }));
                                    
                                    // Default time if switching to time-based
                                    if (newType === 'time' && !scheduledAt) {
                                        setValidFutureDate();
                                    }
                                }} 
                                className="w-full p-2 border border-gray-300 rounded-md"
                            >
                                <option value="update_row">Row Update</option>
                                <option value="new_row">New Row</option>
                                <option value="time">Time-based</option>
                            </select>
                        </div>

                        {/* Schedule Field - Show immediately after type if time-based */}
                        {triggerConfig.trigger_type === 'time' && (
                            <div className="space-y-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100 mb-2">
                                <div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[10px] text-emerald-700 font-bold uppercase mb-1 block">Date</label>
                                            <input 
                                                type="date"
                                                min={new Date().toISOString().split('T')[0]}
                                                value={scheduledAt.split('T')[0] || ""} 
                                                onChange={handleDateChange}
                                                className={`w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm text-sm ${dateError ? 'border-red-500' : 'border-blue-200'}`}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-emerald-700 font-bold uppercase mb-1 block">Time (AM/PM)</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="time"
                                                    value={scheduledAt.split('T')[1] || ""} 
                                                    onChange={(e) => {
                                                        const date = scheduledAt.split('T')[0] || new Date().toISOString().split('T')[0];
                                                        setScheduledAt(`${date}T${e.target.value}`);
                                                    }} 
                                                    className="w-full flex-1 p-2 border border-blue-200 rounded-md focus:ring-2 focus:ring-emerald-500 outline-none bg-white shadow-sm text-sm"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={setValidFutureDate}
                                                    className="p-2 bg-white border border-blue-200 text-blue-600 rounded-md hover:bg-blue-50 transition-colors shadow-sm"
                                                    title="Set to Current Time + 5 minutes"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="px-2 py-1 bg-white rounded border border-emerald-200 text-[10px] text-emerald-800 font-mono font-bold shadow-inner">
                                                {scheduledAt ? (
                                                    new Date(scheduledAt.replace('T', ' ')).toLocaleString('en-US', { 
                                                        hour: 'numeric', 
                                                        minute: 'numeric', 
                                                        hour12: true,
                                                        day: '2-digit',
                                                        month: 'short'
                                                    })
                                                ) : "Not set"}
                                            </div>
                                            <p className="text-[10px] text-emerald-600 font-medium italic">
                                                Auto-sends at this IST time
                                            </p>
                                        </div>
                                        
                                        {scheduledAt && (
                                            <div className="text-[10px] flex items-center gap-1.5 font-bold">
                                                {(() => {
                                                    const target = new Date(scheduledAt.replace('T', ' '));
                                                    const now = new Date();
                                                    const diff = target.getTime() - now.getTime();
                                                    
                                                    if (diff < 0) {
                                                        return (
                                                            <span className="text-amber-600 flex items-center gap-1">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Already passed (Sends now)
                                                            </span>
                                                        );
                                                    }
                                                    
                                                    const hours = Math.floor(diff / 3600000);
                                                    const mins = Math.floor((diff % 3600000) / 60000);
                                                    
                                                    return (
                                                        <span className="text-blue-600 flex items-center gap-1">
                                                            <Zap className="w-3 h-3 animate-pulse" />
                                                            In {hours > 0 ? `${hours}h ` : ''}{mins}m
                                                        </span>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Section 2: Device Selection (Multi-select) */}
                        <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                            <div className="flex items-center gap-2 mb-3">
                                <Smartphone className="w-4 h-4 text-blue-600" />
                                <h3 className="text-sm font-bold text-blue-900 uppercase">Select Devices (Round Robin)</h3>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {devices.length === 0 ? (
                                    <p className="text-xs text-amber-600 font-medium p-3 bg-amber-50 rounded border border-amber-100 italic">
                                        No connected devices found. Please connect unofficial devices to use this feature.
                                    </p>
                                ) : (
                                    devices.map((device, idx) => (
                                        <div
                                            key={device.device_id}
                                            onClick={() => toggleDevice(device.device_id)}
                                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none ${selectedDeviceIds.includes(device.device_id)
                                                ? 'bg-blue-600 border-blue-700 shadow-sm text-white'
                                                : 'bg-white border-gray-200 hover:border-blue-400 text-gray-700'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedDeviceIds.includes(device.device_id) ? 'bg-white border-white' : 'bg-gray-50 border-gray-300'}`}>
                                                {selectedDeviceIds.includes(device.device_id) && (
                                                    <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs">{device.device_name || `Device ${idx + 1}`}</span>
                                                <span className={`text-[10px] ${selectedDeviceIds.includes(device.device_id) ? 'text-blue-100' : 'text-gray-400'}`}>ID: {device.device_id.substring(0, 8)}...</span>
                                            </div>
                                            <div className="ml-auto">
                                                <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${device.session_status === 'connected' ? 'bg-green-400/20 text-green-700' : 'bg-red-400/20 text-red-700'}`}>
                                                    {device.session_status}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Phone Column */}
                        {columns.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Column</label>
                                <select value={triggerConfig.phone_column} onChange={(e) => setTriggerConfig(prev => ({ ...prev, phone_column: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                    <option value="">Select phone column</option>
                                    {columns.map((column) => (
                                        <option key={column} value={column}>
                                            {column}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Trigger Conditions */}
                        {triggerConfig.trigger_type !== 'time' && columns.length > 0 && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Column</label>
                                    <select value={triggerConfig.trigger_column} onChange={(e) => setTriggerConfig(prev => ({ ...prev, trigger_column: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Select trigger column</option>
                                        {columns.map((column) => (
                                            <option key={column} value={column}>
                                                {column}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Value</label>
                                    <input
                                        type="text"
                                        value={triggerConfig.trigger_value}
                                        onChange={(e) => setTriggerConfig(prev => ({ ...prev, trigger_value: e.target.value }))}
                                        placeholder="e.g., Send, Active, Yes"
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Column</label>
                                    <select value={triggerConfig.status_column} onChange={(e) => setTriggerConfig(prev => ({ ...prev, status_column: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md">
                                        <option value="">Select status column</option>
                                        {columns.map((column) => (
                                            <option key={column} value={column}>
                                                {column}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}


                        {/* Enable Trigger */}
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="is-enabled"
                                checked={triggerConfig.is_enabled}
                                onChange={(e) => setTriggerConfig(prev => ({ ...prev, is_enabled: e.target.checked }))}
                            />
                            <label htmlFor="is-enabled" className="text-sm font-medium text-gray-700">Enable trigger</label>
                        </div>

                        {/* Media Attachment */}
                        <div className="bg-emerald-50/30 p-4 rounded-xl border border-emerald-100 mt-2">
                             <div className="flex items-center gap-2 mb-3">
                                 <Upload className="w-4 h-4 text-emerald-600" />
                                 <h3 className="text-sm font-bold text-slate-800 uppercase italic">Attachment (Optional)</h3>
                             </div>

                            {!mediaFile ? (
                                <div 
                                    className="border border-dashed border-emerald-300 rounded-lg p-4 text-center hover:bg-white transition-all cursor-pointer group"
                                    onClick={() => document.getElementById('media-upload')?.click()}
                                >
                                    <input 
                                        id="media-upload"
                                        type="file" 
                                        className="hidden" 
                                        onChange={handleFileSelect}
                                        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                                    />
                                    <p className="text-xs text-slate-600 font-medium group-hover:text-emerald-600 transition-colors">Click to upload media (Image/PDF)</p>
                                </div>
                            ) : (
                                <div className="relative border border-emerald-100 rounded-lg p-2 bg-white flex items-center gap-3 shadow-sm">
                                    {mediaPreview ? (
                                        <img src={mediaPreview} alt="Preview" className="w-10 h-10 object-cover rounded border border-emerald-100" />
                                    ) : (
                                        <div className="w-10 h-10 bg-emerald-50 rounded flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-emerald-600" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-slate-800 truncate">{mediaFile.name}</p>
                                        <p className="text-[8px] text-slate-500 uppercase tracking-tighter">{(mediaFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <button 
                                        onClick={handleRemoveFile}
                                        className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors rounded-md"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveTrigger}
                            disabled={saving || selectedDeviceIds.length === 0 || 
                                (sourceType === "sheet" && !selectedSheetId) ||
                                (sourceType === "file" && !dataSourceFile) ||
                                (templates.filter(t => t.content.trim().length > 0).length === 0 && !mediaFile)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Create Trigger'}
                        </button>
                    </div>
                </div>

                {/* Sidebar: Message Templates (Match Bulk Messaging) */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                            <h2 className="text-lg font-bold text-gray-800 uppercase tracking-tight">Message Templates</h2>
                        </div>
                        <p className="text-xs text-purple-600 mb-4 bg-purple-50 p-2 rounded border border-purple-100 font-medium">
                            Fill up to 5 templates to vary your messages and prevent bans. A random delay of 15-20s will be applied between sends.
                        </p>
                        
                        <div className="space-y-4">
                            {templates.map((template, idx) => (
                                <div key={template.id} className="relative group">
                                    <label className="absolute -top-1.5 left-2.5 bg-white px-1 text-[10px] uppercase font-bold text-purple-600 z-10 border border-purple-200 rounded shadow-sm">
                                        Template {template.id}
                                    </label>
                                    <textarea
                                        value={template.content}
                                        onChange={(e) => handleTemplateChange(template.id, 'content', e.target.value)}
                                        placeholder={`Enter your message variant ${idx + 1} here... Use {{ColumnName}} for dynamic data.`}
                                        rows={4}
                                        className="w-full pt-4 pb-2 px-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm resize-none bg-white text-gray-800 shadow-sm group-hover:border-purple-200"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Quick Tips */}
                        <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
                             <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">Pro Tips</h4>
                             <ul className="text-[10px] text-gray-600 space-y-1">
                                <li>- Variables: Use Phone or Name in double curly braces</li>
                                <li>- Randomization: System cycles templates for each send</li>
                                <li>- Safety: Random 15-20s delay is active by default</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        {/* Completion Popup */}
            {showCompletionPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform scale-100 animate-pulse">
                        <div className="text-center">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Trigger Completed Successfully!
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {(() => {
                                    const completedTrigger = triggers.find((t: Trigger) => t.trigger_id === showCompletionPopup);
                                    if (!completedTrigger) return "Trigger completed successfully!";
                                    return `Trigger "${completedTrigger.sheet_name || 'File Upload'}" has completed successfully! Sent ${completedTrigger.processed_rows || 0} messages.`;
                                })()}
                            </p>
                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={() => setShowCompletionPopup(null)}
                                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => {
                                        setShowCompletionPopup(null);
                                        fetchHistory(); // Refresh history to see the results
                                    }}
                                    className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                                >
                                    View History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}