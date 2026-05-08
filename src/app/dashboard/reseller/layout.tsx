import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute allowedRoles={["reseller"]}>
            {children}
        </ProtectedRoute>
    )
}
