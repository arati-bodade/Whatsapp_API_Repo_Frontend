// Base URLs for backend APIs and Engine
// 🔥 FIX: Handle mixed content by using HTTPS when frontend is served over HTTPS
const getApiUrl = () => {
  // Check if we're in development and frontend is served over HTTPS
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isFrontendHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  
  let baseUrl = process.env.NEXT_PUBLIC_API_URL;
  
  if (!baseUrl) {
    // Default to localhost:8000, but handle HTTPS mixed content
    if (isDevelopment && isFrontendHttps) {
      // When frontend is HTTPS in development, try HTTPS backend or use ngrok
      baseUrl = process.env.NEXT_PUBLIC_DEV_HTTPS_API_URL || "https://localhost:8000/api";
    } else {
      baseUrl = "http://localhost:8000/api";
    }
  }
  
  return baseUrl;
};

const rawApiUrl = getApiUrl();

// 🔥 ROBUST FIX: Ensure API_BASE_URL always ends with /api to avoid 404s
export const API_BASE_URL = rawApiUrl.endsWith("/api") 
  ? rawApiUrl 
  : `${rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl}/api`;

export const WHATSAPP_ENGINE_URL = (() => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isFrontendHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
  
  let engineUrl = process.env.NEXT_PUBLIC_WHATSAPP_ENGINE_URL;
  
  if (!engineUrl) {
    if (isDevelopment && isFrontendHttps) {
      engineUrl = process.env.NEXT_PUBLIC_DEV_HTTPS_ENGINE_URL || "https://localhost:3002";
    } else {
      engineUrl = "http://localhost:3002";
    }
  }
  
  return engineUrl;
})();
