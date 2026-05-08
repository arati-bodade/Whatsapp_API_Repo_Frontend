"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import officialWhatsappService, { WhatsAppTemplate, WhatsAppOfficialConfig, WebhookLog } from "@/services/officialWhatsappService";
import {
    Copy, RefreshCw, Save, ShieldCheck,
    MessageSquare, List, CheckCircle2, AlertCircle, FileText
} from "lucide-react";

function OfficialWhatsAppPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Get active tab from URL or default to 'config'
    const activeTab = searchParams.get("tab") || "config";
    
    // Redirect to config tab if trying to access the removed 'send' tab
    useEffect(() => {
        if (activeTab === "send") {
            router.push("/dashboard/user/official-whatsapp?tab=config");
        }
    }, [activeTab, router]);

    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<WhatsAppOfficialConfig | null>(null);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
    const [status, setStatus] = useState<"active" | "inactive" | null>(null);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Form States
    const [formData, setFormData] = useState({
        business_number: "",
        waba_id: "",
        phone_number_id: "",
        access_token: "",
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        if (activeTab === "templates") {
            handleFetchTemplates();
        } else if (activeTab === "logs") {
            handleFetchWebhookLogs();
        }
    }, [activeTab]);

    const handleTabChange = (tab: string) => {
        router.push(`/dashboard/user/official-whatsapp?tab=${tab}`);
    };

    const formatError = (error: any) => {
        const rawMsg = error?.response?.data?.detail || error?.response?.data?.error_message || error?.message || "Unknown error";
        
        // Check if rawMsg is a JSON string (sometimes backend returns Meta's raw error)
        try {
            const parsed = JSON.parse(rawMsg);
            if (parsed.error && parsed.error.message) {
                const metaErr = parsed.error;
                if (metaErr.code === 190 || metaErr.error_subcode === 463 || metaErr.error_subcode === 467) {
                    return "Your Meta Access Token has expired. Please generate a new one and update it here.";
                }
                return metaErr.message;
            }
        } catch {
            // Not JSON, continue
        }

        return rawMsg;
    };

    const fetchConfig = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);
            const data = await officialWhatsappService.getConfig(token);

            if (data && data.whatsapp_official) {
                setConfig(data.whatsapp_official);
                setFormData({
                    business_number: data.whatsapp_official.business_number,
                    waba_id: data.whatsapp_official.waba_id,
                    phone_number_id: data.whatsapp_official.phone_number_id,
                    access_token: data.whatsapp_official.access_token,
                });
                setStatus(data.is_active ? "active" : "inactive");
            } else {
                setConfig(null);
                setStatus("inactive");
                setFormData({
                    business_number: "",
                    waba_id: "",
                    phone_number_id: "",
                    access_token: "",
                });
            }
        } catch (error) {
            console.error("Failed to fetch WhatsApp config:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveConfig = async () => {
        const token = localStorage.getItem("token");
        const userId = localStorage.getItem("user_id"); // Used only for payload construction logic if needed, but ID is from token validation
        if (!token || !userId) return;

        try {
            setLoading(true);
            const payload = {
                busi_user_id: userId, // Legacy requirement for payload shape, but ignored/validated by backend
                whatsapp_official: {
                    ...formData,
                    template_status: "pending"
                },
                is_active: true
            };

            await officialWhatsappService.createConfig(payload, token);

            setMessage({ type: "success", text: "Configuration saved successfully!" });
            await fetchConfig();
        } catch (error: any) {
            console.error("Save config error:", error);
            const errorMsg = formatError(error);
            setMessage({ type: "error", text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncTemplates = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);
            await officialWhatsappService.syncTemplates(token);
            await handleFetchTemplates();
            setMessage({ type: "success", text: "Templates synced successfully!" });
        } catch (error) {
            setMessage({ type: "error", text: formatError(error) });
        } finally {
            setLoading(false);
        }
    };

    const handleFetchTemplates = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);
            const tmpls = await officialWhatsappService.getTemplates(token);
            setTemplates(tmpls);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFetchWebhookLogs = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);
            const response = await officialWhatsappService.getWebhookLogs(token);
            if (response && response.webhook_logs) {
                setWebhookLogs(response.webhook_logs);
            }
        } catch (error) {
            console.error("Failed to fetch webhook logs:", error);
        } finally {
            setLoading(false);
        }
    };

    
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold bg-linear-to-r from-green-600 to-green-400 bg-clip-text text-transparent">
                        Official WhatsApp API
                    </h1>
                    <p className="text-gray-500 mt-1">Manage your official Meta WhatsApp Cloud API connection</p>
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {status === 'active' ? '● Connected' : '○ Not Configured'}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 border-b border-gray-200 overflow-x-auto">
                <button
                    onClick={() => handleTabChange("config")}
                    className={`pb-3 px-4 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === "config" ? "border-b-2 border-green-500 text-green-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <ShieldCheck size={18} /> Configuration
                </button>
                <button
                    onClick={() => handleTabChange("templates")}
                    className={`pb-3 px-4 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === "templates" ? "border-b-2 border-green-500 text-green-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <List size={18} /> Templates
                </button>
                                <button
                    onClick={() => handleTabChange("logs")}
                    className={`pb-3 px-4 flex items-center gap-2 transition-colors whitespace-nowrap ${activeTab === "logs" ? "border-b-2 border-green-500 text-green-600 font-medium" : "text-gray-500 hover:text-gray-700"}`}
                >
                    <FileText size={18} /> Webhook Logs
                </button>
            </div>

            {/* Message Alert */}
            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    {message.text}
                    <button onClick={() => setMessage(null)} className="ml-auto hover:opacity-70">×</button>
                </div>
            )}

            {/* Configuration Tab */}
            {activeTab === "config" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-6">
                        <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                            <ShieldCheck className="text-green-600" /> API Credentials
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Business Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.business_number}
                                    onChange={(e) => setFormData({ ...formData, business_number: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="+1 555 000 0000"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Business Account ID (WABA ID)</label>
                                <input
                                    type="text"
                                    value={formData.waba_id}
                                    onChange={(e) => setFormData({ ...formData, waba_id: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="e.g. 100012345678901"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number ID</label>
                                <input
                                    type="text"
                                    value={formData.phone_number_id}
                                    onChange={(e) => setFormData({ ...formData, phone_number_id: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                                    placeholder="e.g. 100098765432109"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">System User Access Token</label>
                                <textarea
                                    value={formData.access_token}
                                    onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                                    className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all h-24 font-mono text-sm"
                                    placeholder="EAAG..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Never share this token. It grants access to your WhatsApp Business API.</p>
                            </div>
                            <button
                                onClick={handleSaveConfig}
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 rounded-lg transition-colors flex justify-center items-center gap-2"
                            >
                                {loading ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                                Save Configuration
                            </button>
                        </div>
                    </div>

                    <div className="bg-linear-to-br from-emerald-50 to-teal-50 p-6 rounded-xl border border-emerald-100">
                        <h3 className="text-lg font-semibold text-emerald-800 mb-4">Setup Instructions</h3>
                        <ul className="space-y-3 text-sm text-emerald-800">
                            <li className="flex gap-2">
                                <span className="bg-emerald-200 text-emerald-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</span>
                                Go to developers.facebook.com and create an App.
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-green-200 text-green-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</span>
                                Add the "WhatsApp" product to your app.
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-green-200 text-green-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</span>
                                Generate a System User Access Token with 'whatsapp_business_messaging' permission.
                            </li>
                            <li className="flex gap-2">
                                <span className="bg-green-200 text-green-800 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0">4</span>
                                Copy your Phone Number ID and WABA ID from the WhatsApp &gt; API Setup page.
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* Templates Tab */}
            {activeTab === "templates" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Message Templates</h3>
                            <p className="text-sm text-gray-500">Manage your approved WhatsApp templates</p>
                        </div>
                        <button
                            onClick={handleSyncTemplates}
                            disabled={loading}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Sync from Meta
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {templates.map((tmpl) => (
                            <div key={tmpl.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-3">
                                    <h4 className="font-semibold text-gray-900 truncate" title={tmpl.template_name}>{tmpl.template_name}</h4>
                                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${tmpl.template_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        tmpl.template_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {tmpl.template_status.toLowerCase()}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-400 mb-4 flex gap-3">
                                    <span>{tmpl.category}</span>
                                    <span>•</span>
                                    <span>{tmpl.language}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 h-32 overflow-y-auto mb-3">
                                    {tmpl.content}
                                </div>
                                <div className="flex justify-end">
                                    <span className={`text-xs px-2 py-1 rounded-full capitalize ${tmpl.template_status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                        tmpl.template_status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                            'bg-yellow-100 text-yellow-700'
                                        }`}>
                                        {tmpl.template_status.toLowerCase()}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {templates.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                                <MessageSquare className="mx-auto mb-3 text-gray-400" size={32} />
                                <p>No templates found. Click "Sync from Meta" to fetch your templates.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Webhook Logs Tab */}
            {activeTab === "logs" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div>
                            <h3 className="text-xl font-semibold text-gray-800">Webhook Logs</h3>
                            <p className="text-sm text-gray-500">View incoming events from WhatsApp</p>
                        </div>
                        <button
                            onClick={handleFetchWebhookLogs}
                            disabled={loading}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
                        </button>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payload Preview</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {webhookLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(log.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                {log.event_type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="max-w-md truncate font-mono text-xs">
                                                {JSON.stringify(log.webhook_event)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {webhookLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                            No logs found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function OfficialWhatsAppPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        }>
            <OfficialWhatsAppPageContent />
        </Suspense>
    )
}
