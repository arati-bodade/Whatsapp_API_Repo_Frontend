"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

const plans = [
    {
        name: 'MAP 9C',
        price: '₹3,000',
        credits: '10,000',
        validity: '365 Days',
        rate: '₹0.3/msg',
        desc: 'Advanced features for small businesses and growing teams.',
        featured: false,
        color: 'var(--text-heading)'
    },
    {
        name: 'MAP 9D',
        price: '₹6,000',
        credits: '25,000',
        validity: '365 Days',
        rate: '₹0.24/msg',
        desc: 'High-volume messaging with optimized rates for scaling.',
        featured: true,
        color: 'var(--primary)'
    },
    {
        name: 'MAP 9E',
        price: '₹11,000',
        credits: '50,000',
        validity: '365 Days',
        rate: '₹0.22/msg',
        desc: 'Enterprise-grade capacity with the lowest per-message cost.',
        featured: false,
        color: 'var(--accent)'
    }
]

const Pricing = () => {
    return (
        <section id="pricing" style={{ padding: '80px 0', background: 'var(--bg-surface)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '24px' }}>
                        Simple, <span style={{ color: 'var(--primary)' }}>Transparent</span> Pricing
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '18px', maxWidth: '600px', margin: '0 auto' }}>
                        Choose the plan that fits your business scale. No hidden costs.
                    </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', maxWidth: '1200px', margin: '0 auto' }}>
                    {plans.map((p, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.1 }}
                            style={{
                                background: 'var(--bg-page)',
                                borderRadius: '32px',
                                padding: '48px',
                                border: p.featured ? `2px solid var(--primary)` : '1px solid var(--border)',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: p.featured ? '0 20px 50px rgba(34,197,94,0.15)' : 'var(--shadow-sm)'
                            }}
                        >
                            {p.featured && (
                                <div style={{ position: 'absolute', top: '0', left: '50%', transform: 'translate(-50%, -50%)', background: 'var(--primary)', color: '#fff', padding: '6px 20px', borderRadius: '20px', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                    Most Popular
                                </div>
                            )}

                            <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{p.name}</h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '15px', marginBottom: '32px', lineHeight: 1.5 }}>{p.desc}</p>
                            
                            <div style={{ marginBottom: '32px' }}>
                                <div style={{ fontSize: '48px', fontWeight: 800, color: 'var(--text-heading)' }}>
                                    {p.price}
                                </div>
                                <div style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>One-time payment</div>
                            </div>

                            <div style={{ flex: 1, marginBottom: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Total Credits</span>
                                    <span style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{p.credits}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Validity</span>
                                    <span style={{ fontWeight: 800, color: 'var(--text-heading)' }}>{p.validity}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Msg Rate</span>
                                    <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{p.rate}</span>
                                </div>
                            </div>

                            <button style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '14px',
                                border: 'none',
                                background: p.featured ? 'var(--primary)' : 'var(--bg-surface)',
                                color: p.featured ? '#fff' : 'var(--text-heading)',
                                fontWeight: 800,
                                fontSize: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}>
                                Buy Plan <ArrowRight size={18} />
                            </button>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Pricing
