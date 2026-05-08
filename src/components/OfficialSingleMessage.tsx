"use client";

import { useState, useEffect } from "react";
import officialWhatsappService, { WhatsAppTemplate } from "@/services/officialWhatsappService";
import {
    Send,
    AlertCircle,
    CheckCircle,
    RefreshCw,
    ShieldCheck
} from "lucide-react";

interface OfficialSingleMessageProps {
    className?: string
}

export default function OfficialSingleMessage({ className = "" }: OfficialSingleMessageProps) {
    const [loading, setLoading] = useState(false);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const [sendData, setSendData] = useState({
        to_number: "",
        message_type: "text" as "text" | "template",
        text_content: "",
        selected_template: "",
        language: "en_US",
    });

    useEffect(() => {
        handleFetchTemplates();
    }, []);

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

    const handleSendMessage = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);
            if (sendData.message_type === "text") {
                await officialWhatsappService.sendTextMessage(sendData.to_number, sendData.text_content, token);
            } else {
                await officialWhatsappService.sendTemplateMessage(
                    sendData.to_number,
                    sendData.selected_template,
                    {},
                    sendData.language,
                    token
                );
            }
            setMessage({ type: "success", text: "Message sent successfully!" });
            // Clear form
            setSendData({
                ...sendData,
                to_number: "",
                text_content: "",
                selected_template: ""
            });
        } catch (error: any) {
            setMessage({ type: "error", text: error.response?.data?.detail || "Failed to send message." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden ${className}`}>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-foreground">Send Official Message (Single User)</h2>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setSendData({ ...sendData, message_type: "text" })}
                            className={`p-3 rounded-xl border text-center transition-all ${sendData.message_type === 'text' ? 'border-green-500 bg-green-500/10 text-green-600 font-bold' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        >
                            Text Message
                        </button>
                        <button
                            onClick={() => setSendData({ ...sendData, message_type: "template" })}
                            className={`p-3 rounded-xl border text-center transition-all ${sendData.message_type === 'template' ? 'border-green-500 bg-green-500/10 text-green-600 font-bold' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        >
                            Template Message
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Recipient Phone Number</label>
                        <input
                            type="text"
                            value={sendData.to_number}
                            onChange={(e) => setSendData({ ...sendData, to_number: e.target.value })}
                            className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none transition-all"
                            placeholder="e.g. 15551234567"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">Include country code without +</p>
                    </div>

                    {sendData.message_type === "text" ? (
                        <div className="space-y-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 flex gap-3 items-start">
                                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold">24-Hour Session Rule</p>
                                    <p className="mt-1">
                                        Free-form text messages can <strong>only</strong> be sent to users who have messaged you within the last 24 hours.
                                        To initiate a conversation outside this window, you <strong>must</strong> use a Template Message.
                                    </p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Message Content</label>
                                <textarea
                                    value={sendData.text_content}
                                    onChange={(e) => setSendData({ ...sendData, text_content: e.target.value })}
                                    className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none transition-all h-32"
                                    placeholder="Type your message here..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-semibold text-muted-foreground mb-1.5">Select Template</label>
                            <select
                                value={sendData.selected_template}
                                onChange={(e) => setSendData({ ...sendData, selected_template: e.target.value })}
                                className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none transition-all"
                            >
                                <option value="">-- Select a template --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.template_name} className="bg-card text-foreground">{t.template_name} ({t.language})</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Status Messages */}
                    {message && (
                        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${message.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                            {message.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {message.text}
                        </div>
                    )}

                    <button
                        onClick={handleSendMessage}
                        disabled={loading || !sendData.to_number}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                    >
                        {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                        {loading ? "Sending..." : "Send Message"}
                    </button>
                </div>
            </div>
        </div>
    )
}
