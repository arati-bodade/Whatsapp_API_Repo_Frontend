"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Database, CheckCircle2 } from 'lucide-react'

const integrations = [
    { name: "Tally Prime", color: "#16A34A" },
    { name: "Tally ERP-9", color: "#16A34A" },
    { name: "Busy", color: "#2563EB" },
    { name: "Marg", color: "#EA580C" },
    { name: "Zoho", color: "#DC2626" },
    { name: "Wings", color: "#7C3AED" },
    { name: "SAP B1", color: "#0089D0" },
    { name: "Oracle NetSuite", color: "#E51937" },
    { name: "Microsoft Dynamics", color: "#00A4EF" }
]

// Duplicate the list for seamless looping
const duplicatedIntegrations = [...integrations, ...integrations]

const Compatibility = () => {
    return (
        <section id="compatibility" style={{ 
            padding: '40px 0', 
            background: 'var(--bg-surface)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            overflow: 'hidden'
        }}>
            <div className="container" style={{ marginBottom: '32px', textAlign: 'center' }}>
                <p style={{ 
                    fontSize: '14px', 
                    fontWeight: 800, 
                    color: 'var(--text-muted)', 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.2em',
                    marginBottom: '12px'
                }}>
                    Compatible with leading ERP & POS systems
                </p>
            </div>

            <div style={{ position: 'relative', display: 'flex', overflow: 'hidden' }}>
                {/* Gradient Masks for fade effect */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, var(--bg-surface) 0%, transparent 15%, transparent 85%, var(--bg-surface) 100%)', zIndex: 2, pointerEvents: 'none' }}></div>

                <motion.div
                    animate={{
                        x: [0, -1920], // Adjust based on total width
                    }}
                    transition={{
                        x: {
                            duration: 30,
                            repeat: Infinity,
                            ease: "linear",
                        },
                    }}
                    style={{
                        display: 'flex',
                        gap: '40px',
                        padding: '10px 0',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {duplicatedIntegrations.map((item, i) => (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                background: 'var(--bg-page)',
                                padding: '12px 24px',
                                borderRadius: '100px',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-sm)',
                                cursor: 'default'
                            }}
                        >
                            <div style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                background: `${item.color}15`,
                                color: item.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <Database size={14} />
                            </div>
                            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-heading)' }}>{item.name}</span>
                            <CheckCircle2 size={14} color="var(--primary)" />
                        </div>
                    ))}
                </motion.div>
            </div>
        </section>
    )
}

export default Compatibility
