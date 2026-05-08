"use client";

import { useEffect, useState } from "react";
import {
    Columns, Filter, ArrowDownUp, Download, Info, CheckCircle, RefreshCcw, Save,
    MessageSquare, Settings, AlertCircle, Clock, Send
} from "lucide-react";
import { googleSheetService, GoogleSheet, TriggerHistory } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Template {
    id: string;
    template_name: string;
    category: string;
    language: string;
    status: string;
    content: string;
}

interface OfficialTriggerConfig {
    device_id: string;
    trigger_type: string;
    is_enabled: boolean;
    template_name: string;
    language_code: string;
    phone_column: string;
    header_param_columns: string[];
    body_param_columns: string[];
    button_param_columns: { [key: string]: string };
    trigger_column: string;
    trigger_value: string;
    status_column: string;
    schedule_column: string;
    webhook_url: string;
    execution_interval: number;
}

export default function OfficialTriggerPage() {
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [history, setHistory] = useState<TriggerHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [templatesLoading, setTemplatesLoading] = useState(false);
    const [refreshLoading, setRefreshLoading] = useState(false);
    const { showAlert } = useModal();

    // Form state
    const [selectedSheetId, setSelectedSheetId] = useState("");
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [columns, setColumns] = useState<string[]>([]);
    const [triggerConfig, setTriggerConfig] = useState<OfficialTriggerConfig>({
        device_id: "",
        trigger_type: "update_row",
        is_enabled: true,
        template_name: "",
        language_code: "en_US",
        phone_column: "",
        header_param_columns: [],
        body_param_columns: [],
        button_param_columns: {},
        trigger_column: "",
        trigger_value: "",
        status_column: "Status",
        schedule_column: "",
        webhook_url: "",
        execution_interval: 5
    });
    const [saving, setSaving] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        loadData();
        fetchHistory();

        // Auto refresh history every 10 seconds
        const interval = setInterval(() => {
            fetchHistory();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedSheetId) {
            const sheet = sheets.find(s => s.id === selectedSheetId);
            setSelectedSheet(sheet || null);
            if (sheet) {
                loadSheetColumns(sheet.id);
                loadTemplates(sheet.id);
            }
        } else {
            setSelectedSheet(null);
            setColumns([]);
            setTemplates([]);
        }
    }, [selectedSheetId, sheets]);

    const loadData = async () => {
        setLoading(true);

        // Load Sheets
        try {
            const sheetsData = await googleSheetService.listSheets();
            setSheets(sheetsData);
        } catch (error) {
            console.error("Failed to load sheets", error);
        }

        // Load Devices
        try {
            const userId = localStorage.getItem('user_id')
                || JSON.parse(localStorage.getItem('user') || '{}').user_id;

            if (userId) {
                const deviceData = await deviceService.getDevices('connected');
                setDevices(deviceData);
            }
        } catch (error) {
            console.error("Failed to load devices", error);
        }

        setLoading(false);
    };

    const loadSheetColumns = async (sheetId: string) => {
        try {
            const res = await googleSheetService.fetchRows(sheetId);
            if (res.headers) {
                setColumns(res.headers);
                
                // Auto-select common column names
                const phoneCol = res.headers.find((c: string) => 
                    c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile')
                );
                const statusCol = res.headers.find((c: string) => 
                    c.toLowerCase().includes('status') || c.toLowerCase().includes('state')
                );
                
                setTriggerConfig(prev => ({
                    ...prev,
                    phone_column: phoneCol || "",
                    status_column: statusCol || "Status"
                }));
            }
        } catch (error) {
            console.error("Failed to load sheet columns", error);
        }
    };

    const loadTemplates = async (sheetId: string) => {
        setTemplatesLoading(true);
        try {
            const data = await googleSheetService.getTemplates(sheetId);
            if (data.success) {
                setTemplates(data.templates);
            }
        } catch (error) {
            console.error("Failed to load templates", error);
        } finally {
            setTemplatesLoading(false);
        }
    };

    const fetchHistory = async () => {
        setRefreshLoading(true);
        try {
            const historyData = await googleSheetService.getAllTriggerHistory();
            setHistory(historyData);
        } catch (error: any) {
            console.error("Failed to fetch trigger history", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to refresh history";
            showAlert("Refresh Error", errorMessage);
        } finally {
            setRefreshLoading(false);
        }
    };

    const handleSaveTrigger = async () => {
        if (!selectedSheetId || !triggerConfig.device_id || !triggerConfig.template_name) {
            showAlert("Selection Required", "Please fill all required fields");
            return;
        }

        setSaving(true);
        try {
            await googleSheetService.createOfficialTemplateTrigger(selectedSheetId, triggerConfig);
            showAlert("Success", "✅ Official template trigger created successfully!");
            
            // Reset form
            setTriggerConfig({
                device_id: "",
                trigger_type: "update_row",
                is_enabled: true,
                template_name: "",
                language_code: "en_US",
                phone_column: "",
                header_param_columns: [],
                body_param_columns: [],
                button_param_columns: {},
                trigger_column: "",
                trigger_value: "",
                status_column: "Status",
                schedule_column: "",
                webhook_url: "",
                execution_interval: 5
            });
            setSelectedSheetId("");
        } catch (error: any) {
            console.error("Save trigger error:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to create trigger";
            showAlert("Error", `❌ ${errorMessage}`);
        } finally {
            setSaving(false);
        }
    };

    const toggleParamColumn = (column: string, type: 'header' | 'body') => {
        setTriggerConfig(prev => {
            const key = type === 'header' ? 'header_param_columns' : 'body_param_columns';
            const current = prev[key] as string[];
            const updated = current.includes(column)
                ? current.filter(col => col !== column)
                : [...current, column];
            return { ...prev, [key]: updated };
        });
    };

    const getTemplateStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getHistoryStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'sent': return 'bg-green-100 text-green-800';
            case 'failed': return 'bg-red-100 text-red-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Official Template Triggers</h1>
                    <p className="text-gray-500 text-sm mt-1">Automate official WhatsApp template messages based on Google Sheet changes</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Official Meta API
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Automated
                        </Badge>
                    </div>
                </div>
                <Button 
                    onClick={fetchHistory} 
                    variant="outline" 
                    disabled={refreshLoading}
                    className="flex items-center gap-2 transition-all"
                >
                    <RefreshCcw className={`w-4 h-4 ${refreshLoading ? 'animate-spin text-blue-600' : ''}`} />
                    {refreshLoading ? 'Refreshing...' : 'Refresh History'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Trigger Configuration */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-emerald-600" />
                            Trigger Configuration
                        </h2>
                        <Badge className="bg-emerald-100 text-emerald-800">
                            Official Template
                        </Badge>
                    </div>

                    <div className="space-y-4">
                        {/* Sheet Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Google Sheet</label>
                            <Select value={selectedSheetId} onValueChange={setSelectedSheetId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select sheet" />
                                </SelectTrigger>
                                <SelectContent>
                                    {sheets.map((sheet) => (
                                        <SelectItem key={sheet.id} value={sheet.id}>
                                            {sheet.sheet_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Device Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Device (for compatibility)</label>
                            <Select value={triggerConfig.device_id} onValueChange={(value) => setTriggerConfig(prev => ({ ...prev, device_id: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select device" />
                                </SelectTrigger>
                                <SelectContent>
                                    {devices.map((device) => (
                                        <SelectItem key={device.device_id} value={device.device_id}>
                                            {device.device_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Template Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Template</label>
                            {templatesLoading ? (
                                <div className="text-center py-4 text-gray-500">Loading templates...</div>
                            ) : templates.length === 0 ? (
                                <div className="text-center py-4 text-gray-500">No approved templates found</div>
                            ) : (
                                <Select value={triggerConfig.template_name} onValueChange={(value) => setTriggerConfig(prev => ({ ...prev, template_name: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select template" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.filter(t => t.status === 'approved').map((template) => (
                                            <SelectItem key={template.id} value={template.template_name}>
                                                <div className="flex items-center gap-2">
                                                    <span>{template.template_name}</span>
                                                    <Badge className={getTemplateStatusColor(template.status)}>
                                                        {template.status}
                                                    </Badge>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Trigger Type */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Type</label>
                            <Select value={triggerConfig.trigger_type} onValueChange={(value) => setTriggerConfig(prev => ({ ...prev, trigger_type: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select trigger type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="update_row">Row Update</SelectItem>
                                    <SelectItem value="new_row">New Row</SelectItem>
                                    <SelectItem value="time">Time-based</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Phone Column */}
                        {columns.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Column</label>
                                <Select value={triggerConfig.phone_column} onValueChange={(value) => setTriggerConfig(prev => ({ ...prev, phone_column: value }))}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select phone column" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns.map((column) => (
                                            <SelectItem key={column} value={column}>
                                                {column}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Trigger Conditions */}
                        {triggerConfig.trigger_type !== 'time' && columns.length > 0 && (
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Column</label>
                                    <Select value={triggerConfig.trigger_column} onValueChange={(value) => setTriggerConfig(prev => ({ ...prev, trigger_column: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select trigger column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((column) => (
                                                <SelectItem key={column} value={column}>
                                                    {column}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Trigger Value</label>
                                    <Input
                                        value={triggerConfig.trigger_value}
                                        onChange={(e) => setTriggerConfig(prev => ({ ...prev, trigger_value: e.target.value }))}
                                        placeholder="e.g., Send, Active, Yes"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Column</label>
                                    <Select value={triggerConfig.status_column} onValueChange={(value) => setTriggerConfig(prev => ({ ...prev, status_column: value }))}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status column" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {columns.map((column) => (
                                                <SelectItem key={column} value={column}>
                                                    {column}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}

                        {/* Parameter Mapping */}
                        {columns.length > 0 && (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Header Parameters</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {columns.map((column) => (
                                            <div key={column} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`header-${column}`}
                                                    checked={triggerConfig.header_param_columns.includes(column)}
                                                    onCheckedChange={() => toggleParamColumn(column, 'header')}
                                                />
                                                <label htmlFor={`header-${column}`} className="text-sm">{column}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Body Parameters</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {columns.map((column) => (
                                            <div key={column} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`body-${column}`}
                                                    checked={triggerConfig.body_param_columns.includes(column)}
                                                    onCheckedChange={() => toggleParamColumn(column, 'body')}
                                                />
                                                <label htmlFor={`body-${column}`} className="text-sm">{column}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Enable Trigger */}
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is-enabled"
                                checked={triggerConfig.is_enabled}
                                onCheckedChange={(checked) => setTriggerConfig(prev => ({ ...prev, is_enabled: checked as boolean }))}
                            />
                            <label htmlFor="is-enabled" className="text-sm font-medium text-gray-700">Enable trigger</label>
                        </div>

                        {/* Save Button */}
                        <Button 
                            onClick={handleSaveTrigger} 
                            disabled={saving || !selectedSheetId || !triggerConfig.device_id || !triggerConfig.template_name}
                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {saving ? 'Saving...' : 'Create Official Template Trigger'}
                        </Button>
                    </div>
                </div>

                {/* Trigger History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-emerald-600" />
                            Trigger History
                        </h2>
                        <Badge className="bg-gray-100 text-gray-800">
                            {history.length} records
                        </Badge>
                    </div>

                    <div className="space-y-3 max-h-96 overflow-y-auto">
                        {history.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                No trigger history yet
                            </div>
                        ) : (
                            history.map((item, index) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Badge className={getHistoryStatusColor(item.status)}>
                                                {item.status}
                                            </Badge>
                                            <span className="text-sm text-gray-500">
                                                {new Date(item.triggered_at).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <div className="text-gray-900 font-medium">{item.phone_number}</div>
                                        {item.message_content && (
                                            <div className="text-gray-600 mt-1 truncate">{item.message_content}</div>
                                        )}
                                        {item.error_message && (
                                            <div className="text-red-600 text-xs mt-1">{item.error_message}</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
