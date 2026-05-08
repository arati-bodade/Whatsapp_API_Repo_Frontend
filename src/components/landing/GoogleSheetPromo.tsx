"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Sheet, TrendingUp, Zap, ZapOff, Table } from 'lucide-react'
import { useRouter } from 'next/navigation'

const GoogleSheetPromo = () => {
    const router = useRouter()

    const features = [
        "Enhance your team performance 10x times",
        "Sync googlesheet data to set messaging campaigns and triggers",
        "Send whatsapp to unsaved numbers in your device"
    ]

    return (
        <section id="googlesheet" style={{ 
            padding: '120px 0', 
            background: 'var(--bg-page)', 
            overflow: 'hidden'
        }}>
            <div className="container">
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1.2fr 1fr', 
                    gap: '80px', 
                    alignItems: 'center' 
                }}>
                    
                    {/* Content Section (Left) */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary-glow)', padding: '6px 16px', borderRadius: '100px', marginBottom: '16px' }}>
                            <Table size={14} color="var(--primary)" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Marketing Automation</span>
                        </div>
                        
                        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, marginBottom: '20px', color: 'var(--text-heading)', lineHeight: 1.1 }}>
                            WHATSAPP MESSAGING<br />
                            <span style={{ color: 'var(--primary)' }}>+ GOOGLE SHEET</span>
                        </h2>
                        
                        <p style={{ fontSize: '22px', color: 'var(--text-body)', fontWeight: 600, marginBottom: '40px', fontStyle: 'italic', opacity: 0.9 }}>
                            Get business whatsapp marketing to new heights.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '48px' }}>
                            {features.map((feature, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ color: 'var(--primary)', background: 'var(--primary-glow)', width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={18} strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-secondary)' }}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => router.push('/register-user')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '14px',
                                padding: '18px 40px',
                                fontWeight: 800,
                                fontSize: '17px',
                                cursor: 'pointer',
                                boxShadow: '0 10px 30px var(--primary-glow)',
                                transition: 'transform 0.2s'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            Sync Your Sheets Now <Zap size={18} fill="currentColor" />
                        </button>
                    </motion.div>

                    {/* Visual Asset (Right) */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        style={{ position: 'relative' }}
                    >
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '32px',
                            padding: '16px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.1)',
                            position: 'relative',
                            zIndex: 1,
                            transform: 'rotate(2deg)'
                        }}>
                            <img 
                                src="/google_sheet_integration.png" 
                                alt="WhatsApp Google Sheet Integration" 
                                style={{ width: '100%', height: 'auto', borderRadius: '24px', display: 'block' }}
                            />
                            
                            {/* Floating Overlay Elements */}
                            <motion.div 
                                animate={{ y: [0, -15, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute',
                                    top: '10%',
                                    right: '-30px',
                                    background: '#10B981',
                                    padding: '12px 24px',
                                    borderRadius: '16px',
                                    color: '#fff',
                                    boxShadow: '0 10px 20px rgba(16,185,129,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    zIndex: 2
                                }}
                            >
                                <Sheet size={20} fill="currentColor" />
                                <span style={{ fontSize: '15px', fontWeight: 800 }}>Real-time Data Sync</span>
                            </motion.div>

                            <motion.div 
                                animate={{ y: [0, 15, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                style={{
                                    position: 'absolute',
                                    bottom: '10%',
                                    left: '-40px',
                                    background: 'var(--bg-glass)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '16px 24px',
                                    borderRadius: '20px',
                                    color: 'var(--text-heading)',
                                    border: '1px solid var(--border)',
                                    boxShadow: 'var(--shadow-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    zIndex: 2
                                }}
                            >
                                <TrendingUp size={20} color="var(--primary)" />
                                <span style={{ fontSize: '15px', fontWeight: 800 }}>Performance Optimized</span>
                            </motion.div>
                        </div>
                        
                        {/* Abstract Background Elements */}
                        <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)', zIndex: 0 }}></div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default GoogleSheetPromo
