"use client"
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

const testimonials = [
    { text: "I am delighted to use the unlimited features of messageapi for my BUSY ERP.", logo: "/logos/talaro.jpg", name: "ERP Solutions", role: "Business Owner" },
    { text: "We recommend messageapi to all businessowners for google sheet campaign & automation.", logo: "/logos/market_brand.jpg", name: "Vedant Soft", role: "Agency Director" },
    { text: "If anyone is looking for free database for campaigns then check whatsapp group manager in messageapi.", logo: "/logos/jmj_book_store.jpg", name: "United Solutionz", role: "Marketing Head" },
    { text: "Tracking and analyzing team performance through chat replies capture is the best feature of messageapi.", logo: "/logos/mandapam.png", name: "GBS", role: "Operations Lead" },
    { text: "Sending payment reminders from Tally is the most powerful feature of messageapi.", logo: "/logos/safe_t_net.png", name: "iDream", role: "Finance Manager" },
]

const Testimonials = () => {
    const [index, setIndex] = useState(0)

    const next = () => setIndex((prev) => (prev + 1) % testimonials.length)
    const prev = () => setIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)

    return (
        <section id="testimonials" style={{ padding: '100px 0', background: 'var(--bg-page)', overflow: 'hidden' }}>
            <div className="container">
                <div style={{ textAlign: 'center', marginBottom: '64px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--primary-glow)', padding: '6px 16px', borderRadius: '100px', marginBottom: '16px' }}>
                        <Star size={14} color="var(--primary)" fill="currentColor" />
                        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Social Proof</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, marginBottom: '24px' }}>
                        Trusted by <span style={{ color: 'var(--primary)' }}>Thousands</span> of Businesses
                    </h2>
                </div>

                <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            style={{
                                background: 'var(--bg-surface)',
                                borderRadius: '32px',
                                padding: '60px',
                                border: '1px solid var(--border)',
                                boxShadow: 'var(--shadow-premium)',
                                textAlign: 'center',
                                position: 'relative'
                            }}
                        >
                            <Quote size={48} color="var(--primary)" style={{ opacity: 0.1, position: 'absolute', top: '40px', left: '40px' }} />
                            
                            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center' }}>
                                <img src={testimonials[index].logo} alt={testimonials[index].name} style={{ maxHeight: '60px', borderRadius: '12px' }} />
                            </div>

                            <p style={{ fontSize: '24px', fontWeight: 700, fontStyle: 'italic', marginBottom: '32px', color: 'var(--text-heading)', lineHeight: 1.4 }}>
                                &ldquo;{testimonials[index].text}&rdquo;
                            </p>

                            {/* Name and Role hidden as per user request */}
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '40px' }}>
                        <button
                            onClick={prev}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-page)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', color: 'var(--text-heading)', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-page)'}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={next}
                            style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-page)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)', color: 'var(--text-heading)', transition: 'all 0.2s' }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'var(--bg-page)'}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default Testimonials
