"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Store, Laptop, Building, Globe, ArrowRight } from 'lucide-react'

const useCases = [
    {
        id: "01",
        title: "Food & Retail Businesses",
        desc: "Restaurants, supermarkets, and specialty shops looking to eliminate paper billing and modernize customer interactions.",
        icon: <Store size={24} />,
        color: "var(--primary)"
    },
    {
        id: "02",
        title: "Electronics & Retailers",
        desc: "Consumer durables, appliances, and mobile stores for digital warranty management and automated service reminders.",
        icon: <Laptop size={24} />,
        color: "var(--accent)"
    },
    {
        id: "03",
        title: "Small & Medium Businesses",
        desc: "Any business seeking an alternative to traditional paper invoicing and manual warranty tracking systems.",
        icon: <Building size={24} />,
        color: "var(--primary)"
    },
    {
        id: "04",
        title: "Consumer Brands",
        desc: "Branded companies upgrading to low-cost QR-based warranty delivery and direct trade channel communication.",
        icon: <Globe size={24} />,
        color: "var(--accent)"
    }
]

const IdealFor = () => {
    return (
        <section id="ideal-for" style={{ padding: '80px 0', background: 'var(--bg-page)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '24px' }}>
                        Ideal For <span style={{ color: 'var(--primary)' }}>Your Industry</span>
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Tailored solutions designed to solve specific challenges across diverse business sectors.
                    </p>
                </div>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                    gap: '32px',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {useCases.map((uc, i) => (
                        <motion.div
                            key={uc.id}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1, duration: 0.6, ease: "easeOut" }}
                            whileHover={{ y: -10 }}
                            style={{
                                background: 'var(--bg-surface)',
                                borderRadius: '32px',
                                padding: '48px',
                                border: '1px solid var(--border)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '24px',
                                transition: 'all 0.3s ease',
                                boxShadow: 'var(--shadow-sm)'
                            }}
                        >
                            {/* Number Indicator */}
                            <div style={{
                                position: 'absolute',
                                top: '32px',
                                right: '32px',
                                fontSize: '40px',
                                fontWeight: 900,
                                opacity: 0.05,
                                color: 'var(--text-heading)',
                                pointerEvents: 'none'
                            }}>
                                {uc.id}
                            </div>

                            {/* Icon */}
                            <div style={{
                                width: '56px',
                                height: '56px',
                                background: `${uc.color}15`,
                                color: uc.color,
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                {uc.icon}
                            </div>

                            {/* Content */}
                            <div>
                                <h3 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px', color: 'var(--text-heading)' }}>
                                    {uc.title}
                                </h3>
                                <p style={{ color: 'var(--text-body)', fontSize: '15px', lineHeight: 1.6, fontWeight: 500 }}>
                                    {uc.desc}
                                </p>
                            </div>

                            {/* Decorative Button/Link */}
                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '8px', color: uc.color, fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                                Learn More <ArrowRight size={16} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default IdealFor
