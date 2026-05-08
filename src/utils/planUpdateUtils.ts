/**
 * Plan Update Utilities
 * 
 * Utilities to trigger plan updates across the application
 * after a user purchases or changes their plan.
 */

export const triggerPlanUpdate = () => {
    // Set a flag in localStorage for cross-tab synchronization
    localStorage.setItem('plan_updated', Date.now().toString());
    
    // Remove the flag after a short delay (to prevent infinite loops)
    setTimeout(() => {
        localStorage.removeItem('plan_updated');
    }, 1000);

    // Emit custom event for current tab
    window.dispatchEvent(new CustomEvent('plan-updated'));
    
    // Use the existing plan events system
    const { emitPlanUpdate } = require('@/lib/planEvents');
    emitPlanUpdate();
    
    console.log('🚀 Plan update triggered across all tabs');
};

export const clearPlanUpdateCache = () => {
    // Clear any cached plan data
    localStorage.removeItem('plan_updated');
    console.log('🧹 Plan update cache cleared');
};
