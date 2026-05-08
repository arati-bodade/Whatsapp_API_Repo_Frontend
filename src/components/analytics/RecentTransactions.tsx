import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Transaction } from '@/services/analyticsService';
import { Badge } from '@/components/ui/badge';

interface RecentTransactionsProps {
    transactions: Transaction[];
    loading: boolean;
}

export default function RecentTransactions({ transactions, loading }: RecentTransactionsProps) {
    if (loading) return null;

    return (
        <Card className="col-span-2">
            <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {transactions.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No recent transactions.</p>
                    ) : (
                        transactions.map((tx) => (
                            <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="text-sm font-medium">{tx.description}</p>
                                    <p className="text-xs text-muted-foreground">{new Date(tx.date).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-xs capitalize">{tx.status}</Badge>
                                    <span className="text-sm font-bold text-green-600">
                                        {tx.type === 'purchase' ? '+' : '-'}{tx.amount}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
