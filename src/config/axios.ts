import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from './constants';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor: attach access token
axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            const isAdminPath = pathname.includes('/admin');
            const isResellerPath = pathname.includes('/reseller');

            let token = localStorage.getItem('token');
            
            // Intelligence: If explicitly on a reseller path and reseller token exists, prefer it
            if (isResellerPath && localStorage.getItem('resellerToken')) {
                token = localStorage.getItem('resellerToken');
            } 
            // Conversely, if on admin path, ensure we use the primary token or specifically look for an admin token if we distinguish them
            else if (isAdminPath) {
                token = localStorage.getItem('token');
            }

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & refresh token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {

            // If the failure was on the refresh endpoint itself, logout
            if (originalRequest.url?.includes('/auth/refresh-token')) {
                if (typeof window !== 'undefined') {
                    const isAdmin = localStorage.getItem('admin_logged_in') === 'true' || window.location.pathname.includes('admin');
                    localStorage.removeItem('token');
                    localStorage.removeItem('resellerToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('admin_logged_in');
                    localStorage.removeItem('user_role');
                    window.location.href = isAdmin ? '/admin-login' : '/login';
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                try {
                    const token = await new Promise<string>((resolve, reject) => {
                        failedQueue.push({ resolve: resolve as any, reject });
                    });
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                    }
                    return axiosInstance(originalRequest);
                } catch (err) {
                    return Promise.reject(err);
                }
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

            if (!refreshToken) {
                isRefreshing = false;
                if (typeof window !== 'undefined') {
                    const isAdmin = localStorage.getItem('admin_logged_in') === 'true' || window.location.pathname.includes('admin');
                    localStorage.removeItem('token');
                    localStorage.removeItem('resellerToken');
                    localStorage.removeItem('admin_logged_in');
                    localStorage.removeItem('user_role');
                    window.location.href = isAdmin ? '/admin-login' : '/login';
                }
                return Promise.reject(error);
            }

            try {
                // Perform the refresh
                const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
                    refresh_token: refreshToken
                });

                const { access_token } = response.data;

                if (typeof window !== 'undefined') {
                    const pathname = window.location.pathname;
                    const isResellerPath = pathname.includes('/reseller');

                    // Standardize: If on a reseller path, update resellerToken, otherwise update primary token
                    if (isResellerPath && localStorage.getItem('resellerToken')) {
                        localStorage.setItem('resellerToken', access_token);
                    } else {
                        localStorage.setItem('token', access_token);
                    }
                }

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${access_token}`;
                }

                processQueue(null, access_token);
                return axiosInstance(originalRequest);

            } catch (err) {
                processQueue(err, null);
                if (typeof window !== 'undefined') {
                    const isAdmin = localStorage.getItem('admin_logged_in') === 'true' || window.location.pathname.includes('admin');
                    localStorage.removeItem('token');
                    localStorage.removeItem('resellerToken');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('admin_logged_in');
                    window.location.href = isAdmin ? '/admin-login' : '/login';
                }
                return Promise.reject(err);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
