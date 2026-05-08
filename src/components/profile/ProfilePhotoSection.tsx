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
    Trash2,
    Edit3
} from "lucide-react";
import profilePhotoService from "@/services/profilePhotoService";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import {
    Dialog, DialogContent, DialogDescription,
    DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface ProfilePhotoSectionProps {
    currentPhotoUrl?: string | null;
    onPhotoUpdate?: (photoUrl: string | null) => void;
    className?: string;
}

export default function ProfilePhotoSection({ 
    currentPhotoUrl, 
    onPhotoUpdate, 
    className = ""
}: ProfilePhotoSectionProps) {
    const { token } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showActions, setShowActions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Debug logging
    console.log('ProfilePhotoSection - currentPhotoUrl:', currentPhotoUrl);
    console.log('ProfilePhotoSection - photoSource:', preview || currentPhotoUrl);

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
            
            setSuccess("Profile photo updated successfully!");
            setPreview(null);
            onPhotoUpdate?.(response.url);
            clearMessages();

        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to update photo");
            setPreview(null);
            clearMessages();
        } finally {
            setIsUploading(false);
            setShowActions(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [token, onPhotoUpdate, clearMessages]);

    // Handle photo deletion
    const handleDeletePhoto = useCallback(async () => {
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
            setShowActions(false);
            setIsDeleteDialogOpen(false);
        }
    }, [token, onPhotoUpdate, clearMessages]);

    // Trigger file input
    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Determine photo source
    const getPhotoSource = () => {
        if (preview) return preview;
        if (!currentPhotoUrl) return null;
        
        // If it's already a full URL or blob, return as is
        if (currentPhotoUrl.startsWith('http') || currentPhotoUrl.startsWith('blob:')) {
            return currentPhotoUrl;
        }
        
        const backendBaseUrl = API_BASE_URL.replace('/api', '');

        // Handle paths that already have the prefix
        if (currentPhotoUrl.startsWith('/uploads/') || currentPhotoUrl.startsWith('uploads/')) {
            return `${backendBaseUrl}${currentPhotoUrl.startsWith('/') ? '' : '/'}${currentPhotoUrl}`;
        }
        
        // Fallback: Add prefix for old relative paths (like 'users/xxx.jpg')
        return `${backendBaseUrl}/uploads/profile_images/${currentPhotoUrl.startsWith('/') ? currentPhotoUrl.substring(1) : currentPhotoUrl}`;
    };

    const photoSource = getPhotoSource();

    // Debug logging
    console.log('ProfilePhotoSection render - photoSource:', photoSource);
    console.log('ProfilePhotoSection render - hasPhoto:', !!photoSource);

    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Profile Photo</h3>
                {photoSource && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={triggerFileInput}
                            disabled={isUploading || isDeleting}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Update photo"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Camera className="w-4 h-4" />
                                    <span>Update</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={handleDeletePhoto}
                            disabled={isUploading || isDeleting}
                            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete photo"
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Deleting...</span>
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
            </div>

            <div className="flex flex-col items-center space-y-4">
                {/* Profile Photo */}
                <div className="relative group">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-gray-200 shadow-lg transition-all duration-300 group-hover:shadow-xl">
                        {photoSource ? (
                            <img 
                                src={photoSource} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                                <User className="w-12 h-12 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Quick action overlay */}
                    <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                        <button
                            onClick={triggerFileInput}
                            disabled={isUploading || isDeleting}
                            className="p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
                            title={photoSource ? "Change photo" : "Upload photo"}
                        >
                            {isUploading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Camera className="w-5 h-5" />
                            )}
                        </button>
                        {photoSource && (
                            <button
                                onClick={() => setIsDeleteDialogOpen(true)}
                                disabled={isUploading || isDeleting}
                                className="p-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                title="Delete photo"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent className="sm:max-w-[360px] rounded-2xl p-6 shadow-2xl border border-gray-100 bg-white">
                        <DialogHeader className="text-left">
                            <DialogTitle className="text-xl font-bold text-gray-900">Delete Profile Photo?</DialogTitle>
                            <DialogDescription className="text-gray-500 font-medium pt-2">
                                Are you sure you want to remove your photo? This action cannot be undone.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex gap-3 mt-6">
                            <Button 
                                variant="outline" 
                                onClick={() => setIsDeleteDialogOpen(false)}
                                disabled={isDeleting}
                                className="flex-1 rounded-xl font-bold border-gray-200"
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="destructive" 
                                onClick={handleDeletePhoto}
                                disabled={isDeleting}
                                className="flex-1 rounded-xl font-bold bg-red-600 hover:bg-red-700"
                            >
                                {isDeleting ? "Deleting..." : "Yes, Delete"}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                {/* Upload info */}
                {!photoSource && (
                    <div className="text-center text-gray-500 text-sm">
                        <p className="font-medium">Add a profile photo</p>
                        <p className="text-xs mt-1">JPG, PNG, GIF, WebP • Max 5MB</p>
                    </div>
                )}

                {/* Upload button for when no photo exists */}
                {!photoSource && (
                    <button
                        onClick={triggerFileInput}
                        disabled={isUploading || isDeleting}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Uploading...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                <span>Upload Photo</span>
                            </>
                        )}
                    </button>
                )}

                {/* Messages */}
                {error && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 px-3 py-2 rounded-lg text-sm w-full max-w-xs">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg text-sm w-full max-w-xs">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
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
        </div>
    );
}
