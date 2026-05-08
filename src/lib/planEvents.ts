/**
 * Plan Events System
 * 
 * Uses BroadcastChannel to synchronize plan updates across different browser tabs.
 * This ensures that if an Admin creates a plan in one tab, the Reseller or User
 * dashboard in another tab can react and refresh their data automatically.
 */

const PLAN_CHANNEL_NAME = 'whatsapp_platform_plan_updates';

export const emitPlanUpdate = () => {
    if (typeof window !== 'undefined') {
        const channel = new BroadcastChannel(PLAN_CHANNEL_NAME);
        channel.postMessage({ type: 'PLANS_UPDATED', timestamp: Date.now() });
        channel.close();
        
        // Also trigger a local event for the current window if needed
        window.dispatchEvent(new CustomEvent('plans-updated'));
    }
};

export const onPlanUpdate = (callback: () => void) => {
    if (typeof window === 'undefined') return () => {};

    const channel = new BroadcastChannel(PLAN_CHANNEL_NAME);
    
    const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PLANS_UPDATED') {
            callback();
        }
    };

    const handleLocalEvent = () => {
        callback();
    };

    channel.addEventListener('message', handleMessage);
    window.addEventListener('plans-updated', handleLocalEvent);

    // Return cleanup function
    return () => {
        channel.removeEventListener('message', handleMessage);
        window.removeEventListener('plans-updated', handleLocalEvent);
        channel.close();
    };
};
