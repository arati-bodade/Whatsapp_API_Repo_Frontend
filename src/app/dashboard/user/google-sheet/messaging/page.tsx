"use client";

import { useEffect, useState } from "react";
import {
    Plus, Search, FileSpreadsheet, ExternalLink, RefreshCw, Send,
    MessageSquare, CheckCircle, XCircle, Trash2
} from "lucide-react";
import { googleSheetService, GoogleSheet } from "@/services/googleSheetService";
import { deviceService, Device } from "@/services/deviceService";
import { googleSheetUnofficialService } from "@/services/googleSheetUnofficialService";
import ConnectSheetModal from "@/components/ConnectSheetModal";
import { useModal } from "@/context/ModalContext";

export default function GoogleSheetMessagingPage() {
    const { showAlert, showConfirm } = useModal();
    const [sheets, setSheets] = useState<GoogleSheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSheet, setSelectedSheet] = useState<GoogleSheet | null>(null);
    const [fetchedRows, setFetchedRows] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [sendConfig, setSendConfig] = useState({
        text_message: "",
        phone_column: "",
        send_all: false,
        worksheet_name: ""
    });

    const [availableWorksheets, setAvailableWorksheets] = useState<string[]>([]);
    const [loadingWorksheets, setLoadingWorksheets] = useState(false);

    // Unofficial API Requirements
    const [devices, setDevices] = useState<Device[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState("");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [syncing, setSyncing] = useState(false);
    const [sending, setSending] = useState(false);
    const [showSendModal, setShowSendModal] = useState(false);
    const [showConnectModal, setShowConnectModal] = useState(false);

    useEffect(() => {
        loadSheets();
        loadDevices();
    }, []);

    const loadDevices = async () => {
        try {
            const userId = localStorage.getItem("user_id");
            if (!userId) {
                console.error("No user ID found in localStorage");
                return;
            }
            const data = await deviceService.getDevices("connected");
            setDevices(data);
        } catch (error) {
            console.error("Failed to load devices", error);
        }
    };

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

    const handleDeleteSheet = async (sheetId: string) => {
        showConfirm(
            "Delete Sheet Connection",
            "Are you sure you want to delete this connected sheet? All associated triggers and history will be removed.",
            async () => {
                try {
                    await googleSheetService.deleteSheet(sheetId);
                    showAlert("Success", "Sheet connection deleted successfully");
                    loadSheets();
                } catch (error: any) {
                    showAlert("Error", error.userMessage || "Failed to delete sheet");
                }
            }
        );
    };

    const openSendModal = async (sheet: GoogleSheet) => {
        setSelectedSheet(sheet);
        setShowSendModal(true);
        setFetchedRows([]);
        setColumns([]);

        // Attempt to load available worksheets for this sheet
        setLoadingWorksheets(true);
        try {
            const worksheets = await googleSheetService.getAvailableWorksheets(sheet.id);
            setAvailableWorksheets(worksheets);
            setSendConfig({
                text_message: "",
                phone_column: "",
                send_all: false,
                worksheet_name: worksheets.length > 0 ? worksheets[0] : (sheet.worksheet_name || "")
            });
        } catch (error) {
            console.error("Failed to fetch available worksheets:", error);
            setAvailableWorksheets(sheet.available_sheets || [sheet.worksheet_name].filter(Boolean) as string[]);
            setSendConfig({
                text_message: "",
                phone_column: "",
                send_all: false,
                worksheet_name: sheet.worksheet_name || ""
            });
        } finally {
            setLoadingWorksheets(false);
        }

        setSelectedFile(null);
    };

    const handleFetchRows = async () => {
        if (!selectedSheet) return;
        setSyncing(true);
        try {
            const res = await googleSheetService.fetchRows(selectedSheet.id, sendConfig.worksheet_name);
            if (res.headers && res.rows) {
                setFetchedRows(res.rows);
                setColumns(res.headers);
                const phone = res.headers.find((c: string) => c.toLowerCase().includes('phone') || c.toLowerCase().includes('mobile'));
                if (phone) setSendConfig(prev => ({ ...prev, phone_column: phone }));
            }
        } catch (error: any) {
            showAlert("Fetch Error", error.response?.data?.detail || "Failed to fetch rows");
        } finally {
            setSyncing(false);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedSheet || !sendConfig.phone_column) {
            showAlert("Missing Information", "Please fill all required fields and fetch rows");
            return;
        }

        if (!selectedDeviceId) {
            showAlert("Device Not Selected", "Please select a device");
            return;
        }

        const device = devices.find(d => d.device_id === selectedDeviceId);
        if (!device) return;

        if (!sendConfig.text_message && !selectedFile) {
            showAlert("Message Empty", "Please enter a text message or select a file");
            return;
        }

        setSending(true);
        try {
            const rowsToProcess = sendConfig.send_all ? fetchedRows : fetchedRows; // usually you let users select rows, but for now we use fetchedRows

            // Extract numbers and map messages
            // Assuming variable replacement can be done here or just pass raw text if backend handles it
            // For now, we will pass the exact text message to each number
            const numbers = rowsToProcess
                .map(row => row[sendConfig.phone_column])
                .filter(phone => phone && phone.trim() !== "");

            if (numbers.length === 0) {
                showAlert("No Recipients", "No valid phone numbers found in the selected rows.");
                setSending(false);
                return;
            }

            // Simple replace variables logic (e.g. {{Name}})
            const mappedMessages = rowsToProcess.map(row => {
                let msg = sendConfig.text_message;
                columns.forEach(col => {
                    const regex = new RegExp(`{{${col}}}`, 'g');
                    msg = msg.replace(regex, row[col] || "");
                });
                return msg;
            });

            // Call the dynamic router
            const result = await googleSheetUnofficialService.sendDynamic(
                device.device_id,
                device.device_name || "Unknown",
                numbers,
                mappedMessages,
                selectedFile,
                sendConfig.text_message // The unofficial API bulk backend might not support variable replacement for file+text directly, so we pass raw
            );

            showAlert("Success", "✅ Messages sent successfully!");
            setShowSendModal(false);
        } catch (error: any) {
            showAlert("Failure", `❌ ${error.message || "Failed to send messages"}`);
        } finally {
            setSending(false);
        }
    };



    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 uppercase tracking-tight">Google Sheet Messaging</h1>
                    <p className="text-gray-500 text-sm mt-1">Send bulk WhatsApp text and file messages via Google Sheets</p>
                    <div className="flex items-center gap-2 mt-2">

                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            Text + Files
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowConnectModal(true)}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg"
                >
                    <Plus className="w-4 h-4" />
                    <span>Connect New Sheet</span>
                </button>
            </div>

            {/* Sheets Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-emerald-50 text-emerald-800 text-xs font-semibold uppercase border-b">
                            <tr>
                                <th className="p-4 text-left">Sheet Name</th>
                                <th className="p-4 text-left">Spreadsheet ID</th>
                                <th className="p-4 text-left">Connected On</th>
                                <th className="p-4 text-left">Rows</th>
                                <th className="p-4 text-left">Status</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {loading ? (
                                <tr><td colSpan={6} className="p-8 text-center">Loading sheets...</td></tr>
                            ) : sheets.length === 0 ? (
                                <tr><td colSpan={6} className="p-8 text-center">No sheets connected</td></tr>
                            ) : sheets.map((sheet, index) => (
                                <tr key={index} className="hover:bg-gray-50 border-b">
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                            <span className="font-medium">{sheet.sheet_name}</span>
                                        </div>
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
                                    <td className="p-4">{new Date(sheet.connected_at).toLocaleDateString()}</td>
                                    <td className="p-4">{sheet.total_rows.toLocaleString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs ${sheet.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                            sheet.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                            {sheet.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => openSendModal(sheet)}
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                                            >
                                                <Send className="w-3 h-3" />
                                                Send
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSheet(sheet.id)}
                                                className="bg-red-50 text-red-600 hover:bg-red-100 p-1.5 rounded-md transition-colors"
                                                title="Delete Connection"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Send Modal */}
            {showSendModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <MessageSquare className="w-5 h-5 text-emerald-600" />
                                <h2 className="text-xl font-semibold">Send Bulk Messages</h2>
                            </div>

                            <div className="space-y-4">


                                {/* Device Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Device</label>
                                    <select
                                        value={selectedDeviceId}
                                        onChange={(e) => setSelectedDeviceId(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                    >
                                        <option value="">Select a connected device...</option>
                                        {devices.map(device => (
                                            <option key={device.device_id} value={device.device_id}>
                                                {device.device_name} ({device.device_type || 'Unknown Type'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* File Upload */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Optional File Attachment</label>
                                    <input
                                        type="file"
                                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Attach an image, document, or video to send along with your text.
                                    </p>
                                </div>

                                {/* Worksheet Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Worksheet</label>
                                    <select
                                        value={sendConfig.worksheet_name}
                                        onChange={(e) => {
                                            setSendConfig(prev => ({ ...prev, worksheet_name: e.target.value }));
                                            // Reset fetched rows when changing worksheet
                                            setFetchedRows([]);
                                            setColumns([]);
                                        }}
                                        disabled={loadingWorksheets}
                                        className="w-full p-2 border border-gray-300 rounded-md bg-white disabled:bg-gray-100 disabled:text-gray-500"
                                    >
                                        {loadingWorksheets ? (
                                            <option>Loading worksheets...</option>
                                        ) : availableWorksheets.length > 0 ? (
                                            availableWorksheets.map(sheetName => (
                                                <option key={sheetName} value={sheetName}>{sheetName}</option>
                                            ))
                                        ) : (
                                            <option value={sendConfig.worksheet_name || "Sheet1"}>{sendConfig.worksheet_name || "Sheet1"}</option>
                                        )}
                                    </select>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Choose which tab/worksheet to message from.
                                    </p>
                                </div>

                                {/* Text Message Input */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Text Message / Caption</label>
                                    <textarea
                                        value={sendConfig.text_message}
                                        onChange={(e) => setSendConfig(prev => ({ ...prev, text_message: e.target.value }))}
                                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                                        rows={4}
                                        placeholder="Enter your message here. Use {{ColumnName}} to insert sheet data."
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Example: Hello {"{{Name}}"}, your document is attached!
                                    </p>
                                </div>

                                {/* Fetch Rows */}
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={handleFetchRows}
                                        disabled={syncing}
                                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                                        {syncing ? 'Fetching...' : 'Fetch Sheet Rows'}
                                    </button>
                                    {fetchedRows.length > 0 && (
                                        <span className="text-sm text-gray-500">Found {fetchedRows.length} rows</span>
                                    )}
                                </div>

                                {/* Phone Column */}
                                {columns.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Column</label>
                                        <select
                                            value={sendConfig.phone_column}
                                            onChange={(e) => setSendConfig(prev => ({ ...prev, phone_column: e.target.value }))}
                                            className="w-full p-2 border border-gray-300 rounded-md"
                                        >
                                            <option value="">Select phone column</option>
                                            {columns.map((column) => (
                                                <option key={column} value={column}>{column}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Send Options */}
                                {fetchedRows.length > 0 && (
                                    <div>
                                        <label className="flex items-center space-x-2">
                                            <input
                                                type="checkbox"
                                                checked={sendConfig.send_all}
                                                onChange={(e) => setSendConfig(prev => ({ ...prev, send_all: e.target.checked }))}
                                            />
                                            <span className="text-sm">Send to all rows ({fetchedRows.length} recipients)</span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => setShowSendModal(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendMessage}
                                    disabled={sending || !sendConfig.phone_column || !selectedDeviceId || fetchedRows.length === 0 || (!sendConfig.text_message && !selectedFile)}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md disabled:opacity-50 flex items-center gap-2"
                                >
                                    <Send className="w-4 h-4" />
                                    {sending ? 'Sending...' : 'Send Bulk Message'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Connect Sheet Modal */}
            <ConnectSheetModal
                isOpen={showConnectModal}
                onClose={() => setShowConnectModal(false)}
                onSheetConnected={() => {
                    loadSheets(); // Refresh the sheets list
                    setShowConnectModal(false);
                }}
            />
        </div>
    );
}
