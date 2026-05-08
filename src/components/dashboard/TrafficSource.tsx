"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"

const data = [
    { name: "India", value: 65, color: "#3b82f6" },
    { name: "USA", value: 25, color: "#a855f7" },
    { name: "Others", value: 10, color: "#cbd5e1" },
]

export function TrafficSource() {
    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Traffic Source</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="relative w-[120px] h-[120px]">
                        <ResponsiveContainer width={120} height={120}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={40}
                                    outerRadius={55}
                                    paddingAngle={0}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-gray-400 text-[10px] text-center">Total</span>
                            <span className="text-lg font-bold text-gray-900">5.2k</span>
                        </div>
                    </div>

                    <div className="space-y-3 flex-1 pl-8">
                        {data.map((item) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                    <span className="text-sm text-gray-600">{item.name}</span>
                                </div>
                                <span className="text-sm font-bold">{item.value}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
