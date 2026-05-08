"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { replyService, InboxMessage, DeviceInfo } from "@/services/replyService";
import {
    MessageSquare, Search, RefreshCw, MoreVertical, User, Smartphone, Wifi, WifiOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChatLayout, ConversationPanel, ChatListPanel } from "@/components/ui/chat-layout";
import { MessageBubble, ChatListItem, MessageInput } from "@/components/ui/chat-components";
import "@/styles/manage-replies.css";

// --- Types ---
interface ChatMessage {
    id: string;
    text: string;
    timestamp: string;
    direction: 'incoming' | 'outgoing';
    status?: 'sent' | 'delivered' | 'read';
    originalMsgId: string;
}

// --- Main Page Component ---
export default function ManageRepliesPage() {
    const [messages, setMessages] = useState<InboxMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhone, setSelectedPhone] = useState<string | null>(null);
    const [messageText, setMessageText] = useState("");
    const [optimisticMessages, setOptimisticMessages] = useState<{ [key: string]: ChatMessage[] }>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Device selector state
    const [devices, setDevices] = useState<DeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);

    // Load devices on mount
    useEffect(() => {
        replyService.getActiveDevices().then(devs => {
            setDevices(devs);
            // Auto-select the first connected device
            const connected = devs.find(d => d.is_connected);
            if (connected) setSelectedDeviceId(connected.device_id);
        }).catch(console.error);
    }, []);


    // --- Message Sending Logic ---
    const handleSendMessage = async (text: string) => {
        if (!text.trim() || !selectedPhone) return;

        // Track the optimistic message ID so we can roll it back on failure
        const optimisticId = `out_${Date.now()}_${Math.random()}`;

        try {
            // Find the most recent inbox message to attach this reply to
            const rawMsgs = groupedConversations[selectedPhone];
            if (!rawMsgs || rawMsgs.length === 0) {
                alert("Cannot reply: No conversation thread found.");
                return;
            }

            const sortedRaw = [...rawMsgs].sort((a, b) => new Date(b.incoming_time).getTime() - new Date(a.incoming_time).getTime());
            const targetMsg = sortedRaw[0];

            if (!targetMsg) return;

            // Optimistic update: Add the outgoing message immediately
            const optimisticMessage: ChatMessage = {
                id: optimisticId,
                text: text,
                timestamp: new Date().toISOString(),
                direction: 'outgoing',
                status: 'sent',
                originalMsgId: targetMsg.id
            };

            // Add optimistic message to state
            setOptimisticMessages(prev => ({
                ...prev,
                [selectedPhone]: [...(prev[selectedPhone] || []), optimisticMessage]
            }));

            // Clear input immediately for better UX
            setMessageText("");

            const phoneToSend = selectedPhone || targetMsg.phone_number;

            // Send the actual message to backend
            await replyService.sendReply(targetMsg.id, phoneToSend, targetMsg.device_id, text);

            // Refresh messages to get the actual state from backend
            const data = await replyService.getInbox();
            setMessages(data);

            // Clear optimistic messages after successful send
            setTimeout(() => {
                setOptimisticMessages(prev => {
                    const updated = { ...prev };
                    delete updated[selectedPhone];
                    return updated;
                });
            }, 1000);

        } catch (error: any) {
            console.error('Reply send error:', error);

            // ROLLBACK: Remove the optimistic message since send failed
            setOptimisticMessages(prev => ({
                ...prev,
                [selectedPhone]: (prev[selectedPhone] || []).filter(m => m.id !== optimisticId)
            }));

            // Extract the most specific error message from the backend
            let errorMessage = "Failed to send message. Please try again.";
            const responseData = error?.response?.data;
            if (responseData) {
                if (typeof responseData.detail === 'string') {
                    errorMessage = responseData.detail;
                } else if (responseData.detail?.error) {
                    errorMessage = responseData.detail.error;
                } else if (responseData.error) {
                    errorMessage = responseData.error;
                }
            } else if (error.message) {
                errorMessage = error.message;
            }

            alert(errorMessage);
        }
    };

    // --- Loading Logic ---
    const loadMessages = async (deviceId?: string | null) => {
        setLoading(true);
        try {
            const data = await replyService.getInbox(deviceId ?? undefined);
            setMessages(data || []);
        } catch (error) {
            console.error("Failed to load messages:", error);
        } finally {
            setLoading(false);
        }
    };

    // Re-load when selected device changes; reset selected conversation
    useEffect(() => {
        setSelectedPhone(null);
        loadMessages(selectedDeviceId);
        const interval = setInterval(() => {
            replyService.getInbox(selectedDeviceId ?? undefined).then(data => {
                if (data) setMessages(data);
            }).catch(console.error);
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedDeviceId]);

    // --- Data Processing ---
    // Group messages by phone number
    const groupedConversations = useMemo(() => {
        const groups: Record<string, InboxMessage[]> = {};
        if (!Array.isArray(messages)) return groups;

        messages.forEach(msg => {
            if (!msg.phone_number) return;
            if (!groups[msg.phone_number]) groups[msg.phone_number] = [];
            groups[msg.phone_number].push(msg);
        });
        return groups;
    }, [messages]);

    // Sort contacts by latest activity (incoming or reply)
    const sortedContacts = useMemo(() => {
        return Object.keys(groupedConversations).sort((a, b) => {
            const getLatestTime = (msgs: InboxMessage[]) => {
                if (!msgs || !msgs.length) return 0;
                // Find max time in this thread
                return msgs.reduce((max, msg) => {
                    const t1 = new Date(msg.incoming_time).getTime();
                    const t2 = msg.reply_time ? new Date(msg.reply_time).getTime() : 0;
                    const val = Math.max(isNaN(t1) ? 0 : t1, isNaN(t2) ? 0 : t2);
                    return Math.max(max, val);
                }, 0);
            };
            const timeB = getLatestTime(groupedConversations[b]);
            const timeA = getLatestTime(groupedConversations[a]);
            return (timeB || 0) - (timeA || 0);
        });
    }, [groupedConversations]);

    // Current Conversation Logic
    const currentConversation = useMemo(() => {
        if (!selectedPhone) return [];
        const rawMsgs = groupedConversations[selectedPhone] || [];

        // Each DB row is now one message (incoming OR outgoing)
        const chatStream: ChatMessage[] = rawMsgs.map(msg => ({
            id: msg.id,
            text: msg.incoming_message || "",
            timestamp: msg.incoming_time,
            direction: msg.is_outgoing ? 'outgoing' : 'incoming',
            status: msg.is_outgoing ? 'sent' : undefined,
            originalMsgId: msg.id
        }));

        // Add optimistic messages if any
        const optimisticMsgs = optimisticMessages[selectedPhone] || [];
        const combinedStream = [...chatStream, ...optimisticMsgs];

        // Sort by time ascending, handling invalid dates
        return combinedStream.sort((a, b) => {
            const tA = new Date(a.timestamp).getTime();
            const tB = new Date(b.timestamp).getTime();
            return (isNaN(tA) ? 0 : tA) - (isNaN(tB) ? 0 : tB);
        });
    }, [selectedPhone, groupedConversations, optimisticMessages]);

    // Scroll to bottom on new message
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentConversation]);

    // --- Actions ---

    const handleSelectContact = (phone: string) => {
        setSelectedPhone(phone);
        // Mark as read logic - Pass the selected device ID to isolate unread status per device
        replyService.markAsRead(phone, selectedDeviceId ?? undefined).catch(console.error);

        // Optimistic read status update
        setMessages(prev => prev.map(m =>
            m.phone_number === phone ? { ...m, unread: false } : m
        ));
    };

    return (
        <ChatLayout
            chatList={
                <ChatListPanel
                    header={
                        <>
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00a884] font-semibold flex-shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0 mx-2">
                                {/* Device Selector Dropdown - Show ONLY connected devices */}
                                <select
                                    className="w-full bg-white/20 text-white text-sm rounded-lg px-2 py-1.5 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white/40 cursor-pointer"
                                    value={selectedDeviceId ?? "all"}
                                    onChange={e => setSelectedDeviceId(e.target.value === "all" ? null : e.target.value)}
                                    title="Select Device"
                                >
                                    {devices.length > 1 && (
                                        <option value="all" className="text-gray-800 bg-white">
                                            📱 All Devices ({devices.reduce((acc, d) => acc + (d.unread_count || 0), 0)} unread)
                                        </option>
                                    )}
                                    {devices.length === 0 ? (
                                        <option value="" className="text-gray-800 bg-white">No Devices Found</option>
                                    ) : (
                                        devices.map(d => (
                                            <option key={d.device_id} value={d.device_id} className="text-gray-800 bg-white">
                                                {d.is_connected ? "🟢" : "🔴"} {d.device_name} ({d.unread_count || 0})
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            <Button
                                variant="ghost" size="icon"
                                className="rounded-full hover:bg-white/20 transition-all duration-200 flex-shrink-0"
                                onClick={() => loadMessages(selectedDeviceId)}
                            >
                                <RefreshCw className="w-5 h-5 text-white" />
                            </Button>
                        </>
                    }
                    search={
                        <div className="relative bg-[#f0f2f5] rounded-xl h-11 flex items-center px-4 transition-all duration-200 focus-within:ring-2 focus-within:ring-[#00a884] focus-within:bg-white">
                            <Search className="w-4 h-4 text-[#8696a0] mr-3" />
                            <input
                                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-[#8696a0] text-[#111b21]"
                                placeholder="Search or start new chat"
                            />
                        </div>
                    }
                    list={
                        <>
                            {loading && messages.length === 0 ? (
                                <div className="flex justify-center items-center h-20 text-[#8696a0] text-sm">Loading chats...</div>
                            ) : sortedContacts.map(phone => {
                                const msgs = groupedConversations[phone];
                                const lastMsg = msgs[0];

                                // Find the actual latest message for preview
                                // Each row is now one message (incoming or outgoing)
                                const allForPhone: ChatMessage[] = msgs.map(m => ({
                                    id: m.id,
                                    text: m.incoming_message,
                                    timestamp: m.incoming_time,
                                    direction: m.is_outgoing ? 'outgoing' : 'incoming',
                                    originalMsgId: m.id
                                }));
                                allForPhone.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                                const previewMsg = allForPhone[0];

                                const unreadCount = msgs.filter(m => m.unread).length;

                                return (
                                    <ChatListItem
                                        key={phone}
                                        name={msgs[0]?.contact_name || phone}
                                        lastMessage={previewMsg.text}
                                        timestamp={formatTime(previewMsg.timestamp)}
                                        unreadCount={unreadCount}
                                        isActive={selectedPhone === phone}
                                        onClick={() => handleSelectContact(phone)}
                                    />
                                );
                            })}
                        </>
                    }
                />
            }
            conversation={
                selectedPhone ? (
                    <ConversationPanel
                        header={
                            <>
                                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#00a884] font-semibold">
                                    {groupedConversations[selectedPhone]?.[0]?.contact_name?.charAt(0)?.toUpperCase() || selectedPhone.charAt(0)}
                                </div>
                                <div className="cursor-pointer ml-4">
                                    <div className="font-semibold text-lg text-white">
                                        {groupedConversations[selectedPhone]?.[0]?.contact_name || selectedPhone}
                                    </div>
                                    <div className="text-xs text-white/80">click for contact info</div>
                                </div>
                                <div className="flex gap-4 text-white ml-auto">
                                    <Search className="w-5 h-5 cursor-pointer hover:text-white/80 transition-colors" />
                                    <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white/80 transition-colors" />
                                </div>
                            </>
                        }
                        messages={
                            <>
                                <AnimatePresence initial={false}>
                                    {currentConversation.map((msg, index) => (
                                        <MessageBubble
                                            key={msg.id}
                                            text={msg.text}
                                            timestamp={formatTime(msg.timestamp)}
                                            isOutgoing={msg.direction === 'outgoing'}
                                        />
                                    ))}
                                </AnimatePresence>
                                <div ref={messagesEndRef} />
                            </>
                        }
                        input={
                            <MessageInput
                                value={messageText}
                                onChange={setMessageText}
                                onSend={handleSendMessage}
                            />
                        }
                    />
                ) : (
                    // Empty State
                    <div className="flex-1 flex flex-col items-center justify-center p-10 bg-white">
                        <div className="w-80 mb-12 text-center">
                            <div className="flex justify-center mb-8">
                                <div className="w-24 h-24 rounded-full bg-[#00a884] flex items-center justify-center shadow-lg">
                                    <MessageSquare className="w-12 h-12 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-light text-center mb-4 text-[#111b21]">WhatsApp Web</h1>
                            <p className="text-[#667781] text-center text-sm leading-6">
                                Send and receive messages without keeping your phone online.<br />
                                Use WhatsApp on up to 4 linked devices and 1 phone.
                            </p>
                        </div>
                    </div>
                )
            }
        />
    );
}

// --- Utils ---
function formatTime(timestamp: string) {
    try {
        const date = new Date(timestamp);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const diffDays = Math.round((today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24));

        const timeStr = date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });

        if (diffDays === 0) return timeStr;                    // Today → just time
        if (diffDays === 1) return `Yesterday ${timeStr}`;   // Yesterday
        if (diffDays <= 6) return date.toLocaleDateString('en-US', { weekday: 'short' }) + ` ${timeStr}`; // Mon, Tue…
        return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) + ` ${timeStr}`;       // 01 Mar
    } catch {
        return "";
    }
}
