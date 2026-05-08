"use client";

import {
    Send,
    Users,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    ShieldCheck
} from "lucide-react";
import { useState, useEffect } from "react";
import groupService, { Group } from "@/services/groupService";
import officialWhatsappService, { WhatsAppTemplate } from "@/services/officialWhatsappService";

interface OfficialGroupMessageProps {
    className?: string
}

export default function OfficialGroupMessage({ className = "" }: OfficialGroupMessageProps) {
    const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
    const [messageType, setMessageType] = useState<"text" | "template">("template");
    const [textMessage, setTextMessage] = useState("");

    // Status states
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadGroups();
        loadTemplates();
    }, []);

    const loadGroups = async () => {
        try {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token");
            if (token) {
                const groups = await groupService.getGroups(token);
                setAvailableGroups(groups);
            }
        } catch (error) {
            console.error("Failed to load groups", error);
        }
    };

    const loadTemplates = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setLoading(true);
            const tmpls = await officialWhatsappService.getTemplates(token);
            setTemplates(tmpls.filter((t: WhatsAppTemplate) => t.template_status === 'APPROVED'));
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleGroup = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
        } else {
            setSelectedGroupIds([...selectedGroupIds, groupId]);
        }
    };

    const handleTemplateChange = (templateName: string) => {
        setSelectedTemplate(templateName);
        // Extract variables from template content (simple implementation)
        const template = templates.find(t => t.template_name === templateName);
        if (template) {
            // Find all {{variable}} patterns in the template
            const variableMatches = template.content.match(/\{\{([^}]+)\}\}/g);
            if (variableMatches) {
                const variables: Record<string, string> = {};
                variableMatches.forEach((match: string) => {
                    const varName = match.replace(/[{}]/g, '');
                    variables[varName] = '';
                });
                setTemplateVariables(variables);
            } else {
                setTemplateVariables({});
            }
        }
    };

    const handleVariableChange = (variable: string, value: string) => {
        setTemplateVariables(prev => ({
            ...prev,
            [variable]: value
        }));
    };

    const handleSendOfficialGroupMessage = async () => {
        setStatus(null);

        if (selectedGroupIds.length === 0) {
            setStatus({ type: 'error', text: "Please select at least one group" });
            return;
        }
        if (messageType === "template" && !selectedTemplate) {
            setStatus({ type: 'error', text: "Please select a template" });
            return;
        }
        if (messageType === "text" && !textMessage.trim()) {
            setStatus({ type: 'error', text: "Please enter a message" });
            return;
        }

        setIsSending(true);

        try {
            const token = localStorage.getItem("token") || localStorage.getItem("access_token");
            if (!token) {
                setStatus({ type: 'error', text: "Authentication error. Please login again." });
                setIsSending(false);
                return;
            }

            // Get all contacts from selected groups
            let totalContacts = 0;
            let sentCount = 0;
            let failedNumbers: string[] = [];

            for (const groupId of selectedGroupIds) {
                try {
                    const contacts = await groupService.getGroupContacts(token, groupId);
                    totalContacts += contacts.length;

                    // Send to each contact in the group
                    for (const contact of contacts) {
                        try {
                            if (messageType === "text") {
                                // Send text message
                                await officialWhatsappService.sendTextMessage(
                                    contact.phone,
                                    textMessage,
                                    token
                                );
                            } else {
                                // Send template message
                                await officialWhatsappService.sendTemplateMessage(
                                    contact.phone,
                                    selectedTemplate,
                                    templateVariables,
                                    "en_US", // Could be dynamic based on template
                                    token
                                );
                            }
                            sentCount++;
                        } catch (error) {
                            console.error(`Failed to send to ${contact.phone}:`, error);
                            failedNumbers.push(contact.phone);
                        }
                    }
                } catch (error) {
                    console.error(`Failed to get contacts for group ${groupId}:`, error);
                }
            }

            if (sentCount > 0) {
                setStatus({
                    type: 'success',
                    text: `Successfully sent ${messageType} message to ${sentCount} contacts across ${selectedGroupIds.length} groups${failedNumbers.length > 0 ? `. Failed: ${failedNumbers.length} numbers` : ''}`
                });
                // Clear form on success
                if (messageType === "text") {
                    setTextMessage("");
                } else {
                    setSelectedTemplate("");
                    setTemplateVariables({});
                }
            } else {
                setStatus({ type: 'error', text: "Failed to send any messages. Please check your configuration." });
            }
        } catch (error) {
            console.error("Send error:", error);
            setStatus({ type: 'error', text: "An error occurred while sending messages." });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={`bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden ${className}`}>
            <div className="p-6">
                <div className="flex items-center gap-2 mb-6">
                    <ShieldCheck className="w-6 h-6 text-green-600" />
                    <h2 className="text-xl font-bold text-foreground">Send Official Message (Group)</h2>
                </div>

                <div className="space-y-6">
                    {/* Message Type Toggle */}
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => setMessageType("text")}
                            className={`p-3 rounded-xl border text-center transition-all ${messageType === 'text' ? 'border-green-500 bg-green-500/10 text-green-600 font-bold' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        >
                            Text Message
                        </button>
                        <button
                            onClick={() => setMessageType("template")}
                            className={`p-3 rounded-xl border text-center transition-all ${messageType === 'template' ? 'border-green-500 bg-green-500/10 text-green-600 font-bold' : 'border-border text-muted-foreground hover:bg-secondary'}`}
                        >
                            Template Message
                        </button>
                    </div>

                    {/* Step 1: Select Groups */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                            Select Groups
                        </label>
                        <div className="flex flex-wrap gap-2 p-4 bg-background rounded-2xl border-2 border-dashed border-border min-h-[80px]">
                            {availableGroups.length === 0 ? (
                                <p className="text-gray-400 text-sm">No groups found. Please create groups first.</p>
                            ) : (
                                availableGroups.map(group => (
                                    <button
                                        key={group.group_id}
                                        onClick={() => toggleGroup(group.group_id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedGroupIds.includes(group.group_id)
                                            ? 'bg-green-600 text-white shadow-lg transform scale-105'
                                            : 'bg-card text-muted-foreground border border-border hover:border-green-500/50 hover:bg-green-500/5'
                                            }`}
                                    >
                                        {group.name}
                                        <span className={`ml-2 text-[10px] opacity-70 ${selectedGroupIds.includes(group.group_id) ? 'text-white' : 'text-muted-foreground'}`}>({group.contact_count})</span>
                                    </button>
                                ))
                            )}
                        </div>
                        {selectedGroupIds.length > 0 && (
                            <p className="text-xs text-muted-foreground pl-2 italic">
                                Selected: {availableGroups.filter(g => selectedGroupIds.includes(g.group_id)).map(g => g.name).join(", ")}
                            </p>
                        )}
                    </div>

                    {/* Step 2: Message Content */}
                    {messageType === "text" ? (
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
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                                    Compose Message
                                </label>
                                <textarea
                                    value={textMessage}
                                    onChange={(e) => setTextMessage(e.target.value)}
                                    className="w-full h-48 p-4 bg-background text-foreground border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all resize-none text-sm"
                                    placeholder="Type your message here..."
                                ></textarea>
                                <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
                                    <span>Markdown supported</span>
                                    <span>{textMessage.length} / 1000 characters</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                                Select WhatsApp Template
                            </label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none transition-all"
                                disabled={loading}
                            >
                                <option value="" className="bg-card text-foreground">-- Select an approved template --</option>
                                {templates.map((t: WhatsAppTemplate) => (
                                    <option key={t.id} value={t.template_name} className="bg-card text-foreground">
                                        {t.template_name} ({t.language}) - {t.category}
                                    </option>
                                ))}
                            </select>
                            {loading && <p className="text-xs text-muted-foreground">Loading templates...</p>}
                        </div>
                    )}

                    {/* Step 3: Template Variables */}
                    {Object.keys(templateVariables).length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold">3</div>
                                Template Variables
                            </label>
                            <div className="space-y-4">
                                {Object.entries(templateVariables).map(([variable, value]) => (
                                    <div key={variable} className="space-y-1.5 pl-8">
                                        <label className="block text-xs font-bold text-muted-foreground uppercase tracking-tight">
                                            {variable}
                                        </label>
                                        <input
                                            type="text"
                                            value={value}
                                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                                            className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-green-500/50 outline-none transition-all"
                                            placeholder={`Enter value for {{${variable}}}`}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Status Message */}
                    {status && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {status.text}
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4 border-t border-gray-100">
                        <button
                            onClick={handleSendOfficialGroupMessage}
                            disabled={isSending || selectedGroupIds.length === 0 || (messageType === "template" ? !selectedTemplate : !textMessage.trim())}
                            className={`w-full py-3 rounded-lg font-medium shadow-md transition-all flex items-center justify-center gap-2 ${isSending || selectedGroupIds.length === 0 || (messageType === "template" ? !selectedTemplate : !textMessage.trim())
                                    ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                                    : 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg'
                                }`}
                        >
                            {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>{isSending ? 'Sending...' : `Send ${messageType === 'text' ? 'Text' : 'Template'} Group Message`}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
