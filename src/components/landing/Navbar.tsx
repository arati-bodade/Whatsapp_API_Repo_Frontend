"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Sun, Moon, MessageSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
    darkMode: boolean
    toggleTheme: () => void
}

const Navbar = ({ darkMode, toggleTheme }: NavbarProps) => {
    const router = useRouter()

    return (
        <nav style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '80px',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            transition: 'all 0.3s ease',
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)'
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%'
            }}>
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                    onClick={() => router.push('/')}
                >
                    <div style={{
                        width: '44px',
                        height: '44px',
                        background: 'var(--primary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px var(--primary-glow)'
                    }}>
                        <MessageSquare size={24} color="white" strokeWidth={2.5} />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>
                            Message <span style={{ color: 'var(--primary)' }}>API</span>
                        </span>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: '2px' }}>
                            WhatsApp Platform
                        </span>
                    </div>
                </motion.div>

                {/* Nav Links */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '32px' }}
                >
                    {['Features', 'Modules', 'Pricing', 'FAQ'].map((item) => (
                        <a
                            key={item}
                            href={`#${item.toLowerCase()}`}
                            style={{
                                fontSize: '14px',
                                fontWeight: 700,
                                color: 'var(--text-body)',
                                textDecoration: 'none',
                                transition: 'color 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'}
                            onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-body)'}
                        >
                            {item}
                        </a>
                    ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
                >
                    <button
                        onClick={toggleTheme}
                        style={{
                            background: darkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)",
                            border: "none",
                            borderRadius: "50%",
                            width: "40px",
                            height: "40px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            color: darkMode ? "#FBBF24" : "#475569"
                        }}
                    >
                        {darkMode ? <Sun size={20} fill="#FBBF24" /> : <Moon size={20} fill="#475569" />}
                    </button>

                    <button
                        onClick={() => router.push('/login')}
                        style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: 'var(--text-heading)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0 8px'
                        }}
                    >
                        Log in
                    </button>

                    <button
                        onClick={() => router.push('/register-user')}
                        style={{
                            fontSize: '14px',
                            fontWeight: 700,
                            color: '#fff',
                            background: 'var(--primary)',
                            border: 'none',
                            borderRadius: '10px',
                            padding: '12px 24px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px var(--primary-glow)',
                            transition: 'transform 0.2s, filter 0.2s'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.transform = 'translateY(-1px)'
                            e.currentTarget.style.filter = 'brightness(1.1)'
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.filter = 'brightness(1)'
                        }}
                    >
                        Get Started
                    </button>
                </motion.div>
            </div>
        </nav>
    )
}

export default Navbar
