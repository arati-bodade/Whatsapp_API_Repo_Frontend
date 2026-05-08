"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, Zap, Layout, MessageSquare, TrendingUp, Smartphone } from 'lucide-react'
import { useRouter } from 'next/navigation'

const RCSPromo = () => {
    const router = useRouter()

    const features = [
        "Look and feel similar to WhatsApp.",
        "80% cheaper than WhatsApp.",
        "No number blocking.",
        "Customer engagement through CTA buttons.",
        "Send text, image, and video in campaigns.",
        "Free access to panel and API."
    ]

    return (
        <section id="rcs" style={{ 
            padding: '80px 0', 
            background: 'var(--bg-surface)', 
            overflow: 'hidden',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)'
        }}>
            <div className="container">
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '80px', 
                    alignItems: 'center' 
                }}>
                    {/* Visual Asset */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        style={{ position: 'relative' }}
                    >
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '32px',
                            padding: '24px',
                            border: '1px solid var(--border)',
                            boxShadow: '0 40px 100px -20px rgba(8,145,178,0.15)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                            <img 
                                src="/google_rcs_illustration.png" 
                                alt="Google RCS Bulk Promotions" 
                                style={{ width: '100%', height: 'auto', borderRadius: '16px', display: 'block' }}
                            />
                            
                            {/* Floating UI Elements */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{
                                    position: 'absolute',
                                    top: '20%',
                                    left: '-40px',
                                    background: '#0891B2',
                                    padding: '12px 20px',
                                    borderRadius: '16px',
                                    color: '#fff',
                                    boxShadow: '0 10px 20px rgba(8,145,178,0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    zIndex: 2
                                }}
                            >
                                <Zap size={18} fill="currentColor" />
                                <span style={{ fontSize: '14px', fontWeight: 800 }}>80% Cost Saving</span>
                            </motion.div>

                            <motion.div 
                                animate={{ y: [0, 10, 0] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                style={{
                                    position: 'absolute',
                                    bottom: '15%',
                                    right: '-30px',
                                    background: 'var(--bg-glass)',
                                    backdropFilter: 'blur(8px)',
                                    padding: '12px 24px',
                                    borderRadius: '16px',
                                    color: 'var(--text-heading)',
                                    border: '1px solid var(--border)',
                                    boxShadow: 'var(--shadow-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    zIndex: 2
                                }}
                            >
                                <Smartphone size={18} color="#0891B2" />
                                <span style={{ fontSize: '14px', fontWeight: 800 }}>Rich Media Ads</span>
                            </motion.div>
                        </div>
                        
                        {/* Background Accents */}
                        <div style={{ position: 'absolute', inset: -60, background: 'radial-gradient(circle, rgba(8,145,178,0.1) 0%, transparent 70%)', zIndex: 0 }}></div>
                    </motion.div>

                    {/* Content Section */}
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(8,145,178,0.1)', padding: '6px 16px', borderRadius: '100px', marginBottom: '16px' }}>
                            <TrendingUp size={14} color="#0891B2" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0891B2', textTransform: 'uppercase', letterSpacing: '0.1em' }}>New Channel</span>
                        </div>
                        
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '16px', color: 'var(--text-heading)', lineHeight: 1.1 }}>
                            EXPLORE <span style={{ color: '#0891B2' }}>GOOGLE RCS</span><br />
                            (BULK PROMOTIONS)
                        </h2>
                        
                        <p style={{ fontSize: '20px', color: 'var(--text-body)', fontWeight: 600, marginBottom: '32px', fontStyle: 'italic', opacity: 0.9 }}>
                            Ideal promotional tool for small and large businesses.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {features.map((feature, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ color: '#0891B2', background: 'rgba(8,145,178,0.1)', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CheckCircle2 size={16} strokeWidth={3} />
                                    </div>
                                    <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-body)' }}>{feature}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button
                                onClick={() => router.push('/register-user')}
                                style={{
                                    background: '#0891B2',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '16px 36px',
                                    fontWeight: 800,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                    boxShadow: '0 10px 25px rgba(8,145,178,0.25)',
                                    transition: 'transform 0.2s'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                Start Bulk Campaign
                            </button>
                            
                            <button
                                style={{
                                    background: 'transparent',
                                    color: 'var(--text-heading)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '12px',
                                    padding: '16px 36px',
                                    fontWeight: 800,
                                    fontSize: '16px',
                                    cursor: 'pointer',
                                }}
                            >
                                View Panel
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default RCSPromo
