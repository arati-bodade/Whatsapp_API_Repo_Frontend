"use client";

import { useState } from "react";
import {
    Image as ImageIcon,
    Video,
    FileText,
    Link as LinkIcon,
} from "lucide-react";

type MediaType = "image" | "video" | "document";

interface MediaMessageComposerProps {
    mediaType: MediaType;
    setMediaType: (type: MediaType) => void;
    filePath: string;
    setFilePath: (path: string) => void;
    file: File | null;
    setFile: (file: File | null) => void;
    caption: string;
    setCaption: (caption: string) => void;
}

const MEDIA_TABS: { key: MediaType; label: string; icon: React.ReactNode }[] = [
    { key: "image", label: "Image", icon: <ImageIcon size={18} /> },
    { key: "video", label: "Video", icon: <Video size={18} /> },
    { key: "document", label: "Document", icon: <FileText size={18} /> },
];

const MAX_CAPTION_LENGTH = 1024;

export default function MediaMessageComposer({
    mediaType,
    setMediaType,
    filePath,
    setFilePath,
    file,
    setFile,
    caption,
    setCaption,
}: MediaMessageComposerProps) {

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setFilePath(""); // Clear manual path if file is selected
        }
    };

    const clearFile = () => {
        setFile(null);
    };

    return (
        <div className="space-y-6">
            {/* Media Type Selector — Segmented Control */}
            <div>
                <label className="block text-sm font-bold text-muted-foreground mb-3 uppercase tracking-tight pl-1">
                    Media Type
                </label>
                <div className="flex p-1.5 bg-secondary/30 rounded-2xl w-fit border border-border">
                    {MEDIA_TABS.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setMediaType(tab.key)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${mediaType === tab.key
                                ? "bg-card text-emerald-600 shadow-md ring-1 ring-border"
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-bold text-muted-foreground uppercase tracking-tight pl-1">
                    File Attachment
                </label>
                
                {!file ? (
                    <div className="relative group">
                        <input
                            type="file"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                        />
                        <div className="border-2 border-dashed border-border rounded-2xl p-10 flex flex-col items-center justify-center gap-4 transition-all group-hover:border-emerald-500/50 group-hover:bg-emerald-500/5">
                            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-muted-foreground group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-all duration-300">
                                <ImageIcon size={28} />
                            </div>
                            <div className="text-center">
                                <p className="text-sm font-bold text-foreground">Click or drag to upload</p>
                                <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-wide">Images, Videos, or Documents</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                            <FileText size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">{file.name}</p>
                            <p className="text-xs text-emerald-600 font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button 
                            onClick={clearFile}
                            className="p-2 hover:bg-emerald-500/20 rounded-lg text-emerald-600 transition-colors"
                        >
                            <span className="text-xl font-bold leading-none">×</span>
                            <span className="sr-only">Remove file</span>
                        </button>
                    </div>
                )}

                <div className="flex items-center gap-4 py-3">
                    <div className="h-[1px] bg-border flex-1"></div>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] px-2">OR EXTERNAL PATH</span>
                    <div className="h-[1px] bg-border flex-1"></div>
                </div>
                </div>

                {/* File Path Input */}
                <div>
                    <div className="relative">
                        <LinkIcon className="absolute left-4 top-3.5 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            value={filePath}
                            onChange={(e) => {
                                setFilePath(e.target.value);
                                if (e.target.value) setFile(null); // Clear file if manual path is typed
                            }}
                            className="w-full pl-11 pr-4 py-3 bg-white text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all text-sm shadow-sm"
                            placeholder="e.g. C:\Users\ASUS\Downloads\file.pdf or https://..."
                        />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground italic pl-1">
                        Enter a local file path or a publicly accessible URL.
                    </p>
                </div>

                {/* Caption Input */}
                <div>
                    <div className="flex items-center justify-between mb-3 pl-1">
                        <label className="text-sm font-bold text-muted-foreground uppercase tracking-tight">
                            Caption / Message <span className="font-normal text-[10px] italic lowercase">(optional)</span>
                        </label>
                        <span
                            className={`text-xs font-bold ${caption.length > MAX_CAPTION_LENGTH
                                ? "text-red-500"
                                : "text-muted-foreground"
                                }`}
                        >
                            {caption.length} / {MAX_CAPTION_LENGTH}
                        </span>
                    </div>
                    <textarea
                        value={caption}
                        onChange={(e) => {
                            if (e.target.value.length <= MAX_CAPTION_LENGTH) {
                                setCaption(e.target.value);
                            }
                        }}
                        className="w-full p-4 bg-white text-gray-900 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/40 outline-none transition-all h-32 resize-none shadow-sm text-sm"
                        placeholder="Add an optional caption to your media..."
                    />
                    <p className="mt-1 text-xs text-gray-400">
                        If provided, the file + caption will be sent together via <code className="text-emerald-600">/send-file-text</code>. Otherwise, only the file is sent via <code className="text-emerald-600">/send-file</code>.
                    </p>
                </div>
            </div>
    );
}
