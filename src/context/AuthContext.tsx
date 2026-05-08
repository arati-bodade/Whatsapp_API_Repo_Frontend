"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import authService from "@/services/authService";

interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "reseller" | "user" | "business" | "business_owner";
  profile_image?: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: string | null;
  isLoading: boolean;
  login: (token: string, role: string, refreshToken?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("reseller_id");
    localStorage.removeItem("resellerToken");
    localStorage.removeItem("admin_logged_in");
    setToken(null);
    setRole(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const userData = await authService.getMe();
      setUser(userData);
      setToken(storedToken);
      setRole(userData.role);
      
      // Store user ID in localStorage for compatibility
      if (userData.role === "reseller") {
        localStorage.setItem("reseller_id", userData.id);
      } else {
        localStorage.setItem("user_id", userData.id);
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  const login = (newToken: string, newRole: string, refreshToken?: string) => {
    // 1. Explicitly clear ANY existing tokens for other roles to prevent cross-contamination
    // This is crucial for fixing the 403 Forbidden errors when switching dashboards
    localStorage.removeItem("token");
    localStorage.removeItem("resellerToken");
    localStorage.removeItem("admin_logged_in");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user_id");
    localStorage.removeItem("reseller_id");
    
    // 2. Set new data
    localStorage.setItem("token", newToken);
    localStorage.setItem("user_role", newRole);
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    
    // Compatibility with existing code
    if (newRole === "admin") {
      localStorage.setItem("admin_logged_in", "true");
    } else if (newRole === "reseller") {
      localStorage.setItem("resellerToken", newToken);
    }

    setToken(newToken);
    setRole(newRole);
    refreshUser();
  };

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, token, role, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
