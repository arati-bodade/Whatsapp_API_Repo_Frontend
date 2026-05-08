import { useState, useEffect, useCallback } from 'react';
import { getPlans } from '@/config/api';
import { onPlanUpdate } from '@/lib/planEvents';
import { LucideIcon, Zap, Crown, User } from 'lucide-react';

export interface Plan {
    id: string;
    plan_id: string;
    name: string;
    price: string;
    type: string;
    credits: string;
    rate: string;
    wallet: string;
    validity: string;
    support: string;
    popular: boolean;
    category: "reseller" | "user";
    icon?: LucideIcon;
    colorTheme: 'purple' | 'green';
}

export const usePlans = (category?: 'RESELLER' | 'BUSINESS' | 'ALL') => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPlans = useCallback(async () => {
        setIsLoading(true);
        try {
            let combinedData: any[] = [];
            
            if (category === 'ALL') {
                // Fetch both Reseller and Business plans for the combined view
                // We use Promise.all to fetch both in parallel
                // Note: We need a way to bypass the automatic routing in getPlans if we want both
                // For now, we'll call getPlans twice if needed, but we need to ensure getPlans supports this.
                // Actually, let's update api.ts to provide specific methods for clarity.
                
                // Temporary workaround within hook: fetch assuming getPlans can handle it or calling specifically
                try {
                    const resellerPlans = await getPlans('RESELLER');
                    combinedData = [...resellerPlans];
                } catch (e) { console.error("Error fetching reseller plans", e); }
                
                try {
                    const userPlans = await getPlans('BUSINESS');
                    // Filter out duplicates if any
                    const existingIds = new Set(combinedData.map(p => p.plan_id));
                    userPlans.forEach((p: any) => {
                        if (!existingIds.has(p.plan_id)) {
                            combinedData.push(p);
                        }
                    });
                } catch (e) { console.error("Error fetching user plans", e); }
            } else {
                combinedData = await getPlans(category);
            }
            
            const mappedPlans: Plan[] = combinedData.map((p: any) => {
                const categoryRaw = (p.plan_category || "").trim().toUpperCase();
                const isReseller = categoryRaw === 'RESELLER';
                
                const price = parseFloat(p.price) || 0;
                const credits = parseInt(p.credits_offered) || 0;
                const deductionRate = parseFloat(p.deduction_value) || 1.0;
                const netMessages = Math.floor(credits / deductionRate);
                const effectivePrice = netMessages > 0 ? (price / netMessages).toFixed(2) : "0.00";

                return {
                    id: p.plan_id,
                    plan_id: p.plan_id,
                    name: p.name,
                    price: price.toLocaleString(),
                    type: "One-time payment",
                    credits: `${netMessages.toLocaleString()} Messages`,
                    rate: `₹${effectivePrice} per message`,
                    wallet: `₹${(credits * 0).toFixed(2)}`, // Assuming wallet credit logic is separate
                    validity: `${p.validity_days} days`,
                    support: "24/7 Support",
                    popular: price > 5000,
                    category: isReseller ? "reseller" : "user",
                    colorTheme: isReseller ? 'purple' : 'green',
                    icon: isReseller ? Crown : User
                };
            });

            setPlans(mappedPlans);
            setError(null);
        } catch (err: any) {
            console.error("Failed to fetch plans:", err);
            setError(err.message || "Failed to load plans");
        } finally {
            setIsLoading(false);
        }
    }, [category]);

    useEffect(() => {
        fetchPlans();

        const cleanup = onPlanUpdate(() => {
            fetchPlans();
        });

        return cleanup;
    }, [fetchPlans]);

    return { plans, isLoading, error, refresh: fetchPlans };
};
