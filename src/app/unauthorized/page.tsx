"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UnauthorizedPage() {
  const { role } = useAuth();

  const getDashboardPath = () => {
    if (role === "admin") return "/dashboard/admin";
    if (role === "reseller") return "/dashboard/reseller";
    return "/dashboard/user";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl shadow-slate-200 p-8 md:p-12 text-center border border-slate-100">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Access Denied</h1>
        <p className="text-slate-500 mb-10 leading-relaxed font-medium">
          You don't have permission to access this section. Please return to your designated dashboard.
        </p>

        <div className="space-y-4">
          <Link 
            href={getDashboardPath()}
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-200 active:scale-[0.98] gap-3"
          >
            <Home className="w-5 h-5" />
            Go to My Dashboard
          </Link>
          
          <Link 
            href="/login"
            className="w-full inline-flex items-center justify-center px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all gap-3"
          >
            <ArrowLeft className="w-5 h-5" />
            Switch Account
          </Link>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-50">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
            Security Protocol 403
          </p>
        </div>
      </div>
    </div>
  );
}
