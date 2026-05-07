import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageWrapper, Button, IonIcon, Badge } from '../../components/index';
import { Input } from '../../components/ui/Input';
import { maintenanceService } from '../../services/maintenanceService';
import { authService } from '../../services/authService';
import '../../styles/home-page.css';

export const ServiceRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const techId = searchParams.get('techId');

    const [technician, setTechnician] = useState<any>(null);
    const [formData, setFormData] = useState({
        productName: '',
        category: 'Smartphone',
        serviceType: 'Repair',
        issueDescription: '',
        urgency: 'low',
        techId: techId || null
    });
    
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (techId) {
            authService.getOne(techId).then(data => setTechnician(data)).catch(console.error);
        }
    }, [techId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await maintenanceService.createRequest(formData);
            setSubmitted(true);
            setTimeout(() => navigate('/profile'), 2500);
        } catch (err) {
            console.error(err);
            alert('Terminal Error: Service request transmission failed.');
        } finally {
            setLoading(false);
        }
    };

    const urgencyLevels = [
        { id: 'low', label: 'Routine', icon: 'calendar-outline', color: '#10b981', desc: 'Maintenance' },
        { id: 'medium', label: 'Priority', icon: 'flash-outline', color: '#f59e0b', desc: 'Functional issues' },
        { id: 'high', label: 'Critical', icon: 'alert-circle-outline', color: '#ef4444', desc: 'System Failure' },
    ];

    const serviceTypes = [
        { id: 'Repair', icon: 'hammer-outline' },
        { id: 'Maintenance', icon: 'construct-outline' },
        { id: 'Diagnostic', icon: 'scan-outline' },
        { id: 'Installation', icon: 'settings-outline' }
    ];

    const categories = ['Smartphone', 'Laptop', 'Industrial', 'Networking', 'Smart Home', 'Other'];

    if (submitted) {
        return (
            <PageWrapper>
                <div className="pw-flex-col pw-items-center pw-justify-center" style={{ minHeight: '80vh', textAlign: 'center' }}>
                    <div className="success-check-anim" style={{ marginBottom: '2rem' }}>
                        <IonIcon name="checkmark-circle" style={{ fontSize: '5rem', color: 'var(--color-success)' }} />
                    </div>
                    <h1 className="modern-h1" style={{ fontSize: '3rem', marginBottom: '1rem' }}>Request Logged</h1>
                    <p className="modern-subtitle" style={{ maxWidth: '500px' }}>Your service request has been encrypted and dispatched to the maintenance network. A technician will acknowledge receipt shortly.</p>
                    <div className="loading-bar-container" style={{ width: '200px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '2rem', overflow: 'hidden' }}>
                        <div className="loading-bar-fill" style={{ width: '100%', height: '100%', background: 'var(--color-primary)', animation: 'shrink 2.5s linear forwards' }} />
                    </div>
                </div>
                <style>{`
                    @keyframes shrink { from { width: 100%; } to { width: 0%; } }
                `}</style>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper maxWidth="1100px">
            <div className="service-request-container" style={{ padding: '4rem 1rem' }}>
                <div className="pw-grid pw-grid-cols-1 lg:pw-grid-cols-12 pw-gap-12">
                    
                    {/* Left Panel: Info & Technician Context */}
                    <div className="lg:pw-col-span-4">
                        <header style={{ marginBottom: '3rem' }}>
                            <div className="pw-flex pw-items-center pw-gap-3 pw-mb-6">
                                <div className="icon-box" style={{ background: 'var(--color-primary)', color: 'white', borderRadius: '12px' }}>
                                    <IonIcon name="construct" />
                                </div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em' }}>SERVICE TERMINAL</h2>
                            </div>
                            <h1 className="modern-h2" style={{ fontSize: '2.5rem', lineHeight: 1.1, marginBottom: '1.5rem' }}>Open a New Case</h1>
                            <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Initialize your technical support request. Provide diagnostic details to ensure rapid resolution.</p>
                        </header>

                        {technician && (
                            <div className="card glass" style={{ padding: '1.5rem', borderLeft: '4px solid var(--color-primary)' }}>
                                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '0.1em' }}>Target Technician</p>
                                <div className="pw-flex pw-items-center pw-gap-4">
                                    <img 
                                        src={technician.avatar || `https://ui-avatars.com/api/?name=${technician.name}&background=6366f1&color=fff`} 
                                        style={{ width: '50px', height: '50px', borderRadius: '12px', objectFit: 'cover' }} 
                                        alt={technician.name}
                                    />
                                    <div>
                                        <h4 style={{ margin: 0, fontWeight: 700 }}>{technician.name}</h4>
                                        <div className="pw-flex pw-items-center pw-gap-2">
                                            <Badge tone="success">Verified Expert</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!technician && (
                            <div className="card glass" style={{ padding: '1.5rem', opacity: 0.8 }}>
                                <div className="pw-flex pw-gap-3">
                                    <IonIcon name="sparkles" style={{ color: 'var(--color-primary)' }} />
                                    <p style={{ fontSize: '0.85rem', margin: 0 }}><strong>AI-Powered Routing:</strong> Your request will be automatically matched to the most qualified nearby technician.</p>
                                </div>
                            </div>
                        )}

                        <div style={{ marginTop: '3rem', padding: '1.5rem', border: '1px dashed var(--color-border)', borderRadius: '1rem' }}>
                            <div className="pw-flex pw-items-center pw-gap-2 pw-mb-2">
                                <IonIcon name="shield-checkmark" style={{ color: 'var(--color-success)' }} />
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Security Protocol</span>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>End-to-end encrypted diagnostic data transmission active.</p>
                        </div>
                    </div>

                    {/* Right Panel: The Form */}
                    <div className="lg:pw-col-span-8">
                        <form onSubmit={handleSubmit} className="card glass-premium" style={{ padding: '3rem' }}>
                            <div className="pw-grid pw-grid-cols-1 pw-gap-10">
                                
                                <section>
                                    <div className="form-step-header">
                                        <span className="step-num">01</span>
                                        <h3 className="pw-label">Hardware Specifications</h3>
                                    </div>
                                    <div className="pw-grid pw-grid-cols-1 md:pw-grid-cols-2 pw-gap-4">
                                        <Input 
                                            label="Model Name / ID"
                                            placeholder="e.g. MacBook Pro M3, iPhone 15"
                                            value={formData.productName} 
                                            onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                                            required 
                                        />
                                        <div className="input-group">
                                            <label className="label">Category</label>
                                            <select 
                                                className="input" 
                                                value={formData.category}
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            >
                                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <div className="form-step-header">
                                        <span className="step-num">02</span>
                                        <h3 className="pw-label">Service Classification</h3>
                                    </div>
                                    <div className="pw-grid pw-grid-cols-2 md:pw-grid-cols-4 pw-gap-3">
                                        {serviceTypes.map(type => (
                                            <button 
                                                key={type.id}
                                                type="button"
                                                className={`service-type-btn ${formData.serviceType === type.id ? 'active' : ''}`}
                                                onClick={() => setFormData({...formData, serviceType: type.id})}
                                            >
                                                <IonIcon name={type.icon} />
                                                <span>{type.id}</span>
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <div className="form-step-header">
                                        <span className="step-num">03</span>
                                        <h3 className="pw-label">Priority Protocol</h3>
                                    </div>
                                    <div className="pw-grid pw-grid-cols-1 md:pw-grid-cols-3 pw-gap-4">
                                        {urgencyLevels.map(level => (
                                            <div 
                                                key={level.id}
                                                className={`urgency-card-v2 ${formData.urgency === level.id ? 'active' : ''}`}
                                                onClick={() => setFormData({...formData, urgency: level.id})}
                                                style={{ '--urgency-color': level.color } as any}
                                            >
                                                <div className="urgency-icon">
                                                    <IonIcon name={level.icon} />
                                                </div>
                                                <div className="urgency-info">
                                                    <strong>{level.label}</strong>
                                                    <span>{level.desc}</span>
                                                </div>
                                                <div className="urgency-radio">
                                                    <div className="radio-dot" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                <section>
                                    <div className="form-step-header">
                                        <span className="step-num">04</span>
                                        <h3 className="pw-label">Diagnostic Summary</h3>
                                    </div>
                                    <Input 
                                        placeholder="Detailed description of the fault, symptoms, or requested maintenance..."
                                        multiline 
                                        rows={5} 
                                        value={formData.issueDescription} 
                                        onChange={(e) => setFormData({...formData, issueDescription: e.target.value})} 
                                        required 
                                    />
                                </section>

                                <div className="pw-flex pw-items-center pw-justify-between pw-pt-6" style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel Request</Button>
                                    <Button 
                                        type="submit" 
                                        loading={loading}
                                        style={{ padding: '1rem 3rem', height: 'auto', fontSize: '1.1rem' }}
                                    >
                                        Dispatch Order
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <style>{`
                .glass-premium {
                    background: rgba(255, 255, 255, 0.03);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                }
                
                .form-step-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 1.5rem;
                }
                
                .step-num {
                    font-size: 0.75rem;
                    font-weight: 900;
                    background: var(--color-primary);
                    color: white;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 6px;
                }
                
                .service-type-btn {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1.5rem 1rem;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    color: var(--color-text-muted);
                }
                
                .service-type-btn ion-icon { font-size: 1.5rem; }
                .service-type-btn span { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
                
                .service-type-btn:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); }
                .service-type-btn.active {
                    background: var(--color-primary-subtle);
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                }
                
                .urgency-card-v2 {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    padding: 1.25rem;
                    background: rgba(255,255,255,0.02);
                    border: 1px solid rgba(255,255,255,0.05);
                    border-radius: 1rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                }
                
                .urgency-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 10px;
                    background: rgba(255,255,255,0.03);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    color: var(--urgency-color);
                }
                
                .urgency-info { display: flex; flex-direction: column; flex: 1; }
                .urgency-info strong { font-size: 0.9rem; font-weight: 700; }
                .urgency-info span { font-size: 0.7rem; opacity: 0.5; }
                
                .urgency-radio {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 2px solid rgba(255,255,255,0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .urgency-card-v2.active {
                    background: rgba(255,255,255,0.05);
                    border-color: var(--urgency-color);
                }
                
                .urgency-card-v2.active .urgency-radio { border-color: var(--urgency-color); }
                .urgency-card-v2.active .radio-dot {
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    background: var(--urgency-color);
                }
            `}</style>
        </PageWrapper>
    );
};
