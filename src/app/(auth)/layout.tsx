export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-[#0F172A] animated-bg">
            <div className="relative z-10 w-full min-h-screen flex flex-col items-center justify-center">
                {children}
            </div>
        </div>
    )
}
