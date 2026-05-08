"use client";

import React from 'react';
import { X, AlertTriangle, Check, Zap, Rocket, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlanRestrictionModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    message?: string;
}

export const PlanRestrictionModal: React.FC<PlanRestrictionModalProps> = ({ 
    isOpen, 
    onClose,
    title = "Failed to send message",
    message = "Failed to send message. Please purchase a plan."
}) => {
    const router = useRouter();

    if (!isOpen) return null;

    const handleGoToPlans = () => {
        router.push('/dashboard/user/plans');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[32px] w-full max-w-md overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-300">
                
                {/* Header with Close Icon */}
                <div className="p-6 pb-0 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
                    >
                        <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 pb-10 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-amber-50 flex items-center justify-center mb-6 shadow-inner ring-1 ring-amber-100">
                        <AlertTriangle className="w-10 h-10 text-amber-500" />
                    </div>
                    
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h2>
                    <p className="text-gray-500 mt-3 text-lg leading-relaxed">
                        {message}
                    </p>

                    <button 
                        onClick={handleGoToPlans}
                        className="w-full mt-10 py-4 bg-gray-900 hover:bg-black text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                    >
                        Go to Plans
                    </button>
                </div>

                {/* Footer Tip */}
                <div className="px-8 py-4 bg-gray-50/50 border-t border-gray-100 text-center">
                    <p className="text-xs text-gray-400">
                        You'll be redirected to the plans page to choose a subscription.
                    </p>
                </div>
            </div>
        </div>
    );
};

