"use client"

import { useState } from "react"
import { ExternalLink, Copy, Check, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function ApiDocumentationPage() {
    const [copied, setCopied] = useState(false)
    const postmanUrl = "https://documenter.getpostman.com/view/1240173/2sB3B8stEM"

    const handleCopy = () => {
        navigator.clipboard.writeText(postmanUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="flex flex-col gap-6 -m-4 sm:-m-8">
            {/* Control Bar (Optional, if you want something above) */}
            <div className="bg-white border-b px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-emerald-600" />
                        API Reference
                    </h1>
                    <p className="text-sm text-gray-500">Developer documentation and integration guides</p>
                </div>
                
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline"
                        onClick={handleCopy}
                        className="flex items-center gap-2"
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4 text-emerald-500" />
                                URL Copied
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                Copy Link
                            </>
                        )}
                    </Button>
                    
                    <Button 
                        asChild
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        <a 
                            href={postmanUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-2"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Launch Postman
                        </a>
                    </Button>
                </div>
            </div>

            {/* Embedded Documentation */}
            <div className="flex-1 w-full bg-white h-[calc(100vh-140px)] border-t">
                <iframe
                    src={postmanUrl}
                    className="w-full h-full border-none"
                    title="Postman Documentation"
                    loading="lazy"
                />
            </div>
        </div>
    )
}
