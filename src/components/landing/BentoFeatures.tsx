"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Layout, Sheet, Database, ShieldCheck, Zap } from 'lucide-react'

const features = [
    {
        title: 'ERP Integration',
        desc: 'Send bills directly from Tally, Busy, Marg, and custom POS systems.',
        icon: <Layout size={24} />,
        grid: 'span 1 / span 1',
        bg: 'var(--primary-glow)',
        color: 'var(--primary)'
    },
    {
        title: 'Google Sheets',
        desc: 'Two-way sync for campaigns and triggers.',
        icon: <Sheet size={24} />,
        grid: 'span 1 / span 1',
        bg: 'var(--accent-glow)',
        color: 'var(--accent)'
    },
    {
        title: 'Smart CRM',
        desc: 'Extract groups, manage replies, and build your customer database.',
        icon: <Database size={24} />,
        grid: 'span 1 / span 1',
        bg: 'var(--accent-glow)',
        color: 'var(--accent)'
    }
]

const BentoFeatures = () => {
    return (
        <section id="features" style={{ padding: '30px 0', background: 'var(--bg-page)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '8px' }}>
                        Powerful Features for <span style={{ color: 'var(--primary)' }}>Modern Teams</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Everything you need to automate your WhatsApp communications in one unified platform.
                    </p>
                </div>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gridTemplateRows: 'repeat(2, 300px)',
                    gap: '24px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {features.map((f, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            style={{
                                gridArea: f.grid,
                                background: 'var(--bg-surface)',
                                borderRadius: '24px',
                                padding: '40px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                position: 'relative',
                                overflow: 'hidden',
                                cursor: 'pointer',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: f.bg,
                                color: f.color,
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {f.icon}
                            </div>
                            <div>
                                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '12px' }}>{f.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1.5 }}>{f.desc}</p>
                            </div>
                            
                            {/* Decorative background element */}
                            <div style={{
                                position: 'absolute',
                                right: '-20px',
                                bottom: '-20px',
                                width: '150px',
                                height: '150px',
                                background: f.bg,
                                borderRadius: '50%',
                                filter: 'blur(40px)',
                                opacity: 0.3,
                                zIndex: 0
                            }}></div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default BentoFeatures
