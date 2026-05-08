import { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/constants';

let globalReady = false;
let listeners: ((ready: boolean) => void)[] = [];

export const useChatbotReady = () => {
  const [isReady, setIsReady] = useState(globalReady);

  useEffect(() => {
    const updateReady = (val: boolean) => {
      globalReady = val;
      setIsReady(val);
    };

    listeners.push(updateReady);

    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/health/ready`);
        const data = await res.json();
        const ready = !!data.ready && !!data.ai_available;
        console.log(`🤖 Chatbot Ready: ${data.ready} | AI Available: ${data.ai_available}`);
        
        if (ready) {
          listeners.forEach(l => l(ready));
        } else {
          // If not ready, poll faster in the beginning
          setTimeout(checkHealth, 5000);
        }
      } catch (err) {
        console.warn("Readiness check failed, retrying...", err);
        setTimeout(checkHealth, 10000);
      }
    };

    if (!globalReady) {
      checkHealth();
    }

    return () => {
      listeners = listeners.filter(l => l !== updateReady);
    };
  }, []);

  return isReady;
};
