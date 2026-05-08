import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = `${API_BASE_URL}/profile-photos`;

export interface ProfilePhotoResponse {
    message: string;
    file_path: string;
    url: string;
}

export interface ProfilePhotoInfo {
    has_profile_photo: boolean;
    photo_url: string | null;
    user_type: string;
    user_id: string;
}

export interface ProfilePhotoStats {
    users: {
        total: number;
        with_photos: number;
        percentage: number;
    };
    resellers: {
        total: number;
        with_photos: number;
        percentage: number;
    };
    admins: {
        total: number;
        with_photos: number;
        percentage: number;
    };
    overall: {
        total_with_photos: number;
        total_users: number;
        overall_percentage: number;
    };
}

const profilePhotoService = {
    // Upload profile photo
    uploadProfilePhoto: async (file: File, token: string): Promise<ProfilePhotoResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API_URL}/upload`, formData);
        return response.data;
    },

    // Update profile photo
    updateProfilePhoto: async (file: File, token: string): Promise<ProfilePhotoResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.put(`${API_URL}/update`, formData);
        return response.data;
    },

    // Delete profile photo
    deleteProfilePhoto: async (token: string): Promise<{ message: string }> => {
        const response = await axios.delete(`${API_URL}/delete`);
        return response.data;
    },

    // Get current user's profile photo info
    getMyProfilePhoto: async (token: string): Promise<ProfilePhotoInfo> => {
        const response = await axios.get(`${API_URL}/me`);
        return response.data;
    },

    // Get specific user's profile photo info
    getUserProfilePhoto: async (userId: string, token: string): Promise<ProfilePhotoInfo> => {
        const response = await axios.get(`${API_URL}/user/${userId}`);
        return response.data;
    },

    // Get profile photo URL for viewing
    getProfilePhotoUrl: (userType: string, userId: string): string => {
        return `${API_URL}/view/${userType}/${userId}`;
    },

    // Validate image file before upload
    validateImageFile: (file: File): { valid: boolean; error?: string } => {
        // Check file size (5MB limit)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { valid: false, error: 'File size exceeds 5MB limit' };
        }

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { 
                valid: false, 
                error: 'Invalid file type. Allowed types: JPG, PNG, GIF, WebP' 
            };
        }

        // Check file extension
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
            return { 
                valid: false, 
                error: 'Invalid file extension. Allowed: .jpg, .jpeg, .png, .gif, .webp' 
            };
        }

        return { valid: true };
    },

    // Create image preview
    createImagePreview: (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const result = e.target?.result;
                if (typeof result === 'string') {
                    resolve(result);
                } else {
                    reject(new Error('Failed to read file'));
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    },

    // Resize image if needed
    resizeImage: (file: File, maxWidth: number = 1024, maxHeight: number = 1024): Promise<File> => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = img;
                
                if (width > maxWidth || height > maxHeight) {
                    const ratio = Math.min(maxWidth / width, maxHeight / height);
                    width *= ratio;
                    height *= ratio;
                }

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and resize image
                ctx?.drawImage(img, 0, 0, width, height);

                // Convert to blob
                canvas.toBlob((blob) => {
                    if (blob) {
                        const resizedFile = new File([blob], file.name, {
                            type: file.type,
                            lastModified: Date.now()
                        });
                        resolve(resizedFile);
                    } else {
                        reject(new Error('Failed to resize image'));
                    }
                }, file.type, 0.85);
            };

            img.onerror = () => {
                reject(new Error('Failed to load image'));
            };

            img.src = URL.createObjectURL(file);
        });
    },

    // Get profile photo statistics (admin only)
    getProfilePhotoStats: async (token: string): Promise<ProfilePhotoStats> => {
        const response = await axios.get(`${API_URL}/stats`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Cleanup unused photos (admin only)
    cleanupUnusedPhotos: async (daysOld: number = 30, token: string): Promise<{
        message: string;
        deleted_count: number;
        days_old: number;
    }> => {
        const response = await axios.post(`${API_URL}/cleanup?days_old=${daysOld}`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    }
};

export default profilePhotoService;
