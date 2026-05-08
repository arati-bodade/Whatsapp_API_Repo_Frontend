"use client";

import {
    Send,
    Paperclip,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import groupService, { Group } from "@/services/groupService";

interface UnofficialGroupMessageProps {
    className?: string
}

export default function UnofficialGroupMessage({ className = "" }: UnofficialGroupMessageProps) {
    const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
    const [messageText, setMessageText] = useState("");

    // Status states
    const [isSending, setIsSending] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
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
        loadGroups();
    }, []);

    const toggleGroup = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
        } else {
            setSelectedGroupIds([...selectedGroupIds, groupId]);
        }
    };

    const handleSendCallback = async () => {
        setStatus(null);

        if (selectedGroupIds.length === 0) {
            setStatus({ type: 'error', text: "Please select at least one group" });
            return;
        }
        if (!messageText.trim()) {
            setStatus({ type: 'error', text: "Message body cannot be empty" });
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

            const response = await groupService.sendMessage(token, selectedGroupIds, messageText);

            if (response.success) {
                setStatus({
                    type: 'success',
                    text: `Sent successfully to ${response.sent} contacts across ${response.total_groups} groups.`
                });
                setMessageText("");
            } else {
                setStatus({ type: 'error', text: "Failed to send messages. Please try again." });
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
                <h2 className="text-xl font-bold text-foreground mb-6">Send Group Message</h2>

                <div className="space-y-6">
                    {/* Step 1: Select Groups */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">1</div>
                            Select Groups
                        </label>
                        <div className="flex flex-wrap gap-2 p-4 bg-background rounded-2xl border-2 border-dashed border-border min-h-[80px]">
                            {availableGroups.length === 0 ? (
                                <p className="text-muted-foreground text-sm">No groups found. Please create groups first.</p>
                            ) : (
                                availableGroups.map(group => (
                                    <button
                                        key={group.group_id}
                                        onClick={() => toggleGroup(group.group_id)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedGroupIds.includes(group.group_id)
                                            ? 'bg-amber-600 text-white shadow-lg transform scale-105'
                                            : 'bg-card text-muted-foreground border border-border hover:border-amber-500/50 hover:bg-amber-500/5'
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
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">2</div>
                            Compose Message
                        </label>
                        <div className="relative">
                            <textarea
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                className="w-full h-48 p-4 bg-background text-foreground border border-border rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all resize-none text-sm"
                                placeholder="Type your message here..."
                            ></textarea>
                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                <button className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Attach File">
                                    <Paperclip className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-400 px-1">
                            <span>Markdown supported</span>
                            <span>{messageText.length} / 1000 characters</span>
                        </div>
                    </div>

                    {/* Status Message */}
                    {status && (
                        <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                            {status.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {status.text}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-6 flex flex-col sm:flex-row items-center gap-4 justify-end border-t border-border">
                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-border text-muted-foreground font-semibold hover:bg-secondary transition-all w-full sm:w-auto justify-center">
                            <Clock className="w-4 h-4" />
                            <span>Schedule Later</span>
                        </button>
                        <button
                            onClick={handleSendCallback}
                            disabled={isSending}
                            className={`flex items-center gap-2 px-8 py-2.5 rounded-xl text-white font-bold shadow-lg transition-all w-full sm:w-auto justify-center ${isSending ? 'bg-amber-300 cursor-not-allowed' : 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/20 hover:shadow-xl active:scale-95'
                                }`}
                        >
                            {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span>{isSending ? 'Sending...' : 'Send Message'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
