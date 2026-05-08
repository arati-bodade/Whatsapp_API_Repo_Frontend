import axiosInstance from "@/config/axios";
import { API_BASE_URL } from "@/config/constants";

export const getMe = async () => {
    const response = await axiosInstance.get(`${API_BASE_URL}/auth/me`);
    return response.data;
};

export const logout = async () => {
    // We can call specific logout endpoints if needed, 
    // but the most important part is clearing the local state.
    try {
        await axiosInstance.post(`${API_BASE_URL}/auth/logout`);
    } catch (error) {
        // Ignore error on logout
    }
};

const authService = {
    getMe,
    logout
};

export default authService;
