import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface UsageOverviewProps {
    creditsUsed: number;
    creditsRemaining: number;
    messagesSent: number;
    loading: boolean;
}

export default function UsageOverview({ creditsUsed, creditsRemaining, messagesSent, loading }: UsageOverviewProps) {
    if (loading) return null; // Or skeleton

    const total = creditsUsed + creditsRemaining;
    const percentage = total > 0 ? (creditsUsed / total) * 100 : 0;

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Credits Consumption</span>
                        <span className="text-muted-foreground">{percentage.toFixed(1)}% Used</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold">{messagesSent.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Total Messages Sent</div>
                    </div>
                    <div className="rounded-lg border p-4 text-center">
                        <div className="text-2xl font-bold">{creditsRemaining.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Credits Left to Distribute</div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
