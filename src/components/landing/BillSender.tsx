"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { Printer, Send, ShieldCheck, Zap, Laptop, MessageSquare, ArrowRight, FileText } from 'lucide-react'

const BillSender = () => {
    return (
        <section id="bill-sender" style={{ padding: '30px 0', background: 'var(--bg-page)', overflow: 'hidden' }}>
            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>

                    {/* Content Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -40 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary-glow)', padding: '6px 16px', borderRadius: '100px', marginBottom: '16px' }}>
                            <Printer size={14} color="var(--primary)" />
                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Next-Gen Billing</span>
                        </div>

                        <h2 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, marginBottom: '20px', color: 'var(--text-heading)', lineHeight: 1.1 }}>
                            Mobill Printer<br />
                            <span style={{ color: 'var(--primary)' }}>Digital Bill Sender</span>
                        </h2>

                        <p style={{ fontSize: '18px', color: 'var(--text-body)', marginBottom: '32px', lineHeight: 1.6 }}>
                            Send bills, invoices, and warranty documents directly via WhatsApp from any desktop, ERP, or POS system. Eliminate paper waste and enhance customer trust.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
                            {[
                                "Send instant digital receipts via WhatsApp",
                                "Works with Tally, Busy, Marg, and custom POS",
                                "Automatic warranty document delivery",
                                "100% Paperless & Low-cost operations"
                            ].map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <ShieldCheck size={18} color="var(--primary)" />
                                    <span style={{ fontSize: '16px', fontWeight: 600 }}>{f}</span>
                                </div>
                            ))}
                        </div>

                        <button style={{
                            background: 'var(--primary)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '16px 36px',
                            fontWeight: 800,
                            fontSize: '16px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 25px var(--primary-glow)',
                            transition: 'all 0.2s'
                        }}>
                            Try Digital Billing <ArrowRight size={18} />
                        </button>
                    </motion.div>

                    {/* Animated Diagram Section */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        style={{ position: 'relative' }}
                    >
                        <div style={{
                            background: 'var(--bg-surface)',
                            borderRadius: '32px',
                            padding: '60px',
                            border: '1px solid var(--border)',
                            position: 'relative',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '40px',
                            boxShadow: 'var(--shadow-premium)'
                        }}>
                            {/* Step 1: Desktop/ERP */}
                            <motion.div
                                style={{
                                    background: 'var(--bg-card)',
                                    padding: '20px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px',
                                    zIndex: 2,
                                    width: '140px'
                                }}
                            >
                                <Laptop size={32} color="var(--text-heading)" />
                                <span style={{ fontSize: '12px', fontWeight: 800 }}>Desktop/ERP</span>
                            </motion.div>

                            {/* Arrow Container */}
                            <div style={{ position: 'relative', width: '2px', height: '100px', background: 'var(--border)' }}>
                                {/* Moving Bill Animation */}
                                <motion.div
                                    animate={{ top: ['-10%', '110%'], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--primary)',
                                        borderRadius: '4px',
                                        padding: '4px',
                                        color: '#fff',
                                        zIndex: 3
                                    }}
                                >
                                    <FileText size={16} />
                                </motion.div>
                            </div>

                            {/* Step 2: Platform Gateway */}
                            <motion.div
                                style={{
                                    background: 'var(--primary)',
                                    padding: '24px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 20px 40px var(--primary-glow)',
                                    zIndex: 2
                                }}
                            >
                                <Zap size={32} color="white" fill="white" />
                            </motion.div>

                            <div style={{ position: 'relative', width: '2px', height: '100px', background: 'var(--border)' }}>
                                <motion.div
                                    animate={{ top: ['-10%', '110%'], opacity: [0, 1, 0] }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear', delay: 1 }}
                                    style={{
                                        position: 'absolute',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        background: 'var(--accent)',
                                        borderRadius: '4px',
                                        padding: '4px',
                                        color: '#fff',
                                        zIndex: 3
                                    }}
                                >
                                    <Send size={16} />
                                </motion.div>
                            </div>

                            {/* Step 3: Customer WhatsApp */}
                            <motion.div
                                style={{
                                    background: 'var(--bg-card)',
                                    padding: '20px',
                                    borderRadius: '20px',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '10px',
                                    zIndex: 2,
                                    width: '140px'
                                }}
                            >
                                <MessageSquare size={32} color="var(--primary)" />
                                <span style={{ fontSize: '12px', fontWeight: 800 }}>WhatsApp</span>
                            </motion.div>
                        </div>

                        {/* Background Pulsing Circles */}
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100%', height: '100%', zIndex: 0 }}>
                            <motion.div
                                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                                style={{ position: 'absolute', top: '20%', left: '20%', width: '150px', height: '150px', background: 'var(--primary-glow)', borderRadius: '50%', filter: 'blur(40px)' }}
                            />
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] }}
                                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                                style={{ position: 'absolute', bottom: '20%', right: '20%', width: '150px', height: '150px', background: 'var(--accent-glow)', borderRadius: '50%', filter: 'blur(40px)' }}
                            />
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    )
}

export default BillSender
