import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

export function RecentTransactions() {
    return (
        <Card className="border-none shadow-md h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
                <span className="text-sm text-blue-500 cursor-pointer hover:underline">View All</span>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow className="border-b border-gray-100">
                            <TableHead className="text-gray-500 text-xs font-semibold uppercase">Date</TableHead>
                            <TableHead className="text-gray-500 text-xs font-semibold uppercase">Description</TableHead>
                            <TableHead className="text-gray-500 text-xs font-semibold uppercase">Status</TableHead>
                            <TableHead className="text-right text-gray-500 text-xs font-semibold uppercase">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow className="border-none hover:bg-transparent">
                            <TableCell className="text-sm text-gray-600 py-4">Oct 24, 2023</TableCell>
                            <TableCell className="text-sm text-gray-500 py-4">Credit Purchase (Standard)</TableCell>
                            <TableCell className="py-4"><Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none font-medium shadow-none">Completed</Badge></TableCell>
                            <TableCell className="text-right font-bold text-gray-900 py-4">₹1,200</TableCell>
                        </TableRow>
                        <TableRow className="border-none hover:bg-transparent">
                            <TableCell className="text-sm text-gray-600 py-4">Oct 20, 2023</TableCell>
                            <TableCell className="text-sm text-gray-500 py-4">Monthly Subscription</TableCell>
                            <TableCell className="py-4"><Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-medium shadow-none">Active</Badge></TableCell>
                            <TableCell className="text-right font-bold text-gray-900 py-4">-</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}
