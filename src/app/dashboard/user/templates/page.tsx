"use client";

import {
    Filter,
    Download,
    Plus,
    Search,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    X,
    Loader2,
    RefreshCw,
    CloudDownload,
    FileText,
    AlertCircle
} from "lucide-react";
import { useState, useEffect } from "react";
import templatesService, { Template } from "@/services/templatesService";

import { cn } from "@/lib/utils";

type StatusType = 'success' | 'error' | 'info';

export default function TemplatesPage() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [status, setStatus] = useState<{ type: StatusType, text: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState({
        category: "ALL",
        status: "ALL"
    });
    const [newTemplate, setNewTemplate] = useState({
        template_name: "",
        category: "",
        language: "",
        content: ""
    });

    useEffect(() => {
        syncAndFetchTemplates();
    }, []);

    useEffect(() => {
        let filtered = templates.filter(template =>
            template.template_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            template.language?.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (filters.category !== "ALL") {
            filtered = filtered.filter(t => t.category === filters.category);
        }

        if (filters.status !== "ALL") {
            filtered = filtered.filter(t => t.template_status?.toUpperCase() === filters.status);
        }

        setFilteredTemplates(filtered);
    }, [templates, searchTerm, filters]);

    const getToken = () => {
        return localStorage.getItem("token") || localStorage.getItem("access_token");
    };

    const formatError = (error: any) => {
        const rawMsg = error?.response?.data?.detail || error?.response?.data?.error_message || error?.message || "Unknown error";
        
        // Check if rawMsg is a JSON string (sometimes backend returns Meta's raw error)
        try {
            const parsed = JSON.parse(rawMsg);
            if (parsed.error && parsed.error.message) {
                const metaErr = parsed.error;
                if (metaErr.code === 190 || metaErr.error_subcode === 463 || metaErr.error_subcode === 467) {
                    return "Your Meta Access Token has expired. Please generate a new one.";
                }
                return metaErr.message;
            }
        } catch {
            // Not JSON, continue
        }

        return rawMsg;
    };

    const syncAndFetchTemplates = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const token = getToken();
            if (!token) {
                setStatus({ type: 'error', text: "Not authenticated. Please log in." });
                setLoading(false);
                return;
            }

            // Step 1: Sync templates from Meta API
            try {
                const syncResult = await templatesService.syncTemplates(token);
                if (syncResult.success) {
                    const count = syncResult.data?.count || 0;
                    setStatus({ type: 'info', text: `✅ Synced ${count} template(s) from Meta` });
                } else {
                    const msg = syncResult.error_message ? formatError({ response: { data: { error_message: syncResult.error_message } } }) : "Sync failed";
                    setStatus({ type: 'error', text: `${msg} — showing cached templates` });
                }
            } catch (syncErr: any) {
                const errMsg = formatError(syncErr);
                // Don't block — show cached templates even if sync fails
                setStatus({ type: 'error', text: `Sync error: ${errMsg}. Showing cached templates.` });
            }

            // Step 2: Fetch templates from local DB  
            const data = await templatesService.getTemplates(token);
            setTemplates(data);
        } catch (error: any) {
            console.error("Failed to load templates", error);
            const errMsg = error?.response?.data?.detail || error?.message || "Unknown error";
            setStatus({ type: 'error', text: `Failed to load templates: ${errMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const handleSyncOnly = async () => {
        setSyncing(true);
        setStatus(null);
        try {
            const token = getToken();
            if (!token) {
                setStatus({ type: 'error', text: "Not authenticated. Please log in." });
                return;
            }

            const syncResult = await templatesService.syncTemplates(token);
            if (syncResult.success) {
                const count = syncResult.data?.count || 0;
                setStatus({ type: 'success', text: `✅ Synced ${count} template(s) from Meta successfully!` });
                // Refresh the list
                const data = await templatesService.getTemplates(token);
                setTemplates(data);
            } else {
                const msg = syncResult.error_message ? formatError({ response: { data: { error_message: syncResult.error_message } } }) : "Sync failed";
                setStatus({ type: 'error', text: msg });
            }
        } catch (error: any) {
            console.error("Sync failed", error);
            const errMsg = formatError(error);
            setStatus({ type: 'error', text: `Sync failed: ${errMsg}` });
        } finally {
            setSyncing(false);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplate.template_name.trim()) {
            setStatus({ type: 'error', text: "Template name is required." });
            return;
        }
        if (!newTemplate.category.trim()) {
            setStatus({ type: 'error', text: "Category is required." });
            return;
        }
        if (!newTemplate.language.trim()) {
            setStatus({ type: 'error', text: "Language is required." });
            return;
        }
        if (!newTemplate.content.trim()) {
            setStatus({ type: 'error', text: "Content is required." });
            return;
        }

        setIsCreating(true);
        try {
            const token = getToken();
            if (token) {
                await templatesService.createTemplate(token, newTemplate);
                setStatus({ type: 'success', text: "Template created successfully!" });
                setIsCreateModalOpen(false);
                setNewTemplate({ template_name: "", category: "", language: "", content: "" });
                // Refresh
                const data = await templatesService.getTemplates(token);
                setTemplates(data);
            }
        } catch (error: any) {
            console.error("Create template error", error);
            const errMsg = error?.response?.data?.detail || error?.message || "Unknown error";
            setStatus({ type: 'error', text: `Failed to create template: ${errMsg}` });
        } finally {
            setIsCreating(false);
        }
    };

    const handleExportCSV = () => {
        if (filteredTemplates.length === 0) return;

        const headers = ["Template Name", "Category", "Language", "Status", "Content", "Last Updated"];
        const csvRows = [
            headers.join(','),
            ...filteredTemplates.map(t => [
                `"${t.template_name}"`,
                `"${t.category}"`,
                `"${t.language}"`,
                `"${t.template_status}"`,
                `"${formatContent(t.content).replace(/"/g, '""')}"`,
                `"${t.updated_at ? new Date(t.updated_at).toLocaleDateString() : '—'}"`
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `whatsapp_templates_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusBadge = (templateStatus: string) => {
        const s = (templateStatus || "").toUpperCase();
        const styles: Record<string, string> = {
            'APPROVED': 'bg-emerald-50 text-emerald-700 border-emerald-100',
            'PENDING': 'bg-amber-50 text-amber-700 border-amber-100',
            'REJECTED': 'bg-red-50 text-red-700 border-red-100',
            'PAUSED': 'bg-slate-50 text-slate-600 border-slate-200',
            'DISABLED': 'bg-gray-100 text-gray-500 border-gray-200',
        };
        const dotStyles: Record<string, string> = {
            'APPROVED': 'bg-emerald-500',
            'PENDING': 'bg-amber-500',
            'REJECTED': 'bg-red-500',
            'PAUSED': 'bg-slate-400',
            'DISABLED': 'bg-gray-400',
        };
        const style = styles[s] || 'bg-blue-50 text-blue-700 border-blue-100';
        const dot = dotStyles[s] || 'bg-blue-500';
        return { style, dot, label: s || 'UNKNOWN' };
    };

    const formatContent = (content: string) => {
        try {
            const parsed = JSON.parse(content);
            if (Array.isArray(parsed)) {
                // Meta template components - extract text from BODY component
                const body = parsed.find((c: any) => c.type === "BODY");
                if (body) return body.text || JSON.stringify(parsed).slice(0, 100);
                return JSON.stringify(parsed).slice(0, 100) + "...";
            }
            return content.slice(0, 100);
        } catch {
            return content?.slice(0, 100) || "";
        }
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Templates</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage your WhatsApp message templates synced from Meta</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSyncOnly}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {syncing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <CloudDownload className="w-4 h-4" />
                        )}
                        <span>{syncing ? "Syncing..." : "Sync from Meta"}</span>
                    </button>
                    <button
                        onClick={() => { setIsCreateModalOpen(true); setStatus(null); }}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Create Template</span>
                    </button>
                </div>
            </div>

            {/* Status Banner */}
            {status && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm flex items-center gap-2 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    status.type === 'info' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                    {status.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{status.text}</span>
                    <button onClick={() => setStatus(null)} className="ml-auto text-current opacity-50 hover:opacity-100">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Table Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-gray-100 gap-4">
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                        <button
                            onClick={syncAndFetchTemplates}
                            disabled={loading}
                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                        <button
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors border",
                                isFilterOpen || filters.category !== "ALL" || filters.status !== "ALL"
                                    ? "bg-blue-50 text-blue-600 border-blue-200"
                                    : "hover:bg-gray-50 border-transparent hover:border-gray-200 text-gray-500"
                            )}
                        >
                            <Filter className="w-4 h-4" />
                            <span>Filter</span>
                        </button>
                        <button
                            onClick={handleExportCSV}
                            disabled={filteredTemplates.length === 0}
                            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-gray-50 rounded-lg transition-colors border border-transparent hover:border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Filter Dropdown Area */}
                {isFilterOpen && (
                    <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex flex-wrap gap-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="ALL">All Categories</option>
                                <option value="MARKETING">Marketing</option>
                                <option value="UTILITY">Utility</option>
                                <option value="AUTHENTICATION">Authentication</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase">Status</label>
                            <select
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                className="text-sm border border-gray-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="APPROVED">Approved</option>
                                <option value="PENDING">Pending</option>
                                <option value="REJECTED">Rejected</option>
                                <option value="PAUSED">Paused</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ category: "ALL", status: "ALL" })}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium pb-2"
                            >
                                Reset Filters
                            </button>
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-3 text-blue-500" />
                        <p className="text-sm font-medium text-gray-500">Syncing & loading templates...</p>
                        <p className="text-xs text-gray-400 mt-1">Fetching latest templates from Meta API</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredTemplates.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                            {searchTerm ? "No templates match your search" : "No templates found"}
                        </p>
                        <p className="text-xs text-gray-400 mb-4 text-center max-w-sm">
                            {searchTerm
                                ? `No templates matching "${searchTerm}". Try a different search term.`
                                : "Sync your templates from Meta or create a new one to get started."
                            }
                        </p>
                        {!searchTerm && (
                            <div className="flex gap-3">
                                <button
                                    onClick={handleSyncOnly}
                                    disabled={syncing}
                                    className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-emerald-200"
                                >
                                    <CloudDownload className="w-4 h-4" />
                                    Sync from Meta
                                </button>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create Template
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Table */}
                {!loading && filteredTemplates.length > 0 && (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <tr>
                                        <th className="p-4 w-10">
                                            <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                        </th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 min-w-[180px]">Template Name</th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 min-w-[120px]">Category</th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 min-w-[100px]">Language</th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 min-w-[100px]">Status</th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 min-w-[200px]">Content</th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 min-w-[120px]">Last Updated</th>
                                        <th className="p-4 font-semibold text-xs uppercase tracking-wider text-gray-600 w-16 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm text-gray-600 divide-y divide-gray-50">
                                    {filteredTemplates.map((template) => {
                                        const badge = getStatusBadge(template.template_status);
                                        return (
                                            <tr key={template.id} className="hover:bg-blue-50/30 transition-colors duration-150 group">
                                                <td className="p-4">
                                                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                                </td>
                                                <td className="p-4 font-medium text-gray-900 border-l border-transparent group-hover:border-blue-100 transition-colors">
                                                    {template.template_name}
                                                    {template.meta_template_id && (
                                                        <div className="text-xs text-gray-400 font-normal mt-0.5 font-mono">
                                                            ID: {template.meta_template_id}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-xs font-medium text-indigo-600 border border-indigo-100">
                                                        {template.category}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-600">
                                                        {template.language}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${badge.style}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`}></span>
                                                        {badge.label}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs text-gray-500 max-w-[250px] truncate" title={template.content}>
                                                        {formatContent(template.content)}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-gray-500 text-xs">
                                                    {template.updated_at ? new Date(template.updated_at).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'short',
                                                        day: 'numeric'
                                                    }) : '—'}
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/30">
                            <div className="text-xs text-gray-500">
                                Showing <span className="font-medium text-gray-900">{filteredTemplates.length}</span> of <span className="font-medium text-gray-900">{templates.length}</span> templates
                            </div>
                            <div className="flex items-center gap-2">
                                <button disabled className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed bg-white">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button disabled className="p-1.5 rounded-lg border border-gray-200 text-gray-400 cursor-not-allowed bg-white">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* CREATE TEMPLATE MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800">Create New Template</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Template Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={newTemplate.template_name}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, template_name: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                    placeholder="e.g. Welcome Message"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category <span className="text-red-500">*</span></label>
                                <select
                                    value={newTemplate.category}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select a category</option>
                                    <option value="MARKETING">Marketing</option>
                                    <option value="UTILITY">Utility</option>
                                    <option value="AUTHENTICATION">Authentication</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Language <span className="text-red-500">*</span></label>
                                <select
                                    value={newTemplate.language}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, language: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                >
                                    <option value="">Select a language</option>
                                    <option value="en_US">English (US)</option>
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="es">Spanish</option>
                                    <option value="fr">French</option>
                                    <option value="pt_BR">Portuguese (BR)</option>
                                    <option value="ar">Arabic</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Content <span className="text-red-500">*</span></label>
                                <textarea
                                    rows={4}
                                    value={newTemplate.content}
                                    onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none"
                                    placeholder="Enter your template content here..."
                                />
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                            <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg text-sm font-medium">Cancel</button>
                            <button
                                onClick={handleCreateTemplate}
                                disabled={isCreating}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                                Create Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
