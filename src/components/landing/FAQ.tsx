"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqItems = [
    {
        q: "HOW CAN I GET BENEFITTED THROUGH GOOGLE SHEET INTEGRATION?",
        a: "Google Sheet integration allows you to sync your customer data in real-time. You can automate personalized messaging campaigns, set up triggers for specific sheet updates, and manage your bulk broadcasts directly from your familiar spreadsheet interface."
    },
    {
        q: "PLEASE GIVE ME EXAMPLE OF WHEN TO USE GOOGLE SHEET WITH WHATSAPP IN BUSINESS?",
        a: "Use it for automated appointment reminders when a row is added, sending payment links to customers listed in a sheet, or broadcasting daily stock updates to a curated list of dealers without manual data entry."
    },
    {
        q: "WHAT DOES WHATSAPP GROUP MANAGER & MANAGE REPLIES MEANS?",
        a: "Group Manager allows you to extract contacts from groups and automate group interactions. Manage Replies is an AI-powered tool that captures and organizes customer responses, helping your team track engagement and performance 10x faster."
    },
    {
        q: "HOW CAN I START USING NEW FEATURES WITH AVAILABLE CREDITS IN MY ACCOUNT?",
        a: "Log in to your dashboard, go to the 'Settings' or 'Integrations' tab, and link your Google account or Tally TDL. Your existing credits will be automatically applied to these services based on your usage."
    }
]

const FaqItem = ({ q, a, i }: { q: string, a: string, i: number }) => {
    const [isOpen, setIsOpen] = useState(false)

    return (
        <div style={{
            background: 'var(--bg-surface)',
            borderRadius: '20px',
            marginBottom: '16px',
            border: '1px solid var(--border)',
            overflow: 'hidden'
        }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    padding: '24px 32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left'
                }}
            >
                <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em' }}>{q}</span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    style={{ color: 'var(--primary)' }}
                >
                    <ChevronDown size={24} />
                </motion.div>
            </button>
            
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    >
                        <div style={{ padding: '0 32px 32px', color: 'var(--text-body)', fontSize: '16px', lineHeight: 1.6, fontWeight: 600 }}>
                            {a}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const FAQ = () => {
    return (
        <section id="faq" style={{ padding: '100px 0', background: 'var(--bg-page)' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary-glow)', padding: '6px 16px', borderRadius: '100px', marginBottom: '16px' }}>
                        <HelpCircle size={14} color="var(--primary)" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Support Center</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '24px' }}>
                        Frequently Asked <span style={{ color: 'var(--primary)' }}>Questions</span>
                    </h2>
                </div>

                <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {faqItems.map((item, i) => (
                        <FaqItem key={i} q={item.q} a={item.a} i={i} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default FAQ
