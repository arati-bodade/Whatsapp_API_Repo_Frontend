"use client"
import React from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Twitter, Github, Linkedin, Mail, MapPin, Phone, ArrowUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

const Footer = () => {
    const router = useRouter()

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <footer style={{
            background: 'var(--bg-card)',
            color: 'var(--text-body)',
            padding: '100px 0 40px',
            borderTop: '1px solid var(--border)',
            position: 'relative'
        }}>
            {/* Back to Top */}
            <button
                onClick={scrollToTop}
                style={{
                    position: 'absolute',
                    top: '-24px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    color: '#fff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 10px 20px var(--primary-glow)',
                    zIndex: 10
                }}
            >
                <ArrowUp size={20} />
            </button>

            <div className="container">
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr', gap: '80px', marginBottom: '80px' }}>
                    {/* Brand */}
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                            <div style={{
                                width: '40px',
                                height: '40px',
                                background: 'var(--primary)',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <MessageSquare size={20} color="white" />
                            </div>
                            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-heading)' }}>
                                Message<span style={{ color: 'var(--primary)' }}>API</span>
                            </span>
                        </div>
                        <p style={{ fontSize: '15px', color: 'var(--text-muted)', marginBottom: '32px', lineHeight: 1.6 }}>
                            The ultimate communication platform for modern businesses. Scale your reach and automate your workflows with ease.
                        </p>
                        <div style={{ display: 'flex', gap: '16px' }}>
                            {[Twitter, Github, Linkedin].map((Icon, i) => (
                                <a key={i} href="#" style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.2s' }} onMouseOver={(e) => { e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.borderColor = 'var(--primary)' }} onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}>
                                    <Icon size={18} />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '24px' }}>Product</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {['Features', 'Modules', 'Pricing', 'Documentation'].map((item) => (
                                <li key={item} style={{ marginBottom: '12px' }}>
                                    <a href={`#${item.toLowerCase()}`} style={{ fontSize: '15px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Platform */}
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '24px' }}>Platform</h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {['API Reference', 'Status', 'Security', 'FAQ'].map((item) => (
                                <li key={item} style={{ marginBottom: '12px' }}>
                                    <a href={`#${item.toLowerCase()}`} style={{ fontSize: '15px', color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}>
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-heading)', marginBottom: '24px' }}>Get in Touch</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'var(--text-muted)' }}>
                                <Mail size={18} color="var(--primary)" />
                                hello@messageapi.com
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'var(--text-muted)' }}>
                                <Phone size={18} color="var(--primary)" />
                                +91 98765 43210
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', color: 'var(--text-muted)' }}>
                                <MapPin size={18} color="var(--primary)" />
                                Mumbai, India
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        &copy; {new Date().getFullYear()} RSL SOLUTION PRIVATE LIMITED. All rights reserved.
                    </p>
                    <div style={{ display: 'flex', gap: '24px' }}>
                        <a href="#" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>Privacy Policy</a>
                        <a href="#" style={{ fontSize: '14px', color: 'var(--text-muted)', textDecoration: 'none', fontWeight: 600 }}>Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default Footer
