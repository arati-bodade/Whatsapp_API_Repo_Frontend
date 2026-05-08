"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // DashboardLayout handles unauthenticated redirects
        // This is a safety fallback
        if (pathname?.startsWith("/dashboard/admin") || pathname?.includes("admin")) {
          router.push("/admin-login");
        } else {
          router.push("/login");
        }
      } else if (allowedRoles && !allowedRoles.includes(role || "")) {
        // If logged in but role mismatch, let DashboardLayout handle the correction 
        // OR redirect to unauthorized if it's a specific sub-resource
        setIsAuthorized(false);
        router.push("/unauthorized");
      } else {
        // Authorized
        setIsAuthorized(true);
      }
    }
  }, [user, role, isLoading, allowedRoles, router, pathname]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Verifying authorization...</p>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
