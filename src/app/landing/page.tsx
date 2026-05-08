"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import Navbar from "@/components/landing/Navbar"
import Hero from "@/components/landing/Hero"
import BillSender from "@/components/landing/BillSender"
import BentoFeatures from "@/components/landing/BentoFeatures"
import ModuleTabs from "@/components/landing/ModuleTabs"
import AnalyticsShowcase from "@/components/landing/AnalyticsShowcase"
import Pricing from "@/components/landing/Pricing"
import Testimonials from "@/components/landing/Testimonials"
import FAQ from "@/components/landing/FAQ"
import Footer from "@/components/landing/Footer"
import RCSPromo from "@/components/landing/RCSPromo"
import GoogleSheetPromo from "@/components/landing/GoogleSheetPromo"
import IdealFor from "@/components/landing/IdealFor"
import Compatibility from "@/components/landing/Compatibility"

export default function LandingPage() {
    const router = useRouter();
    const [darkMode, setDarkMode] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme === "dark") {
            setDarkMode(true);
        }
        setMounted(true);
    }, []);

    useEffect(() => {
        if (mounted) {
            localStorage.setItem("theme", darkMode ? "dark" : "light");
            if (darkMode) {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        }
    }, [darkMode, mounted]);

    const toggleTheme = () => setDarkMode(!darkMode);

    if (!mounted) return null;

    return (
        <>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700;800&display=swap');

                :root {
                    /* Color Tokens */
                    --primary: #22C55E;
                    --primary-dark: #16A34A;
                    --primary-light: #DCFCE7;
                    --primary-glow: rgba(34, 197, 94, 0.2);

                    --accent: #2563EB;
                    --accent-dark: #1D4ED8;
                    --accent-glow: rgba(37, 99, 235, 0.1);

                    /* Surface Tokens */
                    --bg-page: #FFFFFF;
                    --bg-surface: #F8FAFC;
                    --bg-card: #FFFFFF;
                    --bg-glass: rgba(255, 255, 255, 0.7);

                    /* Text Tokens */
                    --text-heading: #0F172A;
                    --text-body: #334155;
                    --text-muted: #64748B;
                    --text-on-primary: #FFFFFF;

                    /* Borders & Shadows */
                    --border: #E2E8F0;
                    --border-light: rgba(15, 23, 42, 0.05);
                    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
                    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                    --shadow-lg: 0 20px 25px -5px rgb(0 0 0 / 0.1);
                    --shadow-premium: 0 20px 50px rgba(0,0,0,0.05);

                    /* Radius */
                    --radius-sm: 8px;
                    --radius-md: 12px;
                    --radius-lg: 24px;
                    --radius-xl: 32px;
                }

                .dark {
                    --bg-page: #0F172A;
                    --bg-surface: #1E293B;
                    --bg-card: #1E293B;
                    --bg-glass: rgba(15, 23, 42, 0.85);

                    --text-heading: #F8FAFC;
                    --text-body: #CBD5E1;
                    --text-muted: #94A3B8;

                    --border: rgba(255, 255, 255, 0.08);
                    --border-light: rgba(255, 255, 255, 0.05);
                    --shadow-premium: 0 20px 50px rgba(0,0,0,0.3);
                }

                *,*::before,*::after {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }

                html {
                    scroll-behavior: smooth;
                    -webkit-font-smoothing: antialiased;
                }

                body {
                    font-family: 'Inter', sans-serif;
                    color: var(--text-body);
                    background: var(--bg-page);
                    overflow-x: hidden;
                    line-height: 1.6;
                }

                h1, h2, h3, h4, h5, h6 {
                    font-family: 'Outfit', sans-serif;
                    color: var(--text-heading);
                    font-weight: 700;
                    letter-spacing: -0.02em;
                }

                .container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 24px;
                }

                /* Custom Scrollbar */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: var(--bg-page); }
                ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }
            `}</style>
            
            <div className={darkMode ? "dark" : ""} style={{
                background: "var(--bg-page)",
                color: "var(--text-body)",
                minHeight: "100vh",
                transition: "background-color 0.4s ease"
            }}>
                <Navbar darkMode={darkMode} toggleTheme={toggleTheme} />

                <main>
                    <Hero />
                    <BentoFeatures />
                    <ModuleTabs />
                    <AnalyticsShowcase />
                    <GoogleSheetPromo />
                    <IdealFor />
                    <Compatibility />
                    <Pricing />
                    <Testimonials />
                    <FAQ />
                </main>
                <Footer />
            </div>
        </>
    );
}