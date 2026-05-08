import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BusinessUserStats } from '@/services/analyticsService';

interface TopUsersProps {
    users: BusinessUserStats[];
    loading: boolean;
}

export default function TopUsers({ users, loading }: TopUsersProps) {
    if (loading) return null;

    // Sort by credits used desc
    const sortedUsers = [...users].sort((a, b) => b.credits_used - a.credits_used).slice(0, 5);

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Top Users</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {sortedUsers.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No active users found.</p>
                    ) : (
                        sortedUsers.map((user) => (
                            <div key={user.user_id} className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarFallback>{user.business_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium leading-none">{user.business_name}</p>
                                        <p className="text-xs text-muted-foreground">{user.messages_sent} msgs sent</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold">{user.credits_used.toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground">Credits used</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
