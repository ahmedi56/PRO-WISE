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
                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-8)' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ 
                            width: '44px', 
                            height: '44px', 
                            borderRadius: '12px', 
                            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 16px rgba(var(--color-primary-rgb), 0.25)',
                            transform: 'rotate(-5deg)'
                        }}>
                            <IonIcon name="flash" style={{ fontSize: '24px' }} />
                        </div>
                        <h1 style={{ fontSize: '1.875rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--color-text-strong)', margin: 0 }}>PRO-WISE</h1>
                    </Link>
                    <p style={{ color: 'var(--color-text-muted)', fontWeight: 500, fontSize: '0.9375rem', letterSpacing: '0.01em' }}>Professional Repair Intelligence</p>
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

                <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                    <Link to="/home" style={{ 
                        color: 'var(--color-text-muted)', 
                        textDecoration: 'none', 
                        fontSize: '0.875rem', 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        transition: 'color 0.2s'
                    }} onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-primary)'} onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}>
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

