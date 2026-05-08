"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Building2, CheckCircle2 } from 'lucide-react'

const tabs = [
    {
        id: 'users',
        label: 'For Businesses',
        icon: <Users size={20} />,
        title: 'Empower Your Team',
        desc: 'Direct WhatsApp integration for your sales and support teams. Send bills, manage leads, and automate follow-ups without leaving your workspace.',
        features: ['Digital Bill Sender', 'Google Sheet Sync', 'Template Management', 'Team Chat Capture'],
        color: 'var(--primary)',
        bg: 'var(--primary-glow)'
    },
    {
        id: 'resellers',
        label: 'For Resellers',
        icon: <Building2 size={20} />,
        title: 'Scale Your Agency',
        desc: 'Whitelabel our platform and offer WhatsApp automation to your own clients. Full panel control and bulk credit management.',
        features: ['Whitelabel Dashboard', 'Sub-user Management', 'Bulk Credit Logic', 'API Distribution'],
        color: 'var(--accent)',
        bg: 'var(--accent-glow)'
    }
]

const ModuleTabs = () => {
    const [activeTab, setActiveTab] = useState(tabs[0])

    return (
        <section id="modules" style={{ padding: '30px 0', background: 'var(--bg-surface)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '8px' }}>
                        Designed for <span style={{ color: 'var(--primary)' }}>Every Role</span>
                    </h2>
                </div>

                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    {/* Tabs Navigation */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: '12px', 
                        marginBottom: '48px',
                        flexWrap: 'wrap'
                    }}>
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '12px 24px',
                                    borderRadius: '100px',
                                    border: '1px solid var(--border)',
                                    background: activeTab.id === tab.id ? 'var(--bg-page)' : 'transparent',
                                    color: activeTab.id === tab.id ? 'var(--text-heading)' : 'var(--text-muted)',
                                    fontWeight: 700,
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease',
                                    boxShadow: activeTab.id === tab.id ? 'var(--shadow-md)' : 'none',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ 
                                    color: activeTab.id === tab.id ? tab.color : 'inherit',
                                    transition: 'color 0.3s'
                                }}>
                                    {tab.icon}
                                </div>
                                {tab.label}
                                {activeTab.id === tab.id && (
                                    <motion.div 
                                        layoutId="activeTabGlow"
                                        style={{
                                            position: 'absolute',
                                            inset: -1,
                                            borderRadius: '100px',
                                            border: `2px solid ${tab.color}`,
                                            zIndex: -1
                                        }}
                                    />
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab.id}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            style={{
                                background: 'var(--bg-page)',
                                borderRadius: '32px',
                                padding: '60px',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-premium)',
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '60px',
                                alignItems: 'center'
                            }}
                        >
                            <div>
                                <h3 style={{ fontSize: '32px', fontWeight: 800, marginBottom: '24px' }}>{activeTab.title}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '18px', marginBottom: '32px', lineHeight: 1.6 }}>{activeTab.desc}</p>
                                
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    {activeTab.features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <CheckCircle2 size={18} color="var(--primary)" />
                                            <span style={{ fontSize: '15px', fontWeight: 600 }}>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{
                                width: '100%',
                                height: '350px',
                                background: 'var(--bg-surface)',
                                borderRadius: '24px',
                                border: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                {/* Abstract Visual Representation */}
                                <motion.div
                                    animate={{ 
                                        rotate: [0, 10, -10, 0],
                                        scale: [1, 1.05, 0.95, 1]
                                    }}
                                    transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        background: activeTab.bg,
                                        borderRadius: '40px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: activeTab.color,
                                        boxShadow: `0 20px 40px ${activeTab.bg}`
                                    }}
                                >
                                    {React.cloneElement(activeTab.icon as React.ReactElement<any>, { size: 80, strokeWidth: 1 })}
                                </motion.div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    )
}

export default ModuleTabs
