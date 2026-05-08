import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from 'lucide-react';

interface AccountInfoProps {
    data: {
        user_type: string;
        username: string;
        email: string;
        reseller_id: string;
    };
    loading: boolean;
}

export default function AccountInfo({ data, loading }: AccountInfoProps) {
    if (loading) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Account Info</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">User Type</span>
                    <span className="text-sm font-medium">{data.user_type}</span>
                </div>
                <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Reseller ID</span>
                    <span className="text-xs font-mono text-muted-foreground truncate" title={data.reseller_id}>
                        {data.reseller_id}
                    </span>
                </div>
                <div className="flex flex-col space-y-1">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-xs font-medium truncate" title={data.email}>
                        {data.email}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
