"use client";

import { useState, useEffect, useRef } from "react";
import { 
    Activity, 
    Send, 
    CheckCircle, 
    XCircle, 
    Clock, 
    Zap, 
    TrendingUp, 
    TrendingDown,
    Smartphone,
    Users,
    MessageSquare,
    AlertCircle,
    BarChart3,
    RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { API_BASE_URL } from "@/config/api";

interface PerformanceStats {
    total_messages: number;
    successful_messages: number;
    failed_messages: number;
    average_send_time: number;
    messages_per_second: number;
    success_rate: number;
    error_rate: number;
    queue_depth: number;
    active_devices: number;
}

interface DevicePerformance {
    device_id: string;
    health: {
        status: string;
        last_seen: string;
        messages_sent: number;
        avg_response_time: number;
        error_count: number;
    };
    performance: {
        total_messages: number;
        recent_messages: number;
        success_rate: number;
        avg_response_time: number;
        messages_per_minute: number;
    };
    counters: {
        total: number;
        success: number;
        failed: number;
    };
}

interface PerformanceData {
    type: string;
    timestamp: number;
    stats: PerformanceStats;
    device_performance?: DevicePerformance;
    user_performance?: any;
}

export default function PerformanceDashboard() {
    const { token } = useAuth();
    const [isConnected, setIsConnected] = useState(false);
    const [performanceData, setPerformanceData] = useState<PerformanceStats | null>(null);
    const [devicePerformance, setDevicePerformance] = useState<DevicePerformance | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<string>("disconnected");
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);
    
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    // WebSocket connection
    const connectWebSocket = () => {
        if (!token) return;

        try {
            const wsUrl = `${API_BASE_URL.replace('http', 'ws')}/performance/realtime?token=${token}`;
            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log("Performance WebSocket connected");
                setIsConnected(true);
                setConnectionStatus("connected");
                setError(null);
                reconnectAttempts.current = 0;
                
                // Clear any existing reconnect timeout
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                }
            };

            wsRef.current.onmessage = (event) => {
                try {
                    const data: PerformanceData = JSON.parse(event.data);
                    
                    if (data.type === "performance_update") {
                        setPerformanceData(data.stats);
                        setDevicePerformance(data.device_performance || null);
                        setLastUpdate(new Date());
                    }
                } catch (err) {
                    console.error("Error parsing WebSocket message:", err);
                }
            };

            wsRef.current.onclose = () => {
                console.log("Performance WebSocket disconnected");
                setIsConnected(false);
                setConnectionStatus("disconnected");
                
                // Attempt to reconnect
                attemptReconnect();
            };

            wsRef.current.onerror = (error) => {
                console.error("Performance WebSocket error:", error);
                setError("WebSocket connection error");
                setConnectionStatus("error");
            };

        } catch (err) {
            console.error("Error creating WebSocket connection:", err);
            setError("Failed to connect to performance monitoring");
            setConnectionStatus("error");
        }
    };

    const attemptReconnect = () => {
        if (reconnectAttempts.current >= maxReconnectAttempts) {
            setError("Max reconnection attempts reached. Please refresh the page.");
            return;
        }

        reconnectAttempts.current++;
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000); // Exponential backoff, max 30s
        
        setConnectionStatus(`reconnecting (${reconnectAttempts.current}/${maxReconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket();
        }, delay);
    };

    const disconnectWebSocket = () => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        
        setIsConnected(false);
        setConnectionStatus("disconnected");
    };

    const manualReconnect = () => {
        disconnectWebSocket();
        reconnectAttempts.current = 0;
        connectWebSocket();
    };

    useEffect(() => {
        if (token) {
            connectWebSocket();
        }

        return () => {
            disconnectWebSocket();
        };
    }, [token]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "connected": return "text-green-600";
            case "disconnected": return "text-gray-600";
            case "reconnecting": return "text-yellow-600";
            case "error": return "text-red-600";
            default: return "text-gray-600";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "connected": return <CheckCircle className="w-4 h-4" />;
            case "disconnected": return <XCircle className="w-4 h-4" />;
            case "reconnecting": return <RefreshCw className="w-4 h-4 animate-spin" />;
            case "error": return <AlertCircle className="w-4 h-4" />;
            default: return <XCircle className="w-4 h-4" />;
        }
    };

    const formatTime = (seconds: number) => {
        if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
        return `${seconds.toFixed(2)}s`;
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Real-time Performance</h1>
                    <p className="text-gray-600">Monitor message sending performance in real-time</p>
                </div>
                
                {/* Connection Status */}
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                        isConnected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                    }`}>
                        {getStatusIcon(connectionStatus)}
                        <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                            {connectionStatus}
                        </span>
                    </div>
                    
                    {!isConnected && (
                        <button
                            onClick={manualReconnect}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reconnect
                        </button>
                    )}
                    
                    {lastUpdate && (
                        <div className="text-sm text-gray-500">
                            Last updated: {lastUpdate.toLocaleTimeString()}
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{error}</span>
                </div>
            )}

            {/* Performance Stats Grid */}
            {performanceData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Total Messages */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <MessageSquare className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="w-4 h-4" />
                                Real-time
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(performanceData.total_messages)}
                            </p>
                            <p className="text-sm text-gray-600">Total Messages</p>
                        </div>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${
                                performanceData.success_rate >= 95 ? 'text-green-600' : 
                                performanceData.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                {performanceData.success_rate >= 95 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {performanceData.success_rate.toFixed(1)}%
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900">
                                {formatNumber(performanceData.successful_messages)}
                            </p>
                            <p className="text-sm text-gray-600">Successful</p>
                        </div>
                    </div>

                    {/* Messages per Second */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Zap className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Activity className="w-4 h-4" />
                                Rate
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900">
                                {performanceData.messages_per_second.toFixed(1)}
                            </p>
                            <p className="text-sm text-gray-600">Messages/Second</p>
                        </div>
                    </div>

                    {/* Average Response Time */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Clock className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className={`flex items-center gap-1 text-sm font-medium ${
                                performanceData.average_send_time <= 1 ? 'text-green-600' : 
                                performanceData.average_send_time <= 3 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                                <Send className="w-4 h-4" />
                                {formatTime(performanceData.average_send_time)}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <p className="text-2xl font-bold text-gray-900">
                                {formatTime(performanceData.average_send_time)}
                            </p>
                            <p className="text-sm text-gray-600">Avg Send Time</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Device Performance */}
            {devicePerformance && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Smartphone className="w-5 h-5" />
                        Device Performance: {devicePerformance.device_id}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Device Health */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Health</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className={`text-sm font-medium ${
                                        devicePerformance.health.status === 'active' ? 'text-green-600' : 'text-gray-600'
                                    }`}>
                                        {devicePerformance.health.status}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Messages Sent</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatNumber(devicePerformance.health.messages_sent)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Avg Response</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatTime(devicePerformance.health.avg_response_time)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Error Count</span>
                                    <span className={`text-sm font-medium ${
                                        devicePerformance.health.error_count > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {devicePerformance.health.error_count}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Performance Metrics */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Performance</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Success Rate</span>
                                    <span className={`text-sm font-medium ${
                                        devicePerformance.performance.success_rate >= 95 ? 'text-green-600' : 
                                        devicePerformance.performance.success_rate >= 80 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                        {devicePerformance.performance.success_rate.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Recent Messages</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatNumber(devicePerformance.performance.recent_messages)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Messages/Min</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {devicePerformance.performance.messages_per_minute.toFixed(1)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Counters */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-gray-700 uppercase tracking-wider">Statistics</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Total</span>
                                    <span className="text-sm font-medium text-gray-900">
                                        {formatNumber(devicePerformance.counters.total)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Success</span>
                                    <span className="text-sm font-medium text-green-600">
                                        {formatNumber(devicePerformance.counters.success)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-600">Failed</span>
                                    <span className={`text-sm font-medium ${
                                        devicePerformance.counters.failed > 0 ? 'text-red-600' : 'text-green-600'
                                    }`}>
                                        {formatNumber(devicePerformance.counters.failed)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Additional Metrics */}
            {performanceData && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Queue Depth */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <BarChart3 className="w-6 h-6 text-yellow-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Queue Status</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Queue Depth</span>
                                <span className={`text-lg font-bold ${
                                    performanceData.queue_depth === 0 ? 'text-green-600' : 
                                    performanceData.queue_depth <= 10 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                    {performanceData.queue_depth}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Active Devices</span>
                                <span className="text-lg font-bold text-blue-600">
                                    {performanceData.active_devices}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Error Analysis */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <XCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Error Analysis</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Failed Messages</span>
                                <span className="text-lg font-bold text-red-600">
                                    {formatNumber(performanceData.failed_messages)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Error Rate</span>
                                <span className={`text-lg font-bold ${
                                    performanceData.error_rate <= 1 ? 'text-green-600' : 
                                    performanceData.error_rate <= 5 ? 'text-yellow-600' : 'text-red-600'
                                }`}>
                                    {performanceData.error_rate.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Activity className="w-6 h-6 text-green-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Connection</span>
                                <span className={`text-sm font-medium ${getStatusColor(connectionStatus)}`}>
                                    {connectionStatus}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Updates</span>
                                <span className="text-sm font-medium text-gray-900">
                                    Every 2 seconds
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
