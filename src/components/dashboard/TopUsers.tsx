import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function TopUsers() {
    return (
        <Card className="border-none shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-semibold">Top Users</CardTitle>
                <span className="text-sm text-blue-500 cursor-pointer hover:underline">View All</span>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
                {[
                    { name: "John Smith", id: "...8a92", credits: "2,450", initials: "JS", color: "bg-purple-100 text-purple-600" },
                    { name: "Acme Corp", id: "...b7c1", credits: "1,820", initials: "AC", color: "bg-orange-100 text-orange-600" },
                    { name: "Tech Labs", id: "...f3d9", credits: "940", initials: "TL", color: "bg-blue-100 text-blue-600" },
                ].map((user, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className={`h-10 w-10 ${user.color}`}>
                                <AvatarFallback className={user.color}>{user.initials}</AvatarFallback>
                            </Avatar>
                            <div className="space-y-1">
                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                <p className="text-xs text-gray-500">ID: {user.id}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900">{user.credits}</p>
                            <p className="text-xs text-gray-500">Credits used</p>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}
