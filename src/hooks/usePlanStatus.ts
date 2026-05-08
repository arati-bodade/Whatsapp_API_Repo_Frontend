import { useState, useEffect, useCallback } from 'react';
import creditService from '@/services/creditService';
import userService from '@/services/userService';
import resellerService from '@/services/resellerService';

export interface PlanStatus {
    isExpired: boolean;
    hasNoCredits: boolean;
    isValid: boolean;
    expiryDate: Date | null;
    creditsRemaining: number;
    planName: string | null;
    loading: boolean;
    error: string | null;
}

export const usePlanStatus = () => {
    const [status, setStatus] = useState<PlanStatus>({
        isExpired: false,
        hasNoCredits: false,
        isValid: false,
        expiryDate: null,
        creditsRemaining: 0,
        planName: null,
        loading: true,
        error: null,
    });

    const checkStatus = useCallback(async () => {
        try {
            const token = localStorage.getItem('token') || 
                          localStorage.getItem('accessToken') || 
                          localStorage.getItem('resellerToken') || 
                          localStorage.getItem('businessToken') || 
                          localStorage.getItem('adminToken');
            const userId = localStorage.getItem('user_id');
            const role = localStorage.getItem('user_role');

            if (!token || !userId) {
                setStatus(prev => ({ ...prev, loading: false }));
                return;
            }

            // Fetch user profile to get plan_expiry and credits
            // For business users, we can get this from the balance endpoint or profile
            let balanceData;
            let profileData;

            try {
                balanceData = await creditService.getUserCurrentBalance(token);
            } catch (e) {
                console.error("Failed to fetch balance", e);
            }

            try {
                if (role === 'business_owner' || role === 'user') {
                    profileData = await userService.getMe(token);
                } else if (role === 'reseller') {
                    profileData = await resellerService.getProfile(token);
                }
            } catch (e) {
                console.error("Failed to fetch profile", e);
            }

            const credits = balanceData?.current_balance ?? profileData?.wallet?.credits_remaining ?? 0;
            const expiryStr = profileData?.plan_expiry;
            const expiryDate = expiryStr ? new Date(expiryStr) : null;
            const planName = profileData?.plan_name || null;

            // 🔥 FIX: If there's no expiry date but user has credits, consider plan valid
            // This handles cases where plan_expiry wasn't set properly during purchase
            const isExpired = expiryDate ? expiryDate < new Date() : false;
            const hasNoCredits = credits <= 0;

            // isValid means they can use the system
            // Resellers are restricted primarily by credits for allocation
            // Business users are restricted by both
            let isValid = true;
            if (role === 'business_owner' || role === 'user') {
                // If user has credits and plan_name, consider valid even if expiry is missing
                const hasPlan = planName !== null && planName !== '';
                isValid = (!isExpired || !expiryDate) && !hasNoCredits && hasPlan;
            } else if (role === 'reseller') {
                // Resellers can login and move around, but check_reseller_plan on backend protects allocation
                isValid = credits > 0;
            }

            setStatus({
                isExpired,
                hasNoCredits,
                isValid,
                expiryDate,
                creditsRemaining: credits,
                planName,
                loading: false,
                error: null,
            });
        } catch (err: any) {
            console.error("Error fetching plan status:", err);
            setStatus(prev => ({ 
                ...prev, 
                loading: false, 
                error: err.message || 'Failed to check plan status' 
            }));
        }
    }, []);

    useEffect(() => {
        checkStatus();

        // Listen for plan updates
        const handlePlanUpdate = () => {
            console.log(' Plan status update detected, refreshing...')
            checkStatus();
        };

        // Listen for custom plan update events
        window.addEventListener('plan-updated', handlePlanUpdate);
        
        // Also listen for storage changes (cross-tab sync)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'plan_updated' && e.newValue) {
                handlePlanUpdate();
            }
        };
        window.addEventListener('storage', handleStorageChange);

        return () => {
            window.removeEventListener('plan-updated', handlePlanUpdate);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [checkStatus]);

    return { ...status, refreshPlanStatus: checkStatus };
};
