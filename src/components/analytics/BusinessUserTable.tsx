import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BusinessUserStats } from '@/services/analyticsService';
import { Search } from 'lucide-react';

interface BusinessUserTableProps {
    data: BusinessUserStats[];
    loading: boolean;
}

const BusinessUserTable: React.FC<BusinessUserTableProps> = ({ data, loading }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredData = data.filter(item =>
        item.business_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Card className="col-span-4">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Business User Performance</CardTitle>
                    <div className="relative w-64">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search business..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-4">Loading stats...</div>
                ) : filteredData.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">No business users found.</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Business Name</TableHead>
                                <TableHead>Allocated</TableHead>
                                <TableHead>Used</TableHead>
                                <TableHead>Remaining</TableHead>
                                <TableHead>Messages Sent</TableHead>
                                <TableHead className="text-right">Usage %</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredData.map((business) => {
                                const usagePercent = business.credits_allocated > 0
                                    ? (business.credits_used / business.credits_allocated) * 100
                                    : 0;

                                return (
                                    <TableRow key={business.user_id}>
                                        <TableCell className="font-medium">{business.business_name}</TableCell>
                                        <TableCell>{business.credits_allocated.toLocaleString()}</TableCell>
                                        <TableCell>{business.credits_used.toLocaleString()}</TableCell>
                                        <TableCell>{business.credits_remaining.toLocaleString()}</TableCell>
                                        <TableCell>{business.messages_sent.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <span className={`font-bold ${usagePercent > 80 ? 'text-red-500' : 'text-green-600'}`}>
                                                {usagePercent.toFixed(1)}%
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default BusinessUserTable;
