"use client";

import { useEffect, useState } from "react";
import {
    Filter, Download, Plus, Search, ChevronLeft, ChevronRight,
    MoreHorizontal, FileSpreadsheet, Calendar, ExternalLink, RefreshCw, Send,
    MessageSquare, Settings, CheckCircle, XCircle, AlertCircle
} from "lucide-react";
import { googleSheetService, GoogleSheet } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useModal } from "@/context/ModalContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Template {
    id: string;
    template_name: string;
    category: string;
    language: string;
    status: string;
    content: string;
}

interface OfficialSendConfig {
    device_id: string;
    template_name: string;
    language_code: string;
    phone_column: string;
    header_param_columns: string[];
    body_param_columns: string[];
    button_param_columns: { [key: string]: string };
    send_all: boolean;
}

export default function GoogleSheetOfficialMessagingPage() {
    const { showAlert, showConfirm } = useModal();
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [devices, setDevices] = useState<Device[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // Connect Sheet State
    const [isConnectOpen, setIsConnectOpen] = useState(false);
    const [newSheetData, setNewSheetData] = useState({ sheet_name: "", spreadsheet_id: "", worksheet_name: "Sheet1" });

    // Send Message State
    const [isSendOpen, setIsSendOpen] = useState(false);
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [fetchedRows, setFetchedRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [sendConfig, setSendConfig] = useState<OfficialSendConfig>({
        device_id: "",
        template_name: "",
        language_code: "en_US",
        phone_column: "",
        header_param_columns: [],
        body_param_columns: [],
        button_param_columns: {},
        send_all: false
    });
    const [syncing, setSyncing] = useState(false);
    const [sending, setSending] = useState(false);
    const [templatesLoading, setTemplatesLoading] = useState(false);

    // Fetch Sheets
    useEffect(() => {
        loadSheets();
    }, []);

    const loadSheets = async () => {
        setLoading(true);
        try {
            const data = await googleSheetService.listSheets();
            setSheets(data);
        } catch (error) {
            console.error("Failed to load sheets", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectSheet = async () => {
        try {
            await googleSheetService.connectSheet(newSheetData);
            setIsConnectOpen(false);
            setNewSheetData({ sheet_name: "", spreadsheet_id: "", worksheet_name: "Sheet1" });
            loadSheets();
        } catch (error: any) {
            console.error("Connect sheet error:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to connect sheet. Check ID.";
            showAlert("Error", errorMessage);
        }
    };

    const handleDeleteSheet = async (id: string) => {
        showConfirm(
            "Delete Sheet Connection",
            "Are you sure you want to delete this sheet connection?",
            async () => {
                try {
                    await googleSheetService.deleteSheet(id);
                    showAlert("Success", "Sheet connection deleted successfully");
                    loadSheets();
                } catch (error) {
                    showAlert("Error", "Failed to delete sheet");
                }
            }
        );
    };

    // Handle Send Flow
    const openSendModal = async (sheet: GoogleSheet) => {
        setSelectedSheet(sheet);
        setIsSendOpen(true);
        setFetchedRows([]);
        setColumns([]);
        setSendConfig({
            device_id: "",
            template_name: "",
            language_code: "en_US",
            phone_column: "",
            header_param_columns: [],
            body_param_columns: [],
            button_param_columns: {},
            send_all: false
        });

        // Fetch devices
        try {
            const userId = localStorage.getItem('user_id')
                || JSON.parse(localStorage.getItem('user') || '{}').user_id;

            if (userId) {
                const deviceData = await deviceService.getDevices('connected');
                setDevices(deviceData);
            } else {
                console.warn("No user_id found in localStorage");
            }
        } catch (error) {
            console.error("Failed to load devices", error);
        }

        // Fetch templates
        await loadTemplates(sheet.id);
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

    const handleFetchRows = async () => {
        if (!selectedSheet) return;
        setSyncing(true);
        try {
            const res = await googleSheetService.fetchRows(selectedSheet.id);
            if (res.headers && res.rows) {
                setFetchedRows(res.rows);
                setColumns(res.headers);

                // Auto-select phone column if found
                const phone = res.headers.find((c: string) => c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile'));
                if (phone) setSendConfig(prev => ({ ...prev, phone_column: phone }));
            }
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.detail || "Failed to fetch rows. Ensure the Google Sheet is 'Everyone with the link can view'.";
            showAlert("Fetch Error", msg);
        } finally {
            setSyncing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedSheet || !sendConfig.device_id || !sendConfig.template_name || !sendConfig.phone_column) {
            showAlert("Selection Required", "Please fill all required fields and fetch rows");
            return;
        }

        setSending(true);
        try {
            const payload = {
                ...sendConfig,
                selected_rows: sendConfig.send_all ? [] : fetchedRows
            };

            const result = await googleSheetService.sendOfficialTemplate(selectedSheet.id, payload);
            
            if (result.sent > 0) {
                showAlert("Success", `✅ Official template messages sent successfully!\nSent: ${result.sent}, Failed: ${result.failed}`);
                if (result.message_ids && result.message_ids.length > 0) {
                    console.log("Message IDs (wamid):", result.message_ids);
                }
            } else {
                showAlert("Failure", `❌ Failed to send messages.\nErrors: ${result.errors.join(', ')}`);
            }
            
            setIsSendOpen(false);
        } catch (error: any) {
            console.error("Send error:", error);
            const errorMessage = error.response?.data?.detail || error.message || "Failed to send official template messages";
            showAlert("Error", `❌ ${errorMessage}`);
        } finally {
            setSending(false);
        }
    };

    const toggleParamColumn = (column: string, type: 'header' | 'body') => {
        setSendConfig(prev => {
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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Official WhatsApp Template Messaging</h1>
                    <p className="text-gray-500 text-sm mt-1">Send approved WhatsApp templates via Google Sheets integration</p>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Official Meta API
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800">
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Template Only
                        </Badge>
                    </div>
                </div>
                <Button onClick={() => setIsConnectOpen(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="w-4 h-4" />
                    <span>Connect New Sheet</span>
                </Button>
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex p-4 border-b border-gray-100 gap-4">
                    <div className="relative w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="Search sheets..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-linear-to-r from-emerald-50 to-teal-50 text-emerald-800 text-xs font-semibold tracking-wider uppercase border-b border-emerald-100">
                            <tr>
                                <th className="p-4 w-10">
                                    <input type="checkbox" className="rounded border-emerald-200 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                                </th>
                                <th className="p-4 font-semibold min-w-[200px]">Sheet Name</th>
                                <th className="p-4 font-semibold min-w-[150px]">Spreadsheet ID</th>
                                <th className="p-4 font-semibold min-w-[120px]">Connected On</th>
                                <th className="p-4 font-semibold min-w-[100px]">Rows</th>
                                <th className="p-4 font-semibold min-w-[100px]">Status</th>
                                <th className="p-4 font-semibold w-24 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600 divide-y divide-emerald-50">
                            {loading ? (
                                <tr><td colSpan={7} className="p-8 text-center">Loading sheets...</td></tr>
                            ) : sheets.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center">No sheets connected. Click 'Connect New Sheet' to start.</td></tr>
                            ) : sheets.map((sheet, index) => (
                                <tr key={index} className="hover:bg-emerald-50/40 transition-colors duration-150 group">
                                    <td className="p-4">
                                        <input type="checkbox" className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer" />
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span className="font-medium text-gray-900">{sheet.sheet_name}</span>
                                        </div>
                                        {sheet.worksheet_name && sheet.worksheet_name !== "Sheet1" && (
                                            <div className="text-xs text-gray-500 mt-1">Worksheet: {sheet.worksheet_name}</div>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <code className="text-xs bg-gray-100 px-2 py-1 rounded">{sheet.spreadsheet_id}</code>
                                            <button
                                                onClick={() => window.open(`https://docs.google.com/spreadsheets/d/${sheet.spreadsheet_id}`, '_blank')}
                                                className="text-emerald-600 hover:text-emerald-700"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="text-gray-900">{new Date(sheet.connected_at).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(sheet.connected_at).toLocaleTimeString()}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{sheet.total_rows.toLocaleString()}</span>
                                            {sheet.last_synced_at && (
                                                <div className="text-xs text-gray-500">Synced: {new Date(sheet.last_synced_at).toLocaleDateString()}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <Badge className={
                                            sheet.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            sheet.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-red-100 text-red-800'
                                        }>
                                            {sheet.status}
                                        </Badge>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => openSendModal(sheet)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                            >
                                                <Send className="w-4 h-4 mr-1" />
                                                Send
                                            </Button>
                                            <button
                                                onClick={() => handleDeleteSheet(sheet.id)}
                                                className="text-red-600 hover:text-red-700 p-1"
                                            >
                                                <XCircle className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Connect Sheet Dialog */}
            <Dialog open={isConnectOpen} onOpenChange={setIsConnectOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Connect Google Sheet</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name</label>
                            <Input
                                value={newSheetData.sheet_name}
                                onChange={(e) => setNewSheetData(prev => ({ ...prev, sheet_name: e.target.value }))}
                                placeholder="My Customer Sheet"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Spreadsheet ID</label>
                            <Input
                                value={newSheetData.spreadsheet_id}
                                onChange={(e) => setNewSheetData(prev => ({ ...prev, spreadsheet_id: e.target.value }))}
                                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                            />
                            <p className="text-xs text-gray-500 mt-1">From Google Sheets URL: /d/SPREADSHEET_ID/edit</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Worksheet Name (optional)</label>
                            <Input
                                value={newSheetData.worksheet_name}
                                onChange={(e) => setNewSheetData(prev => ({ ...prev, worksheet_name: e.target.value }))}
                                placeholder="Sheet1"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConnectOpen(false)}>Cancel</Button>
                        <Button onClick={handleConnectSheet}>Connect Sheet</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Official Template Dialog */}
            <Dialog open={isSendOpen} onOpenChange={setIsSendOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-emerald-600" />
                            Send Official WhatsApp Template
                        </DialogTitle>
                        <p className="text-sm text-gray-500">Send approved WhatsApp templates to Google Sheet recipients</p>
                    </DialogHeader>
                    
                    <div className="space-y-6">
                        {/* Device Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Device (for compatibility)</label>
                            <Select value={sendConfig.device_id} onValueChange={(value) => setSendConfig(prev => ({ ...prev, device_id: value }))}>
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
                                <div className="text-center py-4 text-gray-500">No approved templates found. Please create templates first.</div>
                            ) : (
                                <div className="grid gap-2">
                                    {templates.filter(t => t.status === 'approved').map((template) => (
                                        <div
                                            key={template.id}
                                            className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                                                sendConfig.template_name === template.template_name
                                                    ? 'border-emerald-500 bg-emerald-50'
                                                    : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                            onClick={() => setSendConfig(prev => ({ ...prev, template_name: template.template_name }))}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-medium">{template.template_name}</div>
                                                    <div className="text-sm text-gray-500">{template.category} • {template.language}</div>
                                                </div>
                                                <Badge className={getTemplateStatusColor(template.status)}>
                                                    {template.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Language Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Template Language</label>
                            <Select value={sendConfig.language_code} onValueChange={(value) => setSendConfig(prev => ({ ...prev, language_code: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en_US">English (US)</SelectItem>
                                    <SelectItem value="en_GB">English (UK)</SelectItem>
                                    <SelectItem value="es">Spanish</SelectItem>
                                    <SelectItem value="fr">French</SelectItem>
                                    <SelectItem value="de">German</SelectItem>
                                    <SelectItem value="pt">Portuguese</SelectItem>
                                    <SelectItem value="hi">Hindi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Fetch Rows Button */}
                        <div className="flex items-center gap-4">
                            <Button onClick={handleFetchRows} disabled={syncing} variant="outline">
                                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Fetching...' : 'Fetch Sheet Rows'}
                            </Button>
                            {fetchedRows.length > 0 && (
                                <span className="text-sm text-gray-500">Found {fetchedRows.length} rows</span>
                            )}
                        </div>

                        {/* Phone Column Selection */}
                        {columns.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number Column</label>
                                <Select value={sendConfig.phone_column} onValueChange={(value) => setSendConfig(prev => ({ ...prev, phone_column: value }))}>
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
                                                    checked={sendConfig.header_param_columns.includes(column)}
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
                                                    checked={sendConfig.body_param_columns.includes(column)}
                                                    onCheckedChange={() => toggleParamColumn(column, 'body')}
                                                />
                                                <label htmlFor={`body-${column}`} className="text-sm">{column}</label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Send Options */}
                        {fetchedRows.length > 0 && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Send Options</label>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="send-all"
                                        checked={sendConfig.send_all}
                                        onCheckedChange={(checked) => setSendConfig(prev => ({ ...prev, send_all: checked as boolean }))}
                                    />
                                    <label htmlFor="send-all" className="text-sm">Send to all rows ({fetchedRows.length} recipients)</label>
                                </div>
                                {!sendConfig.send_all && (
                                    <p className="text-xs text-gray-500 mt-1">Will send to {fetchedRows.length} fetched rows</p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSendOpen(false)}>Cancel</Button>
                        <Button 
                            onClick={handleSendMessage} 
                            disabled={sending || !sendConfig.template_name || !sendConfig.phone_column || fetchedRows.length === 0}
                            className="bg-emerald-600 hover:bg-emerald-700"
                        >
                            <Send className="w-4 h-4 mr-2" />
                            {sending ? 'Sending...' : 'Send Official Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
