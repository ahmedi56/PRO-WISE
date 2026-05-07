import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { IonIcon } from '../components/index';

export const AuthLayout: React.FC = () => {
    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'var(--color-bg)',
            padding: 'var(--sp-6)',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            {/* Dynamic Background Elements */}
            <div style={{ 
                position: 'absolute', top: '-15%', right: '-10%', width: '800px', height: '800px', 
                background: 'radial-gradient(circle, var(--color-primary-faint) 0%, transparent 70%)', 
                filter: 'blur(100px)', zIndex: 0, opacity: 0.6 
            }} />
            <div style={{ 
                position: 'absolute', bottom: '-15%', left: '-10%', width: '700px', height: '700px', 
                background: 'radial-gradient(circle, var(--color-accent-faint) 0%, transparent 70%)', 
                filter: 'blur(100px)', zIndex: 0, opacity: 0.6 
            }} />
            
            {/* Subtle Grid Pattern Overlay */}
            <div style={{
                position: 'absolute', inset: 0,
                backgroundImage: `radial-gradient(var(--color-border) 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.1,
                zIndex: 0
            }} />

            <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: '440px', animation: 'fadeInUp 0.6s ease-out' }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-2)' }}>
                    {/* Tagline removed as per user request */}
                </div>
                
                <div className="card" style={{ 
                    padding: '2.5rem', 
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', 
                    border: '1px solid var(--color-border)',
                    borderRadius: '24px',
                    backgroundColor: 'rgba(var(--color-surface-rgb), 0.8)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                }}>
                    <Outlet />
                </div>

                <div style={{ 
                    position: 'fixed', 
                    top: '2rem', 
                    left: '2rem', 
                    zIndex: 10 
                }}>
                    <Link to="/home" style={{ 
                        color: 'var(--color-text-muted)', 
                        textDecoration: 'none', 
                        fontSize: '0.9375rem', 
                        fontWeight: 600,
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        padding: '0.5rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'rgba(var(--color-surface-rgb), 0.5)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid var(--color-border)',
                        transition: 'all 0.2s'
                    }} onMouseOver={(e) => {
                        e.currentTarget.style.color = 'var(--color-primary)';
                        e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                        e.currentTarget.style.transform = 'translateX(-4px)';
                    }} onMouseOut={(e) => {
                        e.currentTarget.style.color = 'var(--color-text-muted)';
                        e.currentTarget.style.borderColor = 'var(--color-border)';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}>
                        <IonIcon name="arrow-back-outline" />
                        Back to Home
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

