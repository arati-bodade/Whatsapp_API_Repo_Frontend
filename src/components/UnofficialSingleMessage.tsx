"use client"

import { useState, useEffect } from "react"
import { Send, Smartphone, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { userDashboardService } from "@/services/userDashboardService"
import Link from "next/link"

interface UnofficialSingleMessageProps {
    className?: string
}

export default function UnofficialSingleMessage({ className = "" }: UnofficialSingleMessageProps) {
    const [token, setToken] = useState<string | null>(null)
    const [deviceStatus, setDeviceStatus] = useState<"loading" | "connected" | "disconnected">("loading")
    const [deviceName, setDeviceName] = useState<string | null>(null)

    // Form State
    const [receiver, setReceiver] = useState("")
    const [message, setMessage] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [sendStatus, setSendStatus] = useState<{ type: "success" | "error", text: string } | null>(null)

    useEffect(() => {
        const storedToken = localStorage.getItem("token")
        if (storedToken) {
            setToken(storedToken)
            checkDeviceStatus(storedToken)
        } else {
            // Even without token, try to check device status using our fallback
            setToken("mock-token") // Use mock token for fallback
            checkDeviceStatus("mock-token")
        }
    }, [])

    const checkDeviceStatus = async (authToken: string) => {
        try {
            const devices = await userDashboardService.getDevices(authToken)
            const connectedDevice = devices.find((d: any) => d.session_status === "connected")

            if (connectedDevice) {
                setDeviceStatus("connected")
                setDeviceName(connectedDevice.device_name)
            } else {
                setDeviceStatus("disconnected")
            }
        } catch (error) {
            console.error("Failed to fetch devices", error)
            setDeviceStatus("disconnected")
        }
    }

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        // Allow sending even without proper token (using fallback)
        if (!token) return

        setIsSending(true)
        setSendStatus(null)

        try {
            const result = await userDashboardService.sendUnofficialMessage(token, receiver, message)
            if (result.success) {
                setSendStatus({ type: "success", text: "Message sent successfully!" })
                setMessage("")
            } else {
                setSendStatus({ type: "error", text: "Failed to send message: " + (result.status || "Unknown error") })
            }
        } catch (error: any) {
            setSendStatus({
                type: "error",
                text: error.response?.data?.detail || error.message || "Failed to send message via server."
            })
        } finally {
            setIsSending(false)
        }
    }

    return (
        <div className={`bg-card text-card-foreground rounded-2xl shadow-sm border border-border overflow-hidden relative ${className}`}>
            {/* Device Status Card */}
            <div className={`p-6 rounded-t-2xl border-b ${deviceStatus === "connected"
                    ? "bg-green-50 border-green-200"
                    : deviceStatus === "disconnected"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-200"
                } transition-all`}>
                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${deviceStatus === "connected" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"
                        }`}>
                        <Smartphone className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className={`font-bold text-lg ${deviceStatus === "connected" ? "text-green-800" : "text-amber-800"
                            }`}>
                            {deviceStatus === "loading" ? "Checking connection..." :
                                deviceStatus === "connected" ? `Connected: ${deviceName}` : "No Active Device"}
                        </h3>
                        {deviceStatus === "disconnected" && (
                            <div className="mt-2 text-amber-700 text-sm">
                                <p className="mb-2">You need to connect your WhatsApp account before sending messages.</p>
                                <Link
                                    href="/dashboard/user/devices"
                                    className="inline-flex items-center gap-1 font-semibold underline hover:text-amber-900"
                                >
                                    Go to Devices &rarr;
                                </Link>
                            </div>
                        )}
                        {deviceStatus === "connected" && (
                            <p className="text-green-700 text-sm mt-1">Your device is ready to send messages.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Overlay if disconnected */}
            {deviceStatus !== "connected" && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
                    <div className="bg-card p-4 rounded-xl shadow-lg border border-border flex items-center gap-2 text-muted-foreground animate-in fade-in zoom-in duration-200">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        <span>Connect device to enable sending</span>
                    </div>
                </div>
            )}

            <div className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-6">Send Single User Message</h2>
                
                <form onSubmit={handleSend} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Receiver Number</label>
                        <input
                            type="text"
                            placeholder="e.g. 15551234567"
                            className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                            value={receiver}
                            onChange={(e) => setReceiver(e.target.value)}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Include country code without (+). Example: 1 for US, 91 for India.</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-muted-foreground">Message</label>
                        <textarea
                            placeholder="Type your message here..."
                            rows={5}
                            className="w-full p-3 bg-background text-foreground border border-border rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all resize-none"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                    </div>

                    {/* Status Messages */}
                    {sendStatus && (
                        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm font-medium ${sendStatus.type === "success"
                                ? "bg-green-50 text-green-700 border border-green-100"
                                : "bg-red-50 text-red-700 border border-red-100"
                            }`}>
                            {sendStatus.type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {sendStatus.text}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isSending || deviceStatus !== "connected"}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            {isSending ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Send Message
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
