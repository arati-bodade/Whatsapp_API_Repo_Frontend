"use client"

import { Filter, Download, Users, Trash2, Plus, X, Loader2, Save, Eye, Search, Smartphone, Laptop, Scan, RefreshCw, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import groupService, { Group, ContactItem } from "@/services/groupService"
import { deviceService, Device } from "@/services/deviceService"
import { useModal } from "@/context/ModalContext"
import { useAuth } from "@/context/AuthContext"
import { cn } from "@/lib/utils"

export default function GroupsManagerPage() {
    const [groups, setGroups] = useState<Group[]>([])
    const [filteredGroups, setFilteredGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [searchTerm, setSearchTerm] = useState("")
    const { showAlert, showConfirm } = useModal()

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupDesc, setNewGroupDesc] = useState("")
    const [isCreating, setIsCreating] = useState(false)

    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [groupContacts, setGroupContacts] = useState<ContactItem[]>([])
    const [isLoadingContacts, setIsLoadingContacts] = useState(false)
    const [newContactRows, setNewContactRows] = useState<ContactItem[]>([])
    const [isSaving, setIsSaving] = useState(false)

    // WhatsApp Scan State
    const [viewMode, setViewMode] = useState<"crm" | "scan">("crm")
    const [devices, setDevices] = useState<Device[]>([])
    const [selectedDeviceId, setSelectedDeviceId] = useState("")
    const [scannedGroups, setScannedGroups] = useState<any[]>([])
    const [isScanning, setIsScanning] = useState(false)
    const [isExporting, setIsExporting] = useState<string | null>(null)

    useEffect(() => {
        fetchGroups()
        loadDevices()
    }, [])
    useEffect(() => {
        setFilteredGroups(groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())))
    }, [groups, searchTerm])

    const token = () => localStorage.getItem("token") || localStorage.getItem("access_token") || ""

    const fetchGroups = async () => {
        setLoading(true)
        try { setGroups(await groupService.getGroups(token())) }
        catch { setStatus({ type: "error", text: "Failed to load groups." }) }
        finally { setLoading(false) }
    }

    const handleCreateGroup = async () => {
        if (!newGroupName.trim()) { setStatus({ type: "error", text: "Group name is required." }); return }
        setIsCreating(true)
        try {
            const newGroup = await groupService.createGroup(token(), newGroupName, newGroupDesc)
            setStatus({ type: "success", text: "Group created successfully!" })
            setIsCreateModalOpen(false); setNewGroupName(""); setNewGroupDesc("")
            await fetchGroups(); setSelectedGroup(newGroup)
        } catch { setStatus({ type: "error", text: "Failed to create group." }) }
        finally { setIsCreating(false) }
    }

    const openViewGroup = async (group: Group) => {
        setSelectedGroup(group); setIsViewModalOpen(true); setNewContactRows([])
        setGroupContacts([]); setIsLoadingContacts(true); setStatus(null)
        try { setGroupContacts(await groupService.getGroupContacts(token(), group.group_id)) }
        catch { console.error("Failed to fetch contacts") }
        finally { setIsLoadingContacts(false) }
    }

    const validateAndSave = async (contacts: ContactItem[], isBatch: boolean) => {
        if (!selectedGroup) return
        const valid = contacts.filter(c => c.phone.trim())
        if (!valid.length) { showAlert("Error", "Please enter a valid phone number."); return }
        const phones = valid.map(c => c.phone)
        if (phones.some((p, i) => phones.indexOf(p) !== i)) { showAlert("Error", "Duplicate phone numbers found."); return }
        const existing = new Set(groupContacts.map(c => c.phone))
        if (valid.some(c => existing.has(c.phone))) { showAlert("Error", "One or more numbers already exist in this group."); return }
        setIsSaving(true)
        try {
            await groupService.addContacts(token(), selectedGroup.group_id, valid)
            setStatus({ type: "success", text: "Contacts added successfully!" })
            setGroupContacts(await groupService.getGroupContacts(token(), selectedGroup.group_id))
            fetchGroups(); setNewContactRows([])
        } catch (e: any) {
            e.response?.status === 404
                ? showAlert("Error", "Group not found. Please refresh.")
                : showAlert("Error", "Failed to add contacts.")
        } finally { setIsSaving(false) }
    }

    const handleDeleteContact = async (phone: string) => {
        if (!selectedGroup) return
        showConfirm("Remove Contact", `Remove "${phone}" from this group?`, async () => {
            try {
                await groupService.deleteContact(token(), selectedGroup.group_id, phone)
                setGroupContacts(await groupService.getGroupContacts(token(), selectedGroup.group_id))
                fetchGroups(); setStatus({ type: "success", text: "Contact removed." })
            } catch { showAlert("Error", "Failed to remove contact.") }
        })
    }

    const handleDeleteGroup = async (group: Group) => {
        showConfirm("Delete Group", `Delete "${group.name}"? This cannot be undone.`, async () => {
            try {
                const res = await groupService.deleteGroup(token(), group.group_id)
                if (res.success) {
                    setGroups(p => p.filter(g => g.group_id !== group.group_id))
                    if (selectedGroup?.group_id === group.group_id) setSelectedGroup(null)
                    showAlert("Success", "Group deleted successfully.")
                } else { showAlert("Error", res.message || "Failed to delete group.") }
            } catch (e: any) { showAlert("Error", e.response?.data?.detail || "Failed to delete group.") }
        })
    }

    const { user } = useAuth()

    const loadDevices = async () => {
        try {
            const data = await deviceService.getDevices("connected")
            setDevices(data)
            if (data.length > 0 && !selectedDeviceId) setSelectedDeviceId(data[0].device_id)
        } catch (e) { console.error("Failed to load devices", e) }
    }

    const handleScanGroups = async () => {
        if (!selectedDeviceId) { showAlert("Error", "Please select a connected device."); return }
        setIsScanning(true)
        setScannedGroups([])
        try {
            const res = await groupService.scanWhatsAppGroups(token(), selectedDeviceId)
            if (res.success) {
                setScannedGroups(res.groups)
                setStatus({ type: "success", text: `Found ${res.total} groups on your WhatsApp.` })
            } else { setStatus({ type: "error", text: "Failed to scan groups." }) }
        } catch (e: any) {
            setStatus({ type: "error", text: e.response?.data?.detail || "Failed to scan groups." })
        } finally { setIsScanning(false) }
    }

    const handleExportGroup = async (groupName: string, groupId: string) => {
        setIsExporting(groupId)
        try {
            const res = await groupService.exportGroupMembers(token(), selectedDeviceId, groupName)
            if (res.members) {
                // Generate CSV
                const headers = ["Name", "Phone", "Status"]
                const rows = res.members.map((m: any) => [
                    (m.name || m.subject || "Unknown").replace(/,/g, ' '),
                    m.id ? m.id.split('@')[0] : "Unknown",
                    m.isAdmin ? 'Admin' : 'Member'
                ])

                const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement("a")
                const url = URL.createObjectURL(blob)
                link.setAttribute("href", url)
                link.setAttribute("download", `${groupName.replace(/\s+/g, '_')}_members.csv`)
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                setStatus({ type: "success", text: "Export completed successfully!" })
            }
        } catch (e: any) {
            showAlert("Error", e.response?.data?.detail || "Failed to export group members.")
        } finally { setIsExporting(null) }
    }

    return (
        <div className="max-w-[1400px] mx-auto space-y-6 p-8 pt-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="page-header mb-0">
                    <div className="page-header-icon">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900">Group Manager</h2>
                        <p className="text-sm text-slate-500 mt-0.5">Create and manage your contact groups</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                        onClick={() => setViewMode("crm")}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all",
                            viewMode === "crm" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        Internal CRM
                    </button>
                    <button
                        onClick={() => setViewMode("scan")}
                        className={cn("px-4 py-2 text-xs font-bold rounded-lg transition-all",
                            viewMode === "scan" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                    >
                        WhatsApp Scan
                    </button>
                </div>
                {viewMode === "crm" && (
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="btn-brand flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl"
                    >
                        <Plus className="h-4 w-4" /> Create New Group
                    </button>
                )}
            </div>

            {/* Status banner */}
            {status && (
                <div className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium border",
                    status.type === "success" ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"
                )}>
                    <span>{status.text}</span>
                    <button onClick={() => setStatus(null)}><X className="h-4 w-4" /></button>
                </div>
            )}

            {viewMode === "crm" ? (
                /* CRM Table card */
                <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
                    {/* Toolbar */}
                    <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-3">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Find a group..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="form-input h-10 pl-10 pr-4 text-sm w-full rounded-full bg-slate-50 border-slate-200 focus:bg-white focus:border-[#128C7E] transition-all"
                            />
                        </div>
                        <span className="text-xs text-slate-400 font-medium ml-auto">{filteredGroups.length} group{filteredGroups.length !== 1 ? "s" : ""}</span>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-48 gap-3">
                                <Loader2 className="h-7 w-7 animate-spin text-[#128C7E]" />
                                <p className="text-sm text-slate-400 font-medium">Loading groups…</p>
                            </div>
                        ) : filteredGroups.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-56 gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center float">
                                    <Users className="h-7 w-7 text-slate-300" />
                                </div>
                                <p className="text-sm font-medium text-slate-400">No groups yet</p>
                                <button onClick={() => setIsCreateModalOpen(true)}
                                    className="text-xs text-[#128C7E] font-semibold hover:underline">
                                    Create your first group →
                                </button>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-100">
                                        {["Group Name", "Members", "Description", "Actions"].map((h, i) => (
                                            <th key={h} className={cn("px-5 py-3.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
                                                i === 3 && "text-center")}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredGroups.map((group, idx) => (
                                        <tr key={group.group_id}
                                            className="tr-hover"
                                            style={{ animation: `fadeSlideUp .35s ease ${idx * 0.04}s both` }}>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-xl bg-[#F0FDF9] flex items-center justify-center shrink-0">
                                                        <Users className="h-4 w-4 text-[#128C7E]" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{group.name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono truncate max-w-[160px]">{group.group_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 bg-[#F0FDF9] text-[#128C7E] border border-[#A7F3D0] rounded-full px-2.5 py-0.5 text-xs font-semibold">
                                                    {group.contact_count} contacts
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="text-sm text-slate-500 truncate max-w-[240px]">{group.description || "—"}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button onClick={() => openViewGroup(group)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition-colors">
                                                        <Eye className="h-3.5 w-3.5" /> View
                                                    </button>
                                                    <button onClick={() => handleDeleteGroup(group)}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-semibold border border-red-200 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" /> Remove
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    <div className="px-5 py-3 border-t border-slate-50 bg-slate-50/40">
                        <p className="text-xs text-slate-400 font-medium">Showing {filteredGroups.length} of {groups.length} groups</p>
                    </div>
                </div>
            ) : (
                /* WhatsApp Scan card */
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:items-end gap-6">
                            <div className="flex-1 space-y-2">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Connected Device</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1">
                                        <Smartphone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <select
                                            value={selectedDeviceId}
                                            onChange={(e) => setSelectedDeviceId(e.target.value)}
                                            className="form-input h-11 pl-10 text-sm w-full bg-slate-50 border-slate-200"
                                        >
                                            <option value="">Choose a device...</option>
                                            {devices.map(d => (
                                                <option key={d.device_id} value={d.device_id}>
                                                    {d.device_name} ({d.session_status})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={loadDevices}
                                        className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors"
                                        title="Refresh Devices"
                                    >
                                        <RefreshCw className="h-4 w-4 text-slate-400" />
                                    </button>
                                </div>
                            </div>
                            <button
                                onClick={handleScanGroups}
                                disabled={isScanning || !selectedDeviceId}
                                className="btn-brand h-11 px-8 rounded-xl flex items-center gap-2 shrink-0 disabled:opacity-50"
                            >
                                {isScanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Scan className="h-4 w-4" />}
                                {isScanning ? "Scanning WhatsApp..." : "Scan My Groups"}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-slate-400" />
                                <h3 className="text-sm font-bold text-slate-700">WhatsApp Groups Found</h3>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{scannedGroups.length} Groups Scanned</span>
                        </div>

                        <div className="overflow-x-auto">
                            {isScanning ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-4">
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-[#128C7E] animate-spin" />
                                        <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-[#128C7E]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-slate-700">Fetching groups from your phone...</p>
                                        <p className="text-xs text-slate-400 mt-1">This takes a few seconds depending on your chat history.</p>
                                    </div>
                                </div>
                            ) : scannedGroups.length === 0 ? (
                                <div className="py-20 flex flex-col items-center justify-center gap-3">
                                    <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-200">
                                        <Scan className="h-8 w-8" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-400 italic">No groups scanned yet. Select a device and start scanning.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100">
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Group Information</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400">Members</th>
                                            <th className="px-6 py-4 text-[11px] font-bold uppercase text-slate-400 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {scannedGroups.map((g, i) => (
                                            <tr key={g.id || i} className="group hover:bg-slate-50/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                                                            <Users className="h-5 w-5 text-teal-600" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-700">{g.subject || g.name || "Unnamed Group"}</p>
                                                            <p className="text-[10px] font-mono text-slate-400 mt-0.5">{g.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                                                        {g.participants || 0} Members
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            onClick={() => handleExportGroup(g.subject || g.name, g.id)}
                                                            disabled={isExporting === g.id}
                                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:border-teal-500 hover:text-teal-600 transition-all shadow-sm"
                                                        >
                                                            {isExporting === g.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                                                            {isExporting === g.id ? "Extracting..." : "Export Excel"}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "One-Click Extract", desc: "Instantly download all participant phone numbers from any group you belong to.", icon: Scan, color: "teal" },
                            { title: "Excel Optimized", desc: "Data is formatted specifically for CRM uploads and bulk messaging tools.", icon: FileText, color: "blue" },
                            { title: "Privacy First", desc: "Scanning is performed locally on your device instance to ensure data security.", icon: Smartphone, color: "purple" }
                        ].map((f, i) => (
                            <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 flex gap-4">
                                <div className={`w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0`}>
                                    <f.icon className={`h-5 w-5 text-${f.color}-500`} />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{f.title}</h4>
                                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* CREATE GROUP MODAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-bold">Create New Group</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Add a contact group for bulk messaging</p>
                            </div>
                            <button onClick={() => setIsCreateModalOpen(false)}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="form-label">Group Name <span className="text-red-400">*</span></label>
                                <input type="text" value={newGroupName}
                                    onChange={e => setNewGroupName(e.target.value)}
                                    className="form-input" placeholder="e.g. VIP Customers" />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea rows={3} value={newGroupDesc}
                                    onChange={e => setNewGroupDesc(e.target.value)}
                                    className="form-input resize-none pt-2.5" placeholder="Describe this group…" />
                            </div>
                        </div>
                        <div className="px-6 pb-6 flex justify-end gap-3">
                            <button onClick={() => setIsCreateModalOpen(false)}
                                className="px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleCreateGroup} disabled={isCreating}
                                className="btn-brand flex items-center gap-2 px-5 py-2.5 text-sm rounded-xl">
                                {isCreating && <Loader2 className="h-4 w-4 animate-spin" />}
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW GROUP MODAL */}
            {isViewModalOpen && selectedGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between shrink-0">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-bold">{selectedGroup.name}</h3>
                                    <span className="bg-[#128C7E]/20 text-teal-300 text-xs px-2 py-0.5 rounded-full font-semibold border border-teal-500/20">
                                        {groupContacts.length} contacts
                                    </span>
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">{selectedGroup.description || "No description"}</p>
                            </div>
                            <button onClick={() => setIsViewModalOpen(false)}
                                className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                                <X className="h-4 w-4 text-white" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 z-10 bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        {["#", "Name", "Phone", "Status / Action"].map((h, i) => (
                                            <th key={h} className={cn("px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400",
                                                i === 3 && "text-right pr-6")}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {isLoadingContacts ? (
                                        <tr><td colSpan={4} className="py-16 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-[#128C7E] mx-auto" />
                                        </td></tr>
                                    ) : (
                                        <>
                                            {groupContacts.map((c, i) => (
                                                <tr key={i} className="tr-hover">
                                                    <td className="px-5 py-3 text-xs text-slate-400">{i + 1}</td>
                                                    <td className="px-5 py-3 text-sm font-semibold text-slate-800">{c.name || "—"}</td>
                                                    <td className="px-5 py-3 text-sm font-mono text-slate-500">{c.phone}</td>
                                                    <td className="px-5 py-3 pr-6 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <span className="badge-success text-[10px]">Valid</span>
                                                            <button onClick={() => handleDeleteContact(c.phone)}
                                                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {newContactRows.map((row, idx) => (
                                                <tr key={`new-${idx}`} className="bg-[#F0FDF9]/40">
                                                    <td className="px-5 py-3 text-xs text-[#128C7E] font-bold">+</td>
                                                    <td className="px-5 py-2">
                                                        <input type="text" value={row.name}
                                                            onChange={e => { const rows = [...newContactRows]; rows[idx].name = e.target.value; setNewContactRows(rows) }}
                                                            placeholder="Name (optional)" className="form-input h-8 text-xs" />
                                                    </td>
                                                    <td className="px-5 py-2">
                                                        <input type="text" value={row.phone}
                                                            onChange={e => { const rows = [...newContactRows]; rows[idx].phone = e.target.value; setNewContactRows(rows) }}
                                                            placeholder="91XXXXXXXXXX" className="form-input h-8 text-xs" />
                                                    </td>
                                                    <td className="px-5 py-2 pr-6 text-right">
                                                        {newContactRows.length === 1 ? (
                                                            <button onClick={() => validateAndSave([newContactRows[idx]], false)}
                                                                disabled={isSaving}
                                                                className="w-8 h-8 rounded-xl btn-brand flex items-center justify-center">
                                                                {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                            </button>
                                                        ) : (
                                                            <button onClick={() => { const rows = [...newContactRows]; rows.splice(idx, 1); setNewContactRows(rows) }}
                                                                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {!isLoadingContacts && groupContacts.length === 0 && newContactRows.length === 0 && (
                                                <tr><td colSpan={4} className="py-16 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Users className="h-8 w-8 text-slate-200" />
                                                        <p className="text-sm text-slate-400">No contacts yet. Click "Add Contact" below.</p>
                                                    </div>
                                                </td></tr>
                                            )}
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40 flex items-center justify-between shrink-0">
                            <button onClick={() => setNewContactRows(p => [...p, { name: "", phone: "" }])}
                                className="flex items-center gap-1.5 text-sm text-[#128C7E] font-semibold hover:bg-[#F0FDF9] px-3 py-1.5 rounded-lg transition-colors">
                                <Plus className="h-4 w-4" /> Add Contact
                            </button>
                            {newContactRows.length > 1 && (
                                <button onClick={() => validateAndSave(newContactRows, true)} disabled={isSaving}
                                    className="btn-brand flex items-center gap-2 px-5 py-2 text-sm rounded-xl">
                                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Save {newContactRows.length} Contacts
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
