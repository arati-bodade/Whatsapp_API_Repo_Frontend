"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
    { name: "Mon", total: 100 },
    { name: "Tue", total: 400 },
    { name: "Wed", total: 300 },
    { name: "Thu", total: 800 },
    { name: "Fri", total: 500 },
    { name: "Sat", total: 900 },
    { name: "Sun", total: 600 },
]

export function UsageChart() {
    return (
        <Card className="col-span-4 lg:col-span-3 border-none shadow-md">
            <CardHeader>
                <CardTitle>Usage Overview</CardTitle>
                <CardDescription>
                    Your credit usage over the last 7 days.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                            contentStyle={{ background: '#fff', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            cursor={{ fill: 'transparent' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500 px-4">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">0</p>
                        <p>Messages Sent</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">13930</p>
                        <p>Credits Left</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
