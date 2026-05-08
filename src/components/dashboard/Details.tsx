import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function PlanDetails() {
    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Plan Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Plan Type</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">MAP 8A</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Expiry</span>
                    <span className="text-sm font-medium">UNLIMITED</span>
                </div>
            </CardContent>
        </Card>
    )
}

export function AccountInfo() {
    return (
        <Card className="border-none shadow-md">
            <CardHeader>
                <CardTitle className="text-base font-semibold">Account Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">User Type</span>
                    <span className="text-sm font-medium">Reseller</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Reseller ID</span>
                    <span className="text-sm font-medium">...</span>
                </div>
            </CardContent>
        </Card>
    )
}
