"use client";

import { useState, useEffect } from "react";
import {
    Send, Users, MessageSquare, CheckCircle, AlertCircle,
    RefreshCw, ShieldCheck, ChevronRight, ChevronLeft,
    Check, Zap, XCircle, Image as ImageIcon, Search, ChevronDown, Activity, Smartphone
} from "lucide-react";
import officialWhatsappService, { WhatsAppTemplate } from "@/services/officialWhatsappService";
import groupService, { Group } from "@/services/groupService";
import { motion, AnimatePresence, Variants } from "framer-motion";
import Link from "next/link";
import NextImage from "next/image";
import MediaMessageComposer from "@/components/official-message/MediaMessageComposer";
import { countries, Country } from "@/config/countries";

// Animation Variants
const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.3 } }
};

export default function OfficialMessagePage() {
    // Steps: 1=Type, 2=Recipient, 3=Compose, 4=Review
    const [currentStep, setCurrentStep] = useState(1);

    // Form states
    const [messageType, setMessageType] = useState<"text" | "template" | "media">("text");

    // Media messaging states
    const [mediaType, setMediaType] = useState<"image" | "video" | "document">("image");
    const [filePath, setFilePath] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [caption, setCaption] = useState("");
    const [recipientType, setRecipientType] = useState<"single" | "group">("single");

    // Single user messaging states
    const [singleUserPhone, setSingleUserPhone] = useState("");
    const [phoneRest, setPhoneRest] = useState("");
    const [selectedCountry, setSelectedCountry] = useState<Country>(countries.find(c => c.iso === "IN") || countries[0]);
    const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
    const [countrySearch, setCountrySearch] = useState("");

    // Sync full phone number
    useEffect(() => {
        setSingleUserPhone(selectedCountry.code + phoneRest);
    }, [selectedCountry, phoneRest]);

    // Status states
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Auto-dismiss status popup (8 seconds)
    useEffect(() => {
        if (status) {
            const timer = setTimeout(() => {
                setStatus(null);
            }, 8000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    // Group messaging states
    const [groups, setGroups] = useState<Group[]>([]);
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);

    // Content states
    const [textContent, setTextContent] = useState("");
    const [selectedTemplate, setSelectedTemplate] = useState<string>("");
    const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({});
    const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
    const formatError = (error: any) => {
        const rawMsg = error?.response?.data?.detail || error?.response?.data?.error_message || error?.message || "Unknown error";
        
        // Check if rawMsg is a JSON string (sometimes backend returns Meta's raw error)
        try {
            const parsed = JSON.parse(rawMsg);
            if (parsed.error && parsed.error.message) {
                const metaErr = parsed.error;
                if (metaErr.code === 190 || metaErr.error_subcode === 463 || metaErr.error_subcode === 467) {
                    return "Your Meta Access Token has expired. Please update it.";
                }
                return metaErr.message;
            }
        } catch {
            // Not JSON, continue
        }

        return rawMsg;
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        setLoading(true);
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            // Load Groups
            const groupsData = await groupService.getGroups(token);
            setGroups(groupsData);

            // Load Templates
            const tmpls = await officialWhatsappService.getTemplates(token);
            setTemplates(tmpls.filter((t: WhatsAppTemplate) => t.template_status === 'APPROVED'));

        } catch (error) {
            console.error("Failed to load data:", error);
            setStatus({ type: "error", text: `Failed to load data: ${formatError(error)}` });
        } finally {
            setLoading(false);
        }
    };

    const handleTemplateChange = (templateName: string) => {
        setSelectedTemplate(templateName);
        // Extract variables
        const template = templates.find(t => t.template_name === templateName);
        if (template) {
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

    const toggleGroup = (groupId: string) => {
        if (selectedGroupIds.includes(groupId)) {
            setSelectedGroupIds(selectedGroupIds.filter(id => id !== groupId));
        } else {
            setSelectedGroupIds([...selectedGroupIds, groupId]);
        }
    };

    // Validation
    const isStepValid = (step: number) => {
        if (step === 1) return true; // Type selection

        if (step === 2) {
            if (recipientType === "single") {
                return singleUserPhone.length > 5;
            } else {
                return selectedGroupIds.length > 0;
            }
        }

        if (step === 3) {
            if (messageType === "text") {
                return textContent.trim().length > 0;
            } else if (messageType === "template") {
                return selectedTemplate.length > 0;
            } else {
                // Media: must have a file or a file path
                return file !== null || filePath.trim().length > 0;
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
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            setSending(true);
            setStatus(null);

            // Prepare common data
            const template = templates.find(t => t.template_name === selectedTemplate);
            const language = template?.language || "en_US";

            if (recipientType === "single") {
                if (messageType === "text") {
                    await officialWhatsappService.sendTextMessage(singleUserPhone, textContent, token);
                } else if (messageType === "template") {
                    await officialWhatsappService.sendTemplateMessage(
                        singleUserPhone,
                        selectedTemplate,
                        templateVariables,
                        language,
                        token
                    );
                } else if (messageType === "media") {
                    // ── Media message (single user) ──────────────────────────
                    if (!file && !filePath.trim()) {
                        setStatus({ type: "error", text: "Please upload a file or enter a file path/URL." });
                        return;
                    }
                    const result = await officialWhatsappService.sendMediaMessage(
                        singleUserPhone,
                        file || filePath,
                        caption,
                        token
                    );
                    if (result && !result.success) {
                        setStatus({
                            type: "error",
                            text: result.error_message ? formatError({ response: { data: { error_message: result.error_message } } }) : (result.message || "Failed to send media.")
                        });
                        setSending(false);
                        return;
                    }
                }
            } else {
                // Group Broadcast
                console.log("Sending to groups:", selectedGroupIds);

                if (messageType === "text") {
                    await groupService.sendMessage(
                        token,
                        selectedGroupIds,
                        textContent,
                        "official"
                    );
                } else if (messageType === "template") {
                    await groupService.sendMessage(
                        token,
                        selectedGroupIds,
                        "", // empty message for template
                        "official",
                        selectedTemplate,
                        templateVariables,
                        language
                    );
                } else if (messageType === "media") {
                    // Media group broadcast is not yet supported by the group service
                    setStatus({
                        type: "error",
                        text: "Media group broadcast is not yet supported. Please send to individual recipients."
                    });
                    setSending(false);
                    return;
                }
            }

            setStatus({ type: "success", text: "Message sent successfully!" });

            // Reset
            setCurrentStep(1);
            setTextContent("");
            setSingleUserPhone("");
            setSelectedGroupIds([]);
            setSelectedTemplate("");
            setTemplateVariables({});
            setFilePath("");
            setFile(null);
            setCaption("");

        } catch (error: any) {
            console.error(error);
            setStatus({
                type: "error",
                text: formatError(error)
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 font-sans">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Send Official Message</h1>
                        <p className="text-gray-500 mt-1">Send secure, verified messages via Meta WhatsApp Cloud API.</p>
                    </div>

                    <div className="px-4 py-2 rounded-full flex items-center gap-2 text-sm font-medium border bg-blue-50 border-blue-200 text-blue-700">
                        <ShieldCheck size={16} />
                        Official API Active
                    </div>
                </div>

                {/* Progress Stepper */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex justify-between items-center px-8 md:px-16 relative overflow-hidden">
                    <div className="absolute top-[36px] left-[52px] md:left-[84px] right-[52px] md:right-[84px] h-1 bg-gray-100 z-0"></div>
                    {[1, 2, 3, 4].map((step) => (
                        <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                            <motion.div
                                initial={false}
                                animate={{
                                    backgroundColor: step <= currentStep ? "#059669" : "#f3f4f6", // Emerald-600
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
                                <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto w-full">
                                    {/* Text Message Option */}
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
                                            Free-form text. Only allowed within 24 hours of customer interaction.
                                        </p>
                                        {messageType === 'text' && (
                                            <div className="absolute top-4 right-4 text-emerald-500">
                                                <CheckCircle size={24} />
                                            </div>
                                        )}
                                    </button>

                                    {/* Template Message Option */}
                                    <button
                                        onClick={() => setMessageType("template")}
                                        className={`group relative p-8 rounded-2xl border-2 text-left transition-all duration-300 hover:shadow-lg ${messageType === 'template'
                                            ? 'border-emerald-500 bg-emerald-50/50'
                                            : 'border-gray-100 hover:border-emerald-200 hover:bg-white'
                                            }`}
                                    >
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${messageType === 'template' ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600'
                                            }`}>
                                            <ShieldCheck size={24} />
                                        </div>
                                        <h3 className={`text-lg font-bold mb-2 ${messageType === 'template' ? 'text-emerald-900' : 'text-gray-800'}`}>Template Message</h3>
                                        <p className="text-sm text-gray-500 leading-relaxed">
                                            Pre-approved templates. Required to initiate conversations. Support variables.
                                        </p>
                                        {messageType === 'template' && (
                                            <div className="absolute top-4 right-4 text-emerald-500">
                                                <CheckCircle size={24} />
                                            </div>
                                        )}
                                    </button>

                                    {/* Media Message Option */}
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
                                            Send images, videos, or documents via WhatsApp Cloud API.
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

                                {/* Tabs */}
                                <div className="flex p-1 bg-gray-100 rounded-xl w-fit mb-8">
                                    <button
                                        onClick={() => setRecipientType("single")}
                                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${recipientType === "single"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        Single User
                                    </button>
                                    <button
                                        onClick={() => setRecipientType("group")}
                                        className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${recipientType === "group"
                                            ? "bg-white text-gray-900 shadow-sm"
                                            : "text-gray-500 hover:text-gray-700"
                                            }`}
                                    >
                                        Group Broadcast
                                    </button>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 min-h-[300px]">
                                    {recipientType === "single" ? (
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
                                                                        placeholder="Search country..."
                                                                        className="w-full bg-transparent border-none outline-none text-sm font-medium py-1 placeholder:text-gray-400"
                                                                        autoFocus
                                                                        value={countrySearch}
                                                                        onChange={(e) => setCountrySearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="max-h-72 overflow-y-auto pb-2 scrollbar-thin">
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
                                                                                    <div className="w-8 h-5 overflow-hidden rounded-sm shadow-sm flex-shrink-0">
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
                                                        className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold tracking-widest text-lg"
                                                        placeholder="9876543210"
                                                    />
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs text-gray-500 flex items-center gap-2 font-medium bg-gray-50 w-fit px-3 py-1.5 rounded-lg border border-gray-100">
                                                <Activity size={14} className="text-emerald-500" />
                                                Final Number: <span className="font-mono font-bold text-emerald-600 tracking-wider text-lg">{selectedCountry.code.replace(/\D/g, '')}{phoneRest || "..."}</span>
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-3">Select Groups</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2">
                                                {groups.map(group => (
                                                    <label
                                                        key={group.group_id}
                                                        className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedGroupIds.includes(group.group_id)
                                                            ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                                            : 'bg-white border-gray-200 hover:border-emerald-200'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedGroupIds.includes(group.group_id)}
                                                            onChange={() => toggleGroup(group.group_id)}
                                                            className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                                                        />
                                                        <span className={`font-medium ${selectedGroupIds.includes(group.group_id) ? 'text-emerald-900' : 'text-gray-700'}`}>
                                                            {group.name}
                                                        </span>
                                                    </label>
                                                ))}
                                                {groups.length === 0 && (
                                                    <div className="col-span-full text-center py-10 text-gray-400">
                                                        No groups found. Please create a group first.
                                                    </div>
                                                )}
                                            </div>
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
                                        {messageType === 'text' ? 'Compose Message' : messageType === 'template' ? 'Configure Template' : 'Compose Media'}
                                    </h2>
                                </div>

                                <div className="grid lg:grid-cols-3 gap-8 h-full">
                                    <div className="lg:col-span-2 space-y-6">
                                        {messageType === "text" ? (
                                            <div>
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 text-sm text-amber-800 flex gap-3 items-start">
                                                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="font-semibold">24-Hour Session Rule</p>
                                                        <p className="mt-1">
                                                            Ensure the recipient has messaged you within the last 24 hours. Otherwise, use a Template.
                                                        </p>
                                                    </div>
                                                </div>
                                                <label className="block text-sm font-semibold text-gray-700 mb-2">Message Content</label>
                                                <textarea
                                                    value={textContent}
                                                    onChange={(e) => setTextContent(e.target.value)}
                                                    className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-64 resize-none shadow-sm"
                                                    placeholder="Type your message here..."
                                                />
                                            </div>
                                        ) : messageType === "template" ? (
                                            <div className="space-y-6">
                                                <div>
                                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Select Template</label>
                                                    <select
                                                        value={selectedTemplate}
                                                        onChange={(e) => handleTemplateChange(e.target.value)}
                                                        className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all cursor-pointer bg-white"
                                                    >
                                                        <option value="">-- Select a template --</option>
                                                        {templates.map(t => (
                                                            <option key={t.id} value={t.template_name}>
                                                                {t.template_name} ({t.language}) - {t.category}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {selectedTemplate && (
                                                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                                        <h4 className="font-semibold text-gray-800 mb-4">Template Preview</h4>
                                                        <p className="text-sm text-gray-600 whitespace-pre-wrap bg-white p-4 rounded-lg border border-gray-200">
                                                            {templates.find(t => t.template_name === selectedTemplate)?.content || "No content preview"}
                                                        </p>

                                                        {Object.keys(templateVariables).length > 0 && (
                                                            <div className="mt-6 space-y-4">
                                                                <h5 className="font-medium text-gray-700 border-b pb-2">Variables</h5>
                                                                {Object.keys(templateVariables).map(variable => (
                                                                    <div key={variable}>
                                                                        <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">{variable}</label>
                                                                        <input
                                                                            type="text"
                                                                            value={templateVariables[variable]}
                                                                            onChange={(e) => setTemplateVariables({ ...templateVariables, [variable]: e.target.value })}
                                                                            className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                                                            placeholder={`Value for ${variable}`}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            /* Media Message Composer */
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
                                            <Zap size={18} /> Official API Tips
                                        </h3>
                                        <ul className="space-y-4 text-sm text-emerald-800/80">
                                            <li className="flex gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                <span>Templates must be approved by Meta before use.</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                <span>Variables allow you to personalize templates (e.g., customer names).</span>
                                            </li>
                                            <li className="flex gap-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0"></span>
                                                <span>Marketing and Utility templates have different pricing costs.</span>
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
                                    Please review the details below. This will deduce credits from your Official Message balance.
                                </p>

                                <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-2xl border border-gray-200 text-left grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message Type</label>
                                        <p className="font-semibold text-gray-800 capitalize mt-1">Official {messageType}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recipient Type</label>
                                        <p className="font-semibold text-gray-800 capitalize mt-1">{recipientType}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                            {recipientType === 'single' ? 'Recipient' : 'Recipients'}
                                        </label>
                                        <p className="font-semibold text-gray-800 mt-1 truncate">
                                            {recipientType === 'single'
                                                ? singleUserPhone
                                                : `${selectedGroupIds.length} Groups Selected`}
                                        </p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Content Preview</label>
                                        <div className="mt-2 p-3 bg-white rounded-lg border border-gray-100 text-sm text-gray-600 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                            {messageType === 'text' ? textContent : messageType === 'template' ? (
                                                <>
                                                    <span className="block font-medium text-gray-800 mb-1">Template: {selectedTemplate}</span>
                                                    {Object.entries(templateVariables).map(([k, v]) => (
                                                        <span key={k} className="block text-xs text-gray-500">{k}: {v}</span>
                                                    ))}
                                                </>
                                            ) : (
                                                <>
                                                    <span className="block font-medium text-gray-800 mb-1">Media Type: <span className="capitalize">{mediaType}</span></span>
                                                    <span className="block text-xs text-gray-500">
                                                        {file ? `File: ${file.name}` : `File Path: ${filePath || "No file set"}`}
                                                    </span>
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
                </AnimatePresence>

                {/* Feedback Pop Window (Modal) */}
                <AnimatePresence>
                    {status && (
                        <div className="fixed inset-0 flex items-center justify-center p-4 z-[100] pointer-events-none">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                className="pointer-events-auto bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 p-8 flex flex-col items-center text-center gap-6 max-w-md w-full relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 right-0 h-2 ${status.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                
                                <div className={`w-20 h-20 rounded-full flex items-center justify-center ${status.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {status.type === 'success' ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-2xl font-bold text-gray-900">
                                        {status.type === 'success' ? 'Message Sent!' : 'Oops! Error'}
                                    </h4>
                                    <p className="text-gray-500 font-medium leading-relaxed">
                                        {status.text}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-4">This window will close automatically in 8 seconds</p>
                                </div>

                                <button 
                                    onClick={() => setStatus(null)} 
                                    className={`w-full py-3 rounded-xl font-bold transition-all ${status.type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200' : 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200'}`}
                                >
                                    Dismiss
                                </button>
                            </motion.div>
                            
                            {/* Backdrop */}
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setStatus(null)}
                                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-[-1] pointer-events-auto"
                            />
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
