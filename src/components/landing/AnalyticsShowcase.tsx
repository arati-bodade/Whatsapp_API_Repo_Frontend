"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Target, Zap, ArrowUpRight } from 'lucide-react'

const metrics = [
    { label: 'Active Users', value: '10k+', icon: <Users size={20} />, color: '#22C55E' },
    { label: 'Campaigns Sent', value: '1.2M', icon: <TrendingUp size={20} />, color: '#3B82F6' },
    { label: 'Response Rate', value: '88%', icon: <Target size={20} />, color: '#F59E0B' },
    { label: 'Automation Speed', value: '0.2s', icon: <Zap size={20} />, color: '#6366F1' },
]

const AnalyticsShowcase = () => {
    return (
        <section id="analytics" style={{ padding: '80px 0', background: 'var(--bg-page)', overflow: 'hidden' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '24px' }}>
                            Data-Driven <span style={{ color: 'var(--primary)' }}>Growth Intelligence</span>
                        </h2>
                        <p style={{ fontSize: '18px', color: 'var(--text-body)', marginBottom: '32px', lineHeight: 1.6 }}>
                            Our analytics don't just show data; they show opportunity. Track response times, engagement metrics, and team performance in real-time.
                        </p>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            {metrics.map((m, i) => (
                                <div key={i} style={{
                                    padding: '24px',
                                    borderRadius: '24px',
                                    background: 'var(--bg-surface)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ color: m.color, background: `${m.color}15`, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {m.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-heading)' }}>{m.value}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-muted)' }}>{m.label}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        style={{ position: 'relative' }}
                    >
                        {/* Interactive Data Visual (Simulated) */}
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '32px',
                            padding: '40px',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-premium)',
                            position: 'relative',
                            zIndex: 1
                        }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px', alignItems: 'center' }}>
                                <span style={{ fontWeight: 800, fontSize: '18px' }}>Conversion Trends</span>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent)' }}></div>
                                </div>
                            </div>
                            
                            {/* Simulated Chart Bars */}
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '200px' }}>
                                {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ height: 0 }}
                                        whileInView={{ height: `${h}%` }}
                                        transition={{ duration: 1, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        style={{
                                            flex: 1,
                                            background: i % 2 === 0 ? 'var(--primary)' : 'var(--accent)',
                                            borderRadius: '6px'
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        {/* Accent elements */}
                        <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '200px', height: '200px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
                        <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(60px)', zIndex: 0 }}></div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default AnalyticsShowcase
