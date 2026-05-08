import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TopCustomers() {
    return (
        <Card className="border-none shadow-md h-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Top Customers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {[
                    { name: "Acme Corp", msgs: "1,240", change: "+12%", changeColor: "text-green-500", initials: "AC", bg: "bg-purple-100 text-purple-600" },
                    { name: "Globex Inc", msgs: "850", change: "0%", changeColor: "text-gray-400", initials: "GL", bg: "bg-orange-100 text-orange-600" },
                    { name: "Soylent Corp", msgs: "620", change: "-5%", changeColor: "text-red-500", initials: "ST", bg: "bg-blue-100 text-blue-600" },
                ].map((customer, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className={`h-10 w-10 ${customer.bg}`}>
                                <AvatarFallback className={customer.bg}>{customer.initials}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{customer.name}</p>
                                <p className="text-xs text-gray-500">{customer.msgs} msgs</p>
                            </div>
                        </div>
                        <span className={`text-sm font-bold ${customer.changeColor}`}>{customer.change}</span>
                    </div>
                ))}
                <div className="pt-2 text-center">
                    <span className="text-sm text-blue-500 cursor-pointer hover:underline">View All Users</span>
                </div>
            </CardContent>
        </Card>
    )
}
