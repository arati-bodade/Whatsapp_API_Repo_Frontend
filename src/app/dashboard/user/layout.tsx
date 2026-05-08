import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["user", "business_owner"]}>
            {children}
        </ProtectedRoute>
    )
}
