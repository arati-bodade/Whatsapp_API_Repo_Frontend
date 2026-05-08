"use client"
import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, ArrowRight, Shield, Zap, RefreshCw, MessageSquare, BarChart3, Bell, FileText, LayoutGrid, Image as ImageIcon, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'

const floatingBadges = [
    // Left side
    { icon: <MessageSquare size={16} />, label: "Live Chat", color: "#EF4444", top: "10%", left: "-15%", delay: 0 },
    { icon: <LayoutGrid size={16} />, label: "Sidebar Control", color: "#3B82F6", top: "35%", left: "-20%", delay: 1 },
    { icon: <ImageIcon size={16} />, label: "Send Media Message", color: "#06B6D4", top: "60%", left: "-18%", delay: 2 },
    { icon: <LayoutGrid size={16} />, label: "Sidebar Control", color: "#0891B2", top: "85%", left: "-12%", delay: 0.5 },
    
    // Right side
    { icon: <Zap size={16} />, label: "Analytics Bot", color: "#22C55E", top: "8%", right: "-15%", delay: 1.5 },
    { icon: <FileText size={16} />, label: "Google Sheet", color: "#10B981", top: "30%", right: "-20%", delay: 0.8 },
    { icon: <Bell size={16} />, label: "Notification", color: "#F59E0B", top: "52%", right: "-18%", delay: 2.2 },
    { icon: <BarChart3 size={16} />, label: "Sheet Reports", color: "#6366F1", top: "75%", right: "-22%", delay: 1.2 },
    { icon: <Send size={16} />, label: "Bulk Message", color: "#F97316", top: "92%", right: "-12%", delay: 0.4 },
]

const Hero = () => {
    const router = useRouter()

    return (
        <section style={{ 
            padding: '120px 0 60px',
            background: 'radial-gradient(circle at 10% 20%, rgba(34, 197, 94, 0.05) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 40%)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div className="container" style={{ textAlign: 'center' }}>
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px 16px',
                        background: 'var(--primary-glow)',
                        borderRadius: '100px',
                        border: '1px solid var(--primary)',
                        marginBottom: '32px'
                    }}
                >
                    <Shield size={14} color="var(--primary)" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        The Ultimate WhatsApp Business API
                    </span>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        fontSize: 'clamp(40px, 6vw, 80px)',
                        lineHeight: 1.1,
                        marginBottom: '24px',
                        fontWeight: 800,
                        letterSpacing: '-0.04em'
                    }}
                >
                    Scale Your Business with<br />
                    <span style={{ 
                        background: 'linear-gradient(90deg, var(--primary) 0%, var(--accent) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Intelligent Automation
                    </span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        fontSize: 'clamp(16px, 1.5vw, 20px)',
                        color: 'var(--text-muted)',
                        maxWidth: '800px',
                        margin: '0 auto 48px',
                        fontWeight: 500,
                        lineHeight: 1.6
                    }}
                >
                    Connect with any ERP, automate Google Sheet campaigns, and manage customer relations 10x faster with our unified messaging platform.
                </motion.p>

                {/* CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '80px' }}
                >
                    <button
                        onClick={() => router.push('/register-user')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'var(--primary)',
                            color: '#fff',
                            padding: '16px 36px',
                            borderRadius: '14px',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '16px',
                            cursor: 'pointer',
                            boxShadow: '0 10px 25px var(--primary-glow)',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        Get Started Free <ArrowRight size={18} />
                    </button>
                    <button
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            background: 'var(--bg-surface)',
                            color: 'var(--text-heading)',
                            padding: '16px 36px',
                            borderRadius: '14px',
                            border: '1px solid var(--border)',
                            fontWeight: 700,
                            fontSize: '16px',
                            cursor: 'pointer',
                        }}
                    >
                        Watch Video Demo <Play size={18} fill="currentColor" />
                    </button>
                </motion.div>

                {/* Image Showcase with Floating Badges */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, rotateX: 10 }}
                    animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut", delay: 0.4 }}
                    style={{
                        perspective: '2000px',
                        margin: '0 auto',
                        maxWidth: '700px',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '32px',
                        padding: '12px',
                        border: '1px solid var(--border)',
                        boxShadow: '0 50px 100px -20px rgba(0,0,0,0.12)',
                        overflow: 'visible',
                        position: 'relative'
                    }}>
                        <img 
                            src="/dashboard_mockup_clean.png" 
                            alt="Platform Dashboard" 
                            style={{ width: '100%', height: 'auto', display: 'block', borderRadius: '24px' }}
                        />

                        {/* Floating Badges */}
                        <AnimatePresence>
                            {floatingBadges.map((badge, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ 
                                        opacity: 1, 
                                        scale: 1,
                                        y: [0, -10, 0]
                                    }}
                                    transition={{ 
                                        opacity: { delay: 0.8 + i * 0.1 },
                                        scale: { delay: 0.8 + i * 0.1 },
                                        y: { duration: 3 + Math.random() * 2, repeat: Infinity, ease: "easeInOut", delay: badge.delay }
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: badge.top,
                                        left: badge.left,
                                        right: badge.right,
                                        background: 'var(--bg-glass)',
                                        backdropFilter: 'blur(8px)',
                                        padding: '12px 20px',
                                        borderRadius: '16px',
                                        border: '1px solid var(--border)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        boxShadow: 'var(--shadow-lg)',
                                        zIndex: 10,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        background: `${badge.color}20`,
                                        color: badge.color,
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {badge.icon}
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-heading)' }}>{badge.label}</span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </div>
        </section>
    )
}

export default Hero
