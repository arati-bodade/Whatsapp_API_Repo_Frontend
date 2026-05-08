import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Layout } from 'lucide-react';

interface PlanDetailsProps {
    data: {
        plan_type: string;
        expiry: string;
    };
    loading: boolean;
}

export default function PlanDetails({ data, loading }: PlanDetailsProps) {
    if (loading) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Details</CardTitle>
                <Layout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Plan Type</span>
                    <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                        {data.plan_type}
                    </Badge>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Expiry</span>
                    <span className="text-sm font-bold">{data.expiry}</span>
                </div>
            </CardContent>
        </Card>
    );
}
