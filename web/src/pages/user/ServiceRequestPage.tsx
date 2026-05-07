import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, PageHeader, Input, Button, IonIcon } from '../../components/index';
import { maintenanceService } from '../../services/maintenanceService';
import '../../styles/home-page.css'; // Reuse storm/bolt effects

export const ServiceRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        productName: '',
        issueDescription: '',
        urgency: 'low'
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await maintenanceService.createRequest(formData);
            setSubmitted(true);
            setTimeout(() => navigate('/profile'), 2000);
        } catch (err) {
            console.error(err);
            alert('Failed to submit service request');
        } finally {
            setLoading(false);
        }
    };

    const urgencyLevels = [
        { id: 'low', label: 'Routine', icon: 'calendar-outline', color: 'var(--color-success)', desc: 'General maintenance or minor issue' },
        { id: 'medium', label: 'Functional', icon: 'alert-circle-outline', color: 'var(--color-warning)', desc: 'Hardware is working but has defects' },
        { id: 'high', label: 'Critical', icon: 'flame-outline', color: 'var(--color-error)', desc: 'Complete system failure or safety risk' },
    ];

    if (submitted) {
        return (
            <PageWrapper>
                <div className="pw-flex-col pw-items-center pw-justify-center" style={{ minHeight: '60vh' }}>
                    <div className="icon-box floating-element" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', width: '80px', height: '80px', marginBottom: '2rem' }}>
                        <IonIcon name="checkmark-done-outline" style={{ fontSize: '2.5rem' }} />
                    </div>
                    <h2 className="modern-h2">Request Transmitted</h2>
                    <p className="modern-subtitle">A technician will review your case shortly. Redirecting...</p>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <div className="home-container" style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-8) 1rem' }}>
                <header className="stagger-item stagger-1" style={{ marginBottom: '4rem' }}>
                    <div className="hero-glow-circle glow-1" style={{ opacity: 0.1, width: '400px', height: '400px' }} />
                    <div className="pw-flex pw-items-center pw-gap-4 pw-mb-4">
                        <div className="icon-box" style={{ background: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
                            <IonIcon name="build-outline" />
                        </div>
                        <h1 className="modern-h2" style={{ fontSize: '2.5rem', margin: 0 }}>Service Terminal</h1>
                    </div>
                    <p className="modern-subtitle">Initialize a new maintenance request. Our AI-driven routing will assign the best specialist for your hardware.</p>
                </header>
                
                <form onSubmit={handleSubmit} className="card glass stagger-item stagger-2" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
                    <div className="bolt bolt-1" style={{ opacity: 0.1 }}></div>
                    <div className="bolt bolt-4" style={{ opacity: 0.1, right: '5%', left: 'auto' }}></div>
                    
                    <div className="pw-grid pw-grid-cols-1 pw-gap-8" style={{ position: 'relative', zIndex: 2 }}>
                        <section>
                            <h3 className="pw-label" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.7 }}>01. HARDWARE IDENTIFICATION</h3>
                            <Input 
                                placeholder="Enter model name or serial number..."
                                value={formData.productName} 
                                onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                                required 
                                className="pw-input-premium"
                            />
                        </section>

                        <section>
                            <h3 className="pw-label" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.7 }}>02. URGENCY CLASSIFICATION</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                                {urgencyLevels.map(level => (
                                    <div 
                                        key={level.id}
                                        onClick={() => setFormData({...formData, urgency: level.id})}
                                        style={{
                                            padding: '1.5rem',
                                            borderRadius: 'var(--radius-lg)',
                                            border: `1px solid ${formData.urgency === level.id ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)'}`,
                                            background: formData.urgency === level.id ? 'rgba(79, 70, 229, 0.05)' : 'rgba(255,255,255,0.02)',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                        className="urgency-card"
                                    >
                                        <div className="pw-flex pw-items-center pw-gap-3 pw-mb-2">
                                            <IonIcon name={level.icon} style={{ color: level.color, fontSize: '1.25rem' }} />
                                            <span style={{ fontWeight: 700, fontSize: '1rem' }}>{level.label}</span>
                                        </div>
                                        <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0, lineHeight: 1.4 }}>{level.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="pw-label" style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.7 }}>03. ISSUE DIAGNOSTICS</h3>
                            <Input 
                                placeholder="Describe the behavior, error codes, or physical damage..."
                                multiline 
                                rows={6} 
                                value={formData.issueDescription} 
                                onChange={(e) => setFormData({...formData, issueDescription: e.target.value})} 
                                required 
                            />
                        </section>

                        <div className="pw-flex pw-justify-end pw-gap-4 pw-mt-6">
                            <Button variant="ghost" type="button" onClick={() => navigate(-1)} style={{ padding: '1rem 2rem' }}>Abort</Button>
                            <Button 
                                type="submit" 
                                loading={loading}
                                style={{ padding: '1rem 3rem', minWidth: '200px' }}
                            >
                                Dispatch Request
                            </Button>
                        </div>
                    </div>
                </form>

                <div className="stagger-item stagger-3" style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <p className="modern-subtitle" style={{ fontSize: '0.85rem' }}>
                        <IonIcon name="shield-checkmark-outline" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                        Encryption Active: All diagnostic data is transmitted via secure industrial-grade protocols.
                    </p>
                </div>
            </div>
        </PageWrapper>
    );
};
