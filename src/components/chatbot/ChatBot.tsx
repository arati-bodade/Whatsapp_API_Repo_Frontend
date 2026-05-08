"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, Send, X, Bot, User, Loader2, ChevronDown, 
  Maximize2, Minimize2, Mic, MicOff, Volume2, BarChart2, MessageCircle
} from 'lucide-react';
import axios from '@/config/axios';
import { API_BASE_URL } from '@/config/constants';
import { cn } from '@/lib/utils';
import { useChatbotReady } from '@/hooks/useChatbotReady';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'sending' | 'sent' | 'failed';
  retryCount?: number;
  isStreaming?: boolean;
  isConnecting?: boolean;
}

interface AnalyticsData {
  total_messages: number;
  unique_users: number;
  avg_response_time: number;
  top_queries: { query: string; count: number }[];
  uptime_seconds: number;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'analytics'>('chat');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isReady = useChatbotReady();
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isTabActive, setIsTabActive] = useState(true);
  const [isQueueLocked, setIsQueueLocked] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const scrollRef = useRef<HTMLDivElement>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Sync state between tabs
  useEffect(() => {
    const channel = new BroadcastChannel('chatbot_sync');
    
    const handleSync = (event: MessageEvent) => {
      if (event.data.type === 'QUEUE_UPDATE') {
        setMessageQueue(event.data.queue);
      } else if (event.data.type === 'LOCK_ACQUIRED') {
        setIsQueueLocked(true);
      } else if (event.data.type === 'LOCK_RELEASED') {
        setIsQueueLocked(false);
      }
    };

    channel.onmessage = handleSync;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleVisibility = () => setIsTabActive(document.visibilityState === 'visible');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibility);
    
    setIsOnline(navigator.onLine);

    return () => {
      channel.close();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Persistent Queue Initialization
  useEffect(() => {
    const savedQueue = localStorage.getItem('chatbot_pending_queue');
    if (savedQueue) {
      try {
        const parsed = JSON.parse(savedQueue);
        const hourAgo = new Date(Date.now() - 3600000);
        const valid = parsed.filter((m: any) => new Date(m.timestamp) > hourAgo);
        setMessageQueue(valid);
        if (valid.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const toAdd = valid.filter((v: Message) => !existingIds.has(v.id));
            return [...prev, ...toAdd];
          });
        }
      } catch (e) { console.error("Failed to load queue", e); }
    }
  }, []);

  // Save queue & notify other tabs
  useEffect(() => {
    localStorage.setItem('chatbot_pending_queue', JSON.stringify(messageQueue));
    const channel = new BroadcastChannel('chatbot_sync');
    channel.postMessage({ type: 'QUEUE_UPDATE', queue: messageQueue });
    channel.close();
  }, [messageQueue]);

  const [debug] = useState(false); // Temporary Debug Mode

  // Enterprise Queue Locking & Flushing
  useEffect(() => {
    if (isOnline && isTabActive && !isQueueLocked && messageQueue.length > 0 && !isLoading) {
      const nextMsg = messageQueue[0];
      const timeInQueue = Date.now() - new Date(nextMsg.timestamp).getTime();
      const shouldForce = timeInQueue > 5000; // 5s force send fallback

      if (isReady || shouldForce || debug) {
        const acquireLockAndFlush = async () => {
          const channel = new BroadcastChannel('chatbot_sync');
          channel.postMessage({ type: 'LOCK_ACQUIRED' });
          setIsQueueLocked(true);

          if (shouldForce) console.log("⚠️ Force sending message after 5s queue timeout");
          
          setMessageQueue(prev => prev.slice(1));
          await handleSend(nextMsg.content, nextMsg.id);

          setIsQueueLocked(false);
          channel.postMessage({ type: 'LOCK_RELEASED' });
          channel.close();
        };
        acquireLockAndFlush();
      }
    }
  }, [isReady, isOnline, isTabActive, isQueueLocked, messageQueue, isLoading, debug]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);
      setRecognition(rec);
    } else {
      setSpeechSupported(false);
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get('/chatbot/analytics');
      setAnalyticsData(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'analytics') {
      fetchAnalytics();
    }
  }, [isOpen, activeTab]);

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
      setIsListening(true);
    }
  };

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSend = async (e?: React.FormEvent | string, existingId?: string) => {
    const textToSend = typeof e === 'string' ? e : input;
    if (e && typeof e !== 'string') e.preventDefault();
    
    if (!textToSend.trim() || isLoading) return;
    const msgId = existingId || Date.now().toString();

    // Queue if not ready AND not debug AND not force
    if (!isReady && !debug && !existingId) {
      const pendingMsg: Message = {
        id: msgId,
        role: 'user',
        content: textToSend.trim(),
        timestamp: new Date(),
        status: 'pending'
      };
      setMessages(prev => [...prev, pendingMsg]);
      setMessageQueue(prev => [...prev, pendingMsg]);
      setInput('');
      return;
    }

    setInput('');
    setIsLoading(true);

    const performFetch = async (useStream: boolean = true, retryCount: number = 0): Promise<void> => {
      const apiUrl = `${API_BASE_URL}/chatbot/ask`;
      console.log(`🚀 [ChatBot] Sending to: ${apiUrl} (Stream: ${useStream})`);
      
      try {
        setMessages(prev => {
          const exists = prev.find(m => m.id === msgId);
          if (exists) return prev.map(m => m.id === msgId ? { ...m, status: 'sending' } : m);
          return [...prev, { id: msgId, role: 'user', content: textToSend, timestamp: new Date(), status: 'sending' }];
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s Timeout

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({ message: textToSend, session_id: sessionId, stream: useStream })
        });

        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        console.log("✅ [ChatBot] Response received");
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'sent' } : m));

        const contentType = response.headers.get('content-type');
        // If streaming failed, not requested, or server returned JSON, handle as JSON
        if (!useStream || !response.body || contentType?.includes('application/json')) {
          const data = await response.json();
          if (data.error) {
            setMessages(prev => [...prev, { 
              id: (Date.now() + 1).toString(), 
              role: 'assistant', 
              content: `❌ ${data.error}`, 
              timestamp: new Date() 
            }]);
            setIsLoading(false);
            return;
          }
          setMessages(prev => [...prev, { 
            id: (Date.now() + 1).toString(), 
            role: 'assistant', 
            content: data.response || data.text || "No response", 
            timestamp: new Date() 
          }]);
          setIsLoading(false);
          return;
        }

        // Streaming Logic
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let botContent = '';
        const botMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: botMsgId, role: 'assistant', content: '', timestamp: new Date(), isStreaming: true }]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, isStreaming: false } : m));
                setIsLoading(false);
                return;
              }
              if (data.startsWith('ERROR: ')) {
                 setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: `❌ ${data.replace('ERROR: ', '')}`, isStreaming: false } : m));
                 setIsLoading(false);
                 return;
              }
              try {
                // If it's a JSON chunk (error or system msg)
                if (data.startsWith('{')) {
                  const parsed = JSON.parse(data);
                  if (parsed.error) {
                    botContent = `❌ ${parsed.error}`;
                    setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: botContent, isStreaming: false } : m));
                    setIsLoading(false);
                    return;
                  }
                  botContent += (parsed.response || parsed.text || "");
                } else {
                  botContent += data;
                }
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: botContent } : m));
              } catch (e) {
                botContent += data;
                setMessages(prev => prev.map(m => m.id === botMsgId ? { ...m, content: botContent } : m));
              }
            }
          }
        }
      } catch (error: any) {
        console.error('❌ [ChatBot] API Failure:', error);
        if (useStream && !error.message?.includes("Abort")) {
          console.log("🔄 Retrying with JSON API...");
          return performFetch(false, retryCount);
        }
        
        setMessages(prev => [...prev, { 
          id: (Date.now() + 1).toString(), 
          role: 'assistant', 
          content: "❌ AI service unavailable. Please try again later.", 
          timestamp: new Date() 
        }]);
        
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'failed' } : m));
        setIsLoading(false);
      }
    };

    performFetch(false, 0);
  };

  const quickAsk = (text: string) => {
    handleSend(text);
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 flex flex-col items-end",
      isExpanded && isOpen ? "inset-0 items-center justify-center bg-black/20 backdrop-blur-sm" : ""
    )}>
      {/* Chat Window */}
      {isOpen && (
        <div 
          className={cn(
            "mb-4 bg-white shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300",
            isExpanded ? "rounded-3xl relative" : "rounded-3xl",
            "max-md:!w-full max-md:!h-full max-md:!fixed max-md:inset-0 max-md:!rounded-none max-md:mb-0"
          )}
          style={{
            width: isExpanded ? "90vw" : "380px",
            height: isExpanded ? "90vh" : "550px",
            resize: isExpanded ? "none" : "both",
            overflow: "hidden",
            minWidth: isExpanded ? "none" : "300px",
            minHeight: isExpanded ? "none" : "400px",
            transition: "all 0.3s ease",
            zIndex: 100
          }}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 p-4 flex items-center justify-between text-white shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Bot className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm tracking-tight">AI Assistant</h3>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                </div>
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={() => setActiveTab('chat')}
                    className={cn("text-[10px] px-2 py-0.5 rounded-full transition-all", activeTab === 'chat' ? "bg-white text-blue-600 font-bold" : "bg-white/10 hover:bg-white/20")}
                  >
                    Chat
                  </button>
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className={cn("text-[10px] px-2 py-0.5 rounded-full transition-all", activeTab === 'analytics' ? "bg-white text-blue-600 font-bold" : "bg-white/10 hover:bg-white/20")}
                  >
                    Analytics
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={toggleExpand}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors hidden md:block"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {activeTab === 'chat' ? (
            <>
              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 scroll-smooth"
              >
                {messages.length === 0 && (
                  <div className="text-center py-10 space-y-4">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-600">
                      <Bot className="w-8 h-8" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-lg">How can I help you today?</p>
                      <p className="text-sm text-slate-500 mt-1 max-w-[250px] mx-auto">Ask about our WhatsApp features, API docs, or credit system.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      {["WhatsApp Features", "API Docs", "Pricing Plans"].map(tag => (
                        <button key={tag} onClick={() => quickAsk(`Tell me about ${tag}`)} className="text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-all shadow-sm">
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex items-start gap-2 max-w-[85%] group",
                      msg.role === 'user' ? "ml-auto flex-row-reverse" : "animate-in slide-in-from-left-2 duration-300"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm border",
                      msg.role === 'user' ? "bg-white border-slate-200 text-slate-600" : "bg-blue-600 border-blue-500 text-white"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className={cn(
                        "p-3 rounded-2xl text-sm shadow-sm leading-relaxed relative",
                        msg.role === 'user' 
                          ? "bg-white border border-slate-100 text-slate-800 rounded-tr-none" 
                          : "bg-blue-600 text-white rounded-tl-none",
                        isExpanded ? "text-base p-4" : "text-sm"
                      )}>
                        {msg.content}
                        {msg.role === 'user' && msg.status && (
                          <div className={cn(
                            "text-[10px] mt-1 flex items-center gap-1 justify-end",
                            msg.role === 'user' ? "text-slate-400" : "text-blue-100"
                          )}>
                            {msg.status === 'pending' && <span>⏳ Queued</span>}
                            {msg.status === 'sending' && <span>🔄 Sending...</span>}
                            {msg.status === 'sent' && <span>✅ Sent</span>}
                            {msg.status === 'failed' && (
                              <button 
                                onClick={() => handleSend(msg.content, msg.id)}
                                className="underline hover:text-red-500 text-red-400 flex items-center gap-1"
                              >
                                ❌ Failed (Retry)
                              </button>
                            )}
                          </div>
                        )}
                        {msg.role === 'assistant' && !msg.isStreaming && (
                          <button 
                            onClick={() => speak(msg.content)}
                            className="absolute -right-8 bottom-0 p-1.5 text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                            title="Speak response"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && messages[messages.length-1]?.role !== 'assistant' && (
                  <div className="flex items-start gap-2 max-w-[85%] animate-in fade-in duration-300">
                    <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-blue-600/10 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form 
                onSubmit={handleSend}
                className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 shadow-[0_-4px_12px_rgba(0,0,0,0.02)] shrink-0"
              >
                <button 
                  type="button"
                  onClick={toggleListening}
                  disabled={!speechSupported}
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                    !speechSupported ? "bg-slate-50 text-slate-200 cursor-not-allowed" :
                    isListening ? "bg-red-50 text-red-600 animate-pulse" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  )}
                  title={speechSupported ? (isListening ? "Stop listening" : "Start voice chat") : "Speech recognition not supported in this browser"}
                >
                  {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={!isReady ? "Connecting..." : "Ask me anything..."}
                  disabled={isLoading}
                  className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/20 transition-all outline-none placeholder:text-slate-400"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading || !isReady}
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
                    (!input.trim() || isLoading || !isReady) 
                      ? "bg-slate-50 text-slate-300" 
                      : "bg-blue-600 text-white shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95"
                  )}
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </>
          ) : (
            /* Analytics View */
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Chats</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{analyticsData?.total_messages || 0}</p>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Unique Users</p>
                  <p className="text-2xl font-black text-slate-800 mt-1">{analyticsData?.unique_users || 0}</p>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-800">Top Queries</h4>
                </div>
                <div className="space-y-3">
                  {analyticsData?.top_queries?.map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between group">
                      <span className="text-xs text-slate-600 truncate max-w-[200px]">{q.query}</span>
                      <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{q.count}</span>
                    </div>
                  ))}
                  {(!analyticsData?.top_queries || analyticsData.top_queries.length === 0) && (
                    <p className="text-xs text-slate-400 text-center py-4 italic">No data yet</p>
                  )}
                </div>
              </div>

              <div className="bg-linear-to-br from-slate-800 to-slate-900 p-5 rounded-2xl text-white shadow-xl">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Avg. Response Time</p>
                <div className="flex items-end gap-2 mt-2">
                  <p className="text-3xl font-black">{analyticsData?.avg_response_time || 0}</p>
                  <p className="text-sm font-bold text-white/60 mb-1">seconds</p>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[10px] text-white/40">System Uptime: {Math.floor((analyticsData?.uptime_seconds || 0) / 3600)}h {Math.floor(((analyticsData?.uptime_seconds || 0) % 3600) / 60)}m</p>
                </div>
              </div>
              
              <button 
                onClick={fetchAnalytics}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                Refresh Data
              </button>
            </div>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 group",
          isOpen && !isExpanded
            ? "bg-white text-slate-800 rotate-90" 
            : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-600/30",
          isExpanded && isOpen ? "hidden" : "flex"
        )}
      >
        {isOpen ? <X className="w-7 h-7" /> : (
          <div className="relative">
            <MessageCircle className="w-7 h-7" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-blue-600 rounded-full animate-ping" />
          </div>
        )}
      </button>
    </div>
  );
}
