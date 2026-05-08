import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrafficSourceData } from '@/services/analyticsService';

interface TrafficSourceProps {
    data: TrafficSourceData[];
    loading: boolean;
}

// Recharts compatible data type
interface ChartDataInput {
    name: string;
    value: number;
    [key: string]: any;
}

const COLORS = ['#3b82f6', '#a855f7', '#e5e7eb', '#F59E0B', '#10B981']; // Matches screenshot roughly: Blue, Purple, Gray

export default function TrafficSource({ data, loading }: TrafficSourceProps) {
    if (loading) return null;

    // Convert TrafficSourceData to Recharts compatible format
    const chartData: ChartDataInput[] = data.length > 0 
        ? data.map(item => ({ name: item.name, value: item.value }))
        : [{ name: 'No Data', value: 1 }];
    
    const showLegend = data.length > 0;
    const totalUsers = showLegend ? data.reduce((acc, curr) => acc + curr.value, 0) : 0;

    return (
        <Card className="col-span-1">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Traffic Source</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    {/* Left Side: Chart */}
                    <div className="relative h-[160px] w-[160px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={45}
                                    outerRadius={65}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={showLegend ? COLORS[index % COLORS.length] : '#f3f4f6'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => [`${value || 0} Users`, '']}
                                    contentStyle={{ background: '#fff', border: '1px solid #ddd', borderRadius: '8px', fontSize: '12px' }}
                                    itemStyle={{ color: '#000' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>

                        {/* Centered Total Label */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <div className="text-xs text-muted-foreground font-medium">Total</div>
                            <div className="text-xl font-bold">{totalUsers > 1000 ? `${(totalUsers / 1000).toFixed(1)}k` : totalUsers}</div>
                        </div>
                    </div>

                    {/* Right Side: Custom Legend */}
                    {showLegend && (
                        <div className="flex-1 pl-4 space-y-3">
                            {data.map((entry, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-2.5 w-2.5 rounded-full"
                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                        />
                                        <span className="text-muted-foreground truncate max-w-[80px]" title={entry.name}>
                                            {entry.name || 'Unknown'}
                                        </span>
                                    </div>
                                    <span className="font-bold">{entry.percentage}%</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
