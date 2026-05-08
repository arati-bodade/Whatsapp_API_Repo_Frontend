"use client";

import { useState, useEffect } from "react";
import {
    Send, MessageSquare, CheckCircle, AlertCircle,
    RefreshCw, Smartphone, ChevronRight, ChevronLeft,
    Check, Zap, XCircle, Image as ImageIcon, Activity,
    Search, ChevronDown
} from "lucide-react";
import groupService, { Group } from "@/services/groupService";
import { deviceService } from "@/services/deviceService";
import unofficialApiService from "@/services/unofficialApiService";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import { API_BASE_URL } from "@/config/api";
import MediaMessageComposer from "@/components/official-message/MediaMessageComposer";
import { countries, Country } from "@/config/countries";
import { usePlanStatus } from "@/hooks/usePlanStatus";
import { PlanRestrictionModal } from "@/components/plans/PlanRestrictionModal";

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface ConnectedDevice {
    device_id: string;
    device_name: string;
    session_status: string;
    device_type: string;
}

interface SendResult {
    recipient: string;
    status: "success" | "error";
    error?: string;
}

export default function UnofficialMessagePage() {
    // Steps: 1=Type, 2=Recipient, 3=Compose, 4=Review
    const [currentStep, setCurrentStep] = useState(1);

    // Plan Validation
    const { isValid, loading: planLoading } = usePlanStatus();
    const [showPlanModal, setShowPlanModal] = useState(false);

    // User & Device
    const [userId, setUserId] = useState<string | null>(null);
    const [deviceStatus, setDeviceStatus] = useState<"loading" | "connected" | "disconnected">("loading");
    const [allConnectedDevices, setAllConnectedDevices] = useState<ConnectedDevice[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
    const [engineStatus, setEngineStatus] = useState<string | null>(null);

    // Form states
    const [messageType, setMessageType] = useState<"text" | "media">("text");
    const [mediaType, setMediaType] = useState<"image" | "video" | "document">("image");
    const [filePath, setFilePath] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [recipientType, setRecipientType] = useState<"single" | "group">("single");

    // Single user messaging
    const [singleUserPhone, setSingleUserPhone] = useState("");
    const [phoneRest, setPhoneRest] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country>(countries.find(c => c.iso === "IN") || countries[0]);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");
    const [phoneError, setPhoneError] = useState<string | null>(null);

    // Sync full phone number
    useEffect(() => {
        setSingleUserPhone(selectedCountry.code + phoneRest);
    }, [selectedCountry, phoneRest]);

    const [selectedGroupIds] = useState<string[]>([]);

    // Content
    const [messageContent, setMessageContent] = useState("");

    // Status states
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);



    // ─── Init ────────────────────────────────────────────────────────────────

    useEffect(() => {
        const storedUserId = localStorage.getItem("user_id");
        if (storedUserId) {
            setUserId(storedUserId);
            checkDeviceAndLoadGroups(storedUserId);
        }
    }, []);

    // Auto-poll device connection when disconnected
    useEffect(() => {
        if (!userId || deviceStatus === "connected") return;

        const intervalId = setInterval(async () => {
            try {
                // 🔥 FIXED: Use deviceService (axios) which includes auth headers
                const devices = await deviceService.getConnectedUnofficialDevices();
                const connectedOnly = devices.filter((d: any) =>
                    d.session_status === "connected" && d.device_type === "web"
                );

                if (connectedOnly.length > 0) {
                    setDeviceStatus("connected");
                    setAllConnectedDevices(connectedOnly);
                    
                    // Default to first if none selected
                    if (!selectedDeviceId) {
                        setSelectedDeviceId(connectedOnly[0].device_id);
                        runStatusCheck(connectedOnly[0].device_id, connectedOnly[0].device_name);
                    }
                }
            } catch {
                // Ignore background polling errors
            }
        }, 8000); // 8-second heartbeat is plenty

        return () => clearInterval(intervalId);
    }, [userId, deviceStatus]);

    // ─── Auto-dismiss status popup (8 seconds) ───
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setStatus(null);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // ─── Device & Groups ──────────────────────────────────────────────────────

    const checkDeviceAndLoadGroups = async (currentUserId: string) => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // 1. Check device status - 🔥 FIXED: Use deviceService (axios)
            const devices = await deviceService.getConnectedUnofficialDevices();
            const connectedOnly = devices.filter((d: any) =>
                d.session_status === "connected" && d.device_type === "web"
            );

            if (connectedOnly.length > 0) {
                setDeviceStatus("connected");
                setAllConnectedDevices(connectedOnly);
                
                const activeId = selectedDeviceId || connectedOnly[0].device_id;
                setSelectedDeviceId(activeId);
                
                const activeDevice = connectedOnly.find((d: ConnectedDevice) => d.device_id === activeId) || connectedOnly[0];
                runStatusCheck(activeDevice.device_id, activeDevice.device_name);
                
                console.log(`✅ Found ${connectedOnly.length} connected device(s)`);
            } else {
                setDeviceStatus("disconnected");
                setAllConnectedDevices([]);
                setSelectedDeviceId(null);
                console.log("❌ No connected unofficial devices found");
            }


        } catch (error) {
            console.error("Failed to load initial data:", error);
            setDeviceStatus("disconnected");
        } finally {
            setLoading(false);
        }
    };

    const runStatusCheck = async (deviceId: string, deviceNameStr: string) => {
        try {
            const result = await unofficialApiService.statusCheck(deviceId, deviceNameStr);
            setEngineStatus(result?.status || result?.session_status || "checked");
            console.log("🔍 Status check result:", result);
        } catch (err: any) {
            console.warn("Status check failed:", err.message);
            setEngineStatus("error");
        }
    };

    const refreshDeviceStatus = async () => {
        setLoading(true);
        try {
            // 🔥 FIXED: Use deviceService to trigger sync (passing true for sync)
            await deviceService.getUnofficialDevices(true);
            await checkDeviceAndLoadGroups(userId || "");
        } catch (error) {
            console.error("Failed to refresh device status:", error);
            setLoading(false);
        }
    };

    // ─── Helpers ──────────────────────────────────────────────────────────────





    // ─── Validation ───────────────────────────────────────────────────────────

    const isStepValid = (step: number) => {
        if (deviceStatus !== "connected") return false;

        if (step === 1) return true;

        if (step === 2) {
            if (recipientType === "single") {
                // Basic validation: 10 digits for India/USA, 7-15 for others
                const digits = phoneRest.length;
                if (selectedCountry.code === "91" || selectedCountry.code === "1") {
                    return digits === 10;
                }
                return digits >= 7 && digits <= 15;
            } else {
                return selectedGroupIds.length > 0;
            }
        }

        if (step === 3) {
            if (messageType === "text") {
                return messageContent.trim().length > 0;
            } else {
                return (filePath.trim().length > 0) || (file !== null);
            }
        }

        return true;
    };

    const handleNext = () => {
        if (currentStep < 4 && isStepValid(currentStep)) {
            setCurrentStep(curr => curr + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(curr => curr - 1);
        }
    };

    const handleSendMessage = async () => {
        try {
            setSending(true);
            setStatus(null);

            // 🔐 Plan Check
            if (!isValid) {
                setShowPlanModal(true);
                setSending(false);
                return;
            }

            const currentDevice = allConnectedDevices.find(d => d.device_id === selectedDeviceId);
            if (!currentDevice) {
                throw new Error("Selected device not found or disconnected.");
            }

            const { device_id, device_name } = currentDevice;

            console.log("🔐 Device ID being used:", device_id);
            console.log("🔐 Device Name being used:", device_name);

            // ── Re-verify device is still connected ──
            const verifyDevices = await deviceService.getConnectedUnofficialDevices();
            const stillConnected = verifyDevices.find((d: any) =>
                d.session_status === "connected" && d.device_type === "web"
            );

            if (!stillConnected) {
                throw new Error("Device disconnected. Please reconnect and try again.");
            }

            console.log("🔐 Sending via device:", device_name, "ID:", device_id);

            // ═══════════════════════════════════════════════════════════════════
            // TEXT MESSAGE
            // ═══════════════════════════════════════════════════════════════════
            if (messageType === "text") {
                if (recipientType === "single") {
                    // ── Single user text → POST /send-message (JSON) ──
                    const result = await unofficialApiService.sendMessage(
                        device_id,
                        device_name,
                        singleUserPhone,
                        messageContent,
                        true, // wait for delivery
                        30
                    );
                    console.log("✅ Text message result:", result);
                    setStatus({ type: "success", text: "✅ Text message sent successfully!" });
                }
            }

            // ═══════════════════════════════════════════════════════════════════
            // MEDIA MESSAGE (file upload or file_path approach)
            // ═══════════════════════════════════════════════════════════════════
            else {
                if (!filePath.trim() && !file) {
                    setStatus({ type: "error", text: "Please upload a file or enter a path/URL." });
                    return;
                }

                // Strip any literal quotes that the user might have copy-pasted (e.g., from Windows "Copy as path")
                const cleanFilePath = filePath.trim().replace(/^["']|["']$/g, '');

                if (recipientType === "single") {
                    // ── Single user media ──
                    let result: any;
                    if (caption.trim()) {
                        // File + Text → POST /send-file-text
                        console.log("📎 Sending file + text via /send-file-text");
                        result = await unofficialApiService.sendFileText(
                            device_id,
                            device_name,
                            singleUserPhone,
                            cleanFilePath,
                            caption,
                            true, // wait for delivery
                            30,   // max wait
                            file || undefined
                        );
                        console.log("📎 send-file-text result:", result);
                    } else {
                        // File only → POST /send-file
                        console.log("📎 Sending file via /send-file");
                        result = await unofficialApiService.sendFile(
                            device_id,
                            device_name,
                            singleUserPhone,
                            cleanFilePath,
                            true, // wait for delivery
                            30,   // max wait
                            file || undefined
                        );
                        console.log("📎 send-file result:", result);
                    }

                    // Check if backend returned success: false (engine error)
                    if (result && result.success === false) {
                        throw new Error(result.message || result.error || "File sending failed at engine level.");
                    }

                    setStatus({
                        type: "success",
                        text: `✅ Media sent successfully!${caption.trim() ? " (with caption)" : ""}`
                    });
                }
            }

            // Reset form on success
            setCurrentStep(1);
            setMessageContent("");
            setSingleUserPhone("");
            setPhoneRest("");
            setFilePath("");
            setFile(null);
            setCaption("");

        } catch (error: any) {
            console.error("❌ Message sending failed:", error);
            
            // 🔥 POPUP/Special handling for invalid number or plan restriction
            const isInvalidNumber = error.code === 'invalid_number' || error.message?.includes("not registered on WhatsApp");
            const isPlanError = error.message?.includes("No active plan found") || error.message?.includes("plan has expired") || error.message?.includes("Insufficient credits");
            
            setStatus({
                type: "error",
                text: isPlanError 
                    ? `Failed to send message: ${error.message}`
                    : isInvalidNumber 
                        ? `⚠️ Invalid Number: The recipient is not on WhatsApp.` 
                        : (error.message || "Failed to send message. Please try again.")
            });
        } finally {
            setSending(false);
        }
    };


    // ─── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
            {/* Plan Restriction Modal */}
            <PlanRestrictionModal 
                isOpen={showPlanModal} 
                onClose={() => setShowPlanModal(false)} 
                title="Failed to send message"
                message="Failed to send message. Please purchase a plan."
            />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Send Message</h1>
                        <p className="text-gray-500 mt-1">Send messages via your connected WhatsApp device.</p>
                    </div>
                    {/* Device Status Badge */}
                    <div className={`px-4 py-2 rounded-xl flex items-center gap-3 text-sm font-medium border transition-all ${deviceStatus === "connected"
                        ? "bg-white border-emerald-200 shadow-sm text-emerald-700"
                        : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}>
                        <Smartphone size={16} className={deviceStatus === "connected" ? "text-emerald-500" : ""} />
                        
                        {loading ? (
                            <span className="animate-pulse">Checking devices...</span>
                        ) : deviceStatus === "connected" ? (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 font-normal mr-1">Source:</span>
                                {allConnectedDevices.length > 1 ? (
                                    <select 
                                        value={selectedDeviceId || ""} 
                                        onChange={(e) => {
                                            const newId = e.target.value;
                                            setSelectedDeviceId(newId);
                                            const dev = allConnectedDevices.find(d => d.device_id === newId);
                                            if (dev) runStatusCheck(dev.device_id, dev.device_name);
                                        }}
                                        className="bg-transparent border-none outline-none font-bold text-emerald-700 cursor-pointer hover:text-emerald-800 transition-colors"
                                    >
                                        {allConnectedDevices.map(dev => (
                                            <option key={dev.device_id} value={dev.device_id}>
                                                {dev.device_name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="font-bold">{allConnectedDevices[0]?.device_name}</span>
                                )}
                            </div>
                        ) : (
                            "No Device Connected"
                        )}

                        {engineStatus && deviceStatus === "connected" && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-emerald-100 rounded uppercase tracking-wider text-emerald-600 font-bold border border-emerald-200/50">
                                {engineStatus}
                            </span>
                        )}
                        
                        <button
                            onClick={refreshDeviceStatus}
                            disabled={loading}
                            className="ml-2 p-1.5 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            title="Refresh device status"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : "text-emerald-400"} />
                        </button>
                    </div>
                </div>

                {/* Device Warning */}
                {!loading && deviceStatus !== "connected" && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-4 text-amber-800">
                        <AlertCircle className="shrink-0" />
                        <div className="flex-1">
                            <h3 className="font-semibold">Device Disconnected</h3>
                            <p className="text-sm">You simply need to connect your WhatsApp account to start sending messages.</p>
                        </div>
                        <Link href="/dashboard/user/devices" className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-semibold hover:bg-amber-700 transition-colors">
                            Connect Device
                        </Link>
                    </div>
                )}

                {/* Progress Stepper */}
                <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center px-8 md:px-16 relative overflow-hidden transition-opacity ${deviceStatus !== 'connected' ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                    <div className="absolute top-[36px] left-[52px] md:left-[84px] right-[52px] md:right-[84px] h-1 bg-gray-100 z-0"></div>
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: step <= currentStep ? "#10b981" : "#f3f4f6",
                                    color: step <= currentStep ? "#ffffff" : "#6b7280",
                                    scale: step === currentStep ? 1.1 : 1
                                }}
                                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-md transition-all duration-300 border-2 border-white"
                            >
                                {step < currentStep ? <Check size={18} /> : step}
                            </motion.div>
                            <span className={`text-xs font-medium ${step <= currentStep ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {step === 1 ? "Type" : step === 2 ? "Audience" : step === 3 ? "Compose" : "Review"}
                            </span>
                        </div>
                    ))}
                    <motion.div
                        className="absolute top-[36px] left-[52px] md:left-[84px] right-[52px] md:right-[84px] h-1 bg-emerald-500 z-0 origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: (currentStep - 1) / 3 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                    />
                </div>

                {/* Content Card */}
                <AnimatePresence mode="wait">
                    {deviceStatus === "connected" && (
                        <motion.div
                            key={currentStep}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-h-[400px] flex flex-col"
                        >
                            {/* Step 1: Message Type */}
                            {currentStep === 1 && (
                                <div className="p-8 md:p-12 flex-1 flex flex-col justify-center">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-8 text-center">What kind of message are you sending?</h2>
                                    <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
                                        <button
                                            onClick={() => setMessageType("text")}
                                            className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg ${messageType === 'text'
                                                ? 'border-emerald-500 bg-emerald-50/50'
                                                : 'border-gray-100 hover:border-emerald-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${messageType === 'text' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                                }`}>
                                                <MessageSquare size={24} />
                                            </div>
                                            <h3 className={`text-lg font-bold mb-2 ${messageType === 'text' ? 'text-emerald-900' : 'text-gray-800'}`}>Text Message</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Send standard text messages to your customers. Supports simple formatting.
                                            </p>
                                            {messageType === 'text' && (
                                                <div className="absolute top-4 right-4 text-emerald-500">
                                                    <CheckCircle size={24} />
                                                </div>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setMessageType("media")}
                                            className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg ${messageType === 'media'
                                                ? 'border-emerald-500 bg-emerald-50/50'
                                                : 'border-gray-100 hover:border-emerald-200 hover:bg-white'
                                                }`}
                                        >
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${messageType === 'media' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                                }`}>
                                                <ImageIcon size={24} />
                                            </div>
                                            <h3 className={`text-lg font-bold mb-2 ${messageType === 'media' ? 'text-emerald-900' : 'text-gray-800'}`}>Media Message</h3>
                                            <p className="text-sm text-gray-500 leading-relaxed">
                                                Send images, videos, and documents with optional captions.
                                            </p>
                                            {messageType === 'media' && (
                                                <div className="absolute top-4 right-4 text-emerald-500">
                                                    <CheckCircle size={24} />
                                                </div>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Recipient */}
                            {currentStep === 2 && (
                                <div className="p-8 md:p-12 flex-1">
                                    <h2 className="text-2xl font-bold text-gray-800 mb-8">Choose your audience</h2>

                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 min-h-[300px]">
                                        {recipientType === "single" && (
                                            <div className="max-w-md">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Phone Number</label>
                                                <div className="flex gap-2">
                                                    {/* Country Picker */}
                                                    <div className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                                                            className="h-full px-3 py-2.5 border border-gray-200 rounded-xl bg-white flex items-center gap-2 hover:border-emerald-500 hover:bg-emerald-50/10 transition-all min-w-[100px] justify-between shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex items-center w-6 h-4 overflow-hidden rounded-sm shadow-sm">
                                                                    <NextImage 
                                                                        src={`https://flagcdn.com/w40/${selectedCountry.iso.toLowerCase()}.png`}
                                                                        alt={selectedCountry.name}
                                                                        width={24}
                                                                        height={16}
                                                                        className="object-cover"
                                                                    />
                                                                </div>
                                                                <span className="font-semibold text-gray-700">{selectedCountry.code}</span>
                                                            </div>
                                                            <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} />
                                                        </button>

                                                        {isCountryDropdownOpen && (
                                                            <>
                                                                <div 
                                                                    className="fixed inset-0 z-40 bg-black/5" 
                                                                    onClick={() => setIsCountryDropdownOpen(false)}
                                                                />
                                                                <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-100 shadow-2xl rounded-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                                                    <div className="p-2 border-b border-gray-50 flex items-center gap-2 bg-gray-50/50">
                                                                        <Search size={16} className="text-gray-400" />
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="Search country or code..."
                                                                            className="w-full bg-transparent border-none outline-none text-sm font-medium py-1 placeholder:text-gray-400"
                                                                            autoFocus
                                                                            value={countrySearch}
                                                                            onChange={(e) => setCountrySearch(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="max-h-72 overflow-y-auto overscroll-contain pb-2 custom-scrollbar">
                                                                        {countries
                                                                            .filter(c => 
                                                                                c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
                                                                                c.code.includes(countrySearch)
                                                                            )
                                                                            .map(country => (
                                                                                <button
                                                                                    key={`${country.iso}-${country.code}`}
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        setSelectedCountry(country);
                                                                                        setIsCountryDropdownOpen(false);
                                                                                        setCountrySearch("");
                                                                                    }}
                                                                                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-emerald-50 transition-colors group border-b border-gray-50 last:border-0"
                                                                                >
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className="w-8 h-5 overflow-hidden rounded-sm shadow-sm shrink-0">
                                                                                            <NextImage 
                                                                                                src={`https://flagcdn.com/w40/${country.iso.toLowerCase()}.png`}
                                                                                                alt={country.name}
                                                                                                width={32}
                                                                                                height={20}
                                                                                                className="object-cover"
                                                                                            />
                                                                                        </div>
                                                                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-emerald-700">{country.name}</span>
                                                                                    </div>
                                                                                    <span className="text-sm font-bold text-emerald-600/60 group-hover:text-emerald-600">{country.code}</span>
                                                                                </button>
                                                                            ))
                                                                        }
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Phone Input */}
                                                    <div className="relative flex-1">
                                                        <Smartphone className="absolute left-4 top-3.5 text-gray-400" size={20} />
                                                        <input
                                                            type="text"
                                                            value={phoneRest}
                                                            onChange={(e) => setPhoneRest(e.target.value.replace(/\D/g, ''))}
                                                            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold tracking-widest text-lg text-gray-900"
                                                            placeholder="9876543210"
                                                        />
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs text-gray-500 flex items-center gap-2 font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                                                    <Activity size={14} className="text-emerald-500" />
                                                    Final Number: <span className="font-mono font-bold text-emerald-600 tracking-wider font-lg">{selectedCountry.code.replace(/\D/g, '')}{phoneRest || "..."}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Compose */}
                            {currentStep === 3 && (
                                <div className="p-8 md:p-12 flex-1">
                                    <div className="flex items-center justify-between mb-8">
                                        <h2 className="text-2xl font-bold text-gray-800">
                                            {messageType === 'text' ? 'Compose Message' : 'Compose Media'}
                                        </h2>
                                    </div>

                                    <div className="grid lg:grid-cols-3 gap-8 h-full">
                                        <div className="lg:col-span-2 space-y-6">
                                            {messageType === "text" ? (
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
                                                    <textarea
                                                        value={messageContent}
                                                        onChange={(e) => setMessageContent(e.target.value)}
                                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-64 resize-none shadow-sm text-gray-900"
                                                        placeholder="Type your message here..."
                                                    />
                                                    <div className="text-right mt-2 text-xs text-gray-400">
                                                        {messageContent.length} characters
                                                    </div>
                                                </div>
                                            ) : (
                                                <MediaMessageComposer
                                                    mediaType={mediaType}
                                                    setMediaType={setMediaType}
                                                    filePath={filePath}
                                                    setFilePath={setFilePath}
                                                    file={file}
                                                    setFile={setFile}
                                                    caption={caption}
                                                    setCaption={setCaption}
                                                />
                                            )}
                                        </div>

                                        {/* Tips Column */}
                                        <div className="bg-emerald-900/5 rounded-2xl p-6 h-fit border border-emerald-900/10 hidden lg:block">
                                            <h3 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                                                <Zap size={18} /> Best Practices
                                            </h3>
                                            <ul className="space-y-4 text-sm text-emerald-800/80">
                                                <li className="flex gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                    <span>Ensure your device is connected and has an active internet connection.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                    <span>Avoid sending marketing spam to prevent number banning.</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                    <span>{messageType === 'media' ? 'Supported: JPG, PNG, MP4, PDF, DOC, CSV, XLS. Captions sent as follow-up text.' : 'Messages are sent through your device\'s connection.'}</span>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Step 4: Review */}
                            {currentStep === 4 && (
                                <div className="p-8 md:p-12 flex-1 flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                                        <Check size={32} />
                                    </div>
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Send?</h2>
                                    <p className="text-gray-500 mb-10 max-w-md">
                                        Please review the details below. Messages will be sent from: <b>{allConnectedDevices.find(d => d.device_id === selectedDeviceId)?.device_name || "a connected device"}</b>.
                                    </p>

                                    <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-2xl border border-gray-200 text-left grid md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message Type</label>
                                            <p className="font-semibold text-gray-800 capitalize mt-1">Unofficial {messageType}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Number</label>
                                            <p className="font-bold text-lg text-emerald-600 mt-1">{singleUserPhone}</p>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Status Check</label>
                                            <p className="font-semibold text-emerald-700 mt-1 flex items-center gap-1.5">
                                                <Activity size={14} /> Ready to send
                                            </p>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Preview</label>
                                            <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                {messageType === 'text' ? messageContent : (
                                                    <>
                                                        <span className="block font-medium text-gray-800 mb-1">Media Type: <span className="capitalize">{mediaType}</span></span>
                                                        <span className="block text-xs text-gray-500">File Path: {filePath || "No file path set"}</span>
                                                        {caption && <span className="block text-xs text-gray-500 mt-1">Caption: {caption}</span>}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Footer Navigation */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    disabled={currentStep === 1 || sending}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${currentStep === 1
                                        ? "opacity-0 pointer-events-none"
                                        : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                >
                                    <ChevronLeft size={18} /> Back
                                </button>

                                {currentStep < 4 ? (
                                    <button
                                        onClick={handleNext}
                                        disabled={!isStepValid(currentStep)}
                                        className="flex items-center gap-2 px-8 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-gray-200"
                                    >
                                        Next Step <ChevronRight size={18} />
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending}
                                        className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-70 transition-all shadow-lg shadow-emerald-600/20"
                                    >
                                        {sending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                                        {sending ? "Sending..." : "Send Message"}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>



                {/* Feedback Pop Window (Modal) */}
                <AnimatePresence>
                    {status && (
                        <div className="fixed inset-0 flex items-center justify-center p-4 z-50 pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
                                className={`pointer-events-auto bg-white rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] border border-gray-100 p-0 max-w-md w-full relative overflow-hidden`}
                            >
                                {/* Header with gradient background */}
                                <div className={`relative px-8 pt-8 pb-6 ${status.type === 'success' 
                                    ? 'bg-linear-to-br from-emerald-50 via-emerald-50/50 to-white' 
                                    : 'bg-linear-to-br from-red-50 via-red-50/50 to-white'
                                }`}>
                                    {/* Decorative circles */}
                                    <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full opacity-20 ${status.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    <div className={`absolute -bottom-8 -left-8 w-24 h-24 rounded-full opacity-10 ${status.type === 'success' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                                    
                                    {/* Icon */}
                                    <div className="relative">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${status.type === 'success' 
                                            ? 'bg-linear-to-br from-emerald-500 to-emerald-600 text-white' 
                                            : 'bg-linear-to-br from-red-500 to-red-600 text-white'
                                        }`}>
                                            {status.type === 'success' ? <CheckCircle size={32} /> : <AlertCircle size={32} />}
                                        </div>
                                    </div>
                                    
                                    {/* Title */}
                                    <div className="relative mt-5">
                                        <h4 className={`text-2xl font-bold tracking-tight ${status.type === 'success' ? 'text-emerald-900' : 'text-red-900'}`}>
                                            {status.type === 'success' ? 'Message Sent!' : 'Error Occurred'}
                                        </h4>
                                    </div>
                                </div>
                                
                                {/* Content */}
                                <div className="px-8 pb-8">
                                    <div className="space-y-4">
                                        <p className="text-gray-600 leading-relaxed font-medium">
                                            {status.text}
                                        </p>
                                        
                                        {/* Auto-close countdown */}
                                        <div className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <div className="flex gap-1">
                                                {[1, 2, 3].map((i) => (
                                                    <motion.div
                                                        key={i}
                                                        animate={{
                                                            scale: [1, 1.2, 1],
                                                            opacity: [0.4, 1, 0.4]
                                                        }}
                                                        transition={{
                                                            duration: 2.67,
                                                            repeat: Infinity,
                                                            delay: i * 0.5
                                                        }}
                                                        className={`w-1.5 h-1.5 rounded-full ${status.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-gray-500 font-medium">Auto-closing in 8 seconds</span>
                                        </div>
                                    </div>
                                    
                                    {/* Action button */}
                                    <button 
                                        onClick={() => setStatus(null)} 
                                        className={`w-full mt-6 py-3.5 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${status.type === 'success' 
                                            ? 'bg-linear-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-lg shadow-emerald-600/25' 
                                            : 'bg-linear-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-600/25'
                                        }`}
                                    >
                                        Dismiss
                                    </button>
                                </div>
                            </motion.div>
                            
                            {/* Enhanced backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                onClick={() => setStatus(null)}
                                className="fixed inset-0 bg-gray-900/30 backdrop-blur-sm z-[-1] pointer-events-auto"
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
