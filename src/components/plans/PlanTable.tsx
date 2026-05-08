import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plan } from "./PlanCard";
import Link from "next/link";

interface PlanTableProps {
    plans: Plan[];
    onPurchase?: (plan: Plan) => void;
}

export function PlanTable({ plans, onPurchase }: PlanTableProps) {
    const handleAction = (plan: Plan) => {
        if (onPurchase) {
            onPurchase(plan);
        }
    }
    return (
        <div className="rounded-md border bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow>
                        <TableHead className="w-[200px] font-semibold">Plan Name</TableHead>
                        <TableHead className="font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Price</TableHead>
                        <TableHead className="font-semibold">Credits</TableHead>
                        <TableHead className="font-semibold">Rate</TableHead>
                        <TableHead className="font-semibold">Validity</TableHead>
                        <TableHead className="text-right font-semibold">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {plans.map((plan) => (
                        <TableRow key={plan.id} className="hover:bg-gray-50/50">
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span className="text-base font-semibold text-gray-900">{plan.name}</span>
                                    {plan.popular && (
                                        <Badge variant="secondary" className="w-fit mt-1 bg-blue-100 text-blue-700 text-[10px] px-2 py-0 h-5">
                                            Popular
                                        </Badge>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={
                                    plan.category === 'reseller'
                                        ? "bg-purple-50 text-purple-700 border-purple-200"
                                        : "bg-green-50 text-green-700 border-green-200"
                                }>
                                    {plan.category === 'reseller' ? 'Reseller' : 'User'}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-bold text-gray-700">₹{plan.price}</TableCell>
                            <TableCell>{plan.credits}</TableCell>
                            <TableCell className="text-muted-foreground">{plan.rate}</TableCell>
                            <TableCell>{plan.validity}</TableCell>
                            <TableCell className="text-right">
                                {plan.isDemo ? (
                                    <Button size="sm" variant="secondary" disabled>
                                        View
                                    </Button>
                                ) : (
                                    onPurchase ? (
                                        <Button size="sm" variant="default" onClick={() => handleAction(plan)}>
                                            Select
                                        </Button>
                                    ) : (
                                        <Link href={`/plans/checkout?planName=${encodeURIComponent(plan.name)}`}>
                                            <Button size="sm" variant="default">
                                                Select
                                            </Button>
                                        </Link>
                                    )
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
