"use client";

import { useState, useRef, useCallback } from "react";
import { 
    Camera, 
    Upload, 
    X, 
    Loader2, 
    CheckCircle, 
    AlertCircle,
    User,
    Trash2
} from "lucide-react";
import profilePhotoService from "@/services/profilePhotoService";
import { useAuth } from "@/context/AuthContext";

interface ProfilePhotoManagerProps {
    currentPhotoUrl?: string | null;
    onPhotoUpdate?: (photoUrl: string | null) => void;
    size?: "sm" | "md" | "lg" | "xl";
    showUploadButton?: boolean;
    className?: string;
}

export default function ProfilePhotoManager({ 
    currentPhotoUrl, 
    onPhotoUpdate, 
    size = "lg",
    showUploadButton = true,
    className = ""
}: ProfilePhotoManagerProps) {
    const { token } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Size configurations
    const sizeConfig = {
        sm: { width: "w-12", height: "h-12", text: "text-xs" },
        md: { width: "w-16", height: "h-16", text: "text-sm" },
        lg: { width: "w-20", height: "h-20", text: "text-base" },
        xl: { width: "w-24", height: "h-24", text: "text-lg" }
    };

    const config = sizeConfig[size];

    // Clear messages after 3 seconds
    const clearMessages = useCallback(() => {
        setTimeout(() => {
            setError(null);
            setSuccess(null);
        }, 3000);
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        const validation = profilePhotoService.validateImageFile(file);
        if (!validation.valid) {
            setError(validation.error || "Invalid file");
            clearMessages();
            return;
        }

        try {
            // Create preview
            const previewUrl = await profilePhotoService.createImagePreview(file);
            setPreview(previewUrl);

            // Resize if needed
            const resizedFile = await profilePhotoService.resizeImage(file);

            // Upload photo
            setIsUploading(true);
            setError(null);
            setSuccess(null);

            const response = await profilePhotoService.uploadProfilePhoto(resizedFile, token!);
            
            setSuccess("Profile photo uploaded successfully!");
            setPreview(null);
            onPhotoUpdate?.(response.url);
            clearMessages();

        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to upload photo");
            setPreview(null);
            clearMessages();
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [token, onPhotoUpdate, clearMessages]);

    // Handle photo deletion
    const handleDeletePhoto = useCallback(async () => {
        if (!confirm("Are you sure you want to delete your profile photo?")) {
            return;
        }

        try {
            setIsDeleting(true);
            setError(null);
            setSuccess(null);

            await profilePhotoService.deleteProfilePhoto(token!);
            
            setSuccess("Profile photo deleted successfully!");
            onPhotoUpdate?.(null);
            clearMessages();

        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to delete photo");
            clearMessages();
        } finally {
            setIsDeleting(false);
        }
    }, [token, onPhotoUpdate, clearMessages]);

    // Trigger file input
    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Determine photo source
    const photoSource = preview || currentPhotoUrl;

    return (
        <div className={`flex flex-col items-center space-y-4 ${className}`}>
            {/* Profile Photo */}
            <div className="relative group">
                <div className={`${config.width} ${config.height} rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg transition-all duration-300 group-hover:shadow-xl`}>
                    {photoSource ? (
                        <img 
                            src={photoSource} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                            <User className={`w-1/2 h-1/2 text-white ${config.text}`} />
                        </div>
                    )}
                </div>

                {/* Always visible action buttons when photo exists */}
                {showUploadButton && photoSource && (
                    <div className="flex gap-2 mt-3">
                        {/* Update photo button */}
                        <button
                            onClick={triggerFileInput}
                            disabled={isUploading || isDeleting}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Update photo"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Update</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-4 h-4" />
                                    <span>Update</span>
                                </>
                            )}
                        </button>

                        {/* Delete photo button */}
                        <button
                            onClick={handleDeletePhoto}
                            disabled={isUploading || isDeleting}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete photo"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Delete</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {/* Hover overlay for when no photo exists */}
                {showUploadButton && !photoSource && (
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <button
                            onClick={triggerFileInput}
                            disabled={isUploading}
                            className="p-3 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            title="Upload photo"
                        >
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Upload className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Messages */}
            {error && (
                <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            {success && (
                <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{success}</span>
                </div>
            )}

                    </div>
    );
}

// Simple profile photo display component (no upload functionality)
export function ProfilePhotoDisplay({ 
    photoUrl, 
    size = "md", 
    className = "",
    alt = "Profile"
}: { 
    photoUrl?: string | null; 
    size?: "sm" | "md" | "lg" | "xl"; 
    className?: string;
    alt?: string;
}) {
    const sizeConfig = {
        sm: { width: "w-8", height: "h-8" },
        md: { width: "w-10", height: "h-10" },
        lg: { width: "w-12", height: "h-12" },
        xl: { width: "w-16", height: "h-16" }
    };

    const config = sizeConfig[size];

    return (
        <div className={`${config.width} ${config.height} rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200 ${className}`}>
            {photoUrl ? (
                <img 
                    src={photoUrl} 
                    alt={alt} 
                    className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                    <User className="w-1/2 h-1/2 text-white" />
                </div>
            )}
        </div>
    );
}
