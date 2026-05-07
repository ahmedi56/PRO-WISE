import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, PageHeader, Button, IonIcon } from '../../components/index';
import { InputField } from '../../components/ui/InputField';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/technician-application.css';

export const TechnicianApplicationPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [step, setStep] = useState(1);
    const [locating, setLocating] = useState(false);

    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        city: '',
        governorate: '',
        phone: '',
        email: '',
        latitude: null as number | null,
        longitude: null as number | null,
        specializations: [] as any[],
        certifications: [] as any[],
        serviceRadiusKm: 20,
        emergencyAvailable: false
    });

    const [currentSpec, setCurrentSpec] = useState({ name: '', skillLevel: 'Intermediate', yearsExperience: 1 });
    const [currentCert, setCurrentCert] = useState({ title: '', organization: '', verificationUrl: '' });

    useEffect(() => {
        if (user?.technicianProfile) {
            setFormData({
                headline: user.technicianProfile.headline || '',
                bio: user.technicianProfile.bio || '',
                city: user.technicianProfile.city || '',
                governorate: user.technicianProfile.governorate || '',
                phone: user.technicianProfile.phone || user.phone || '',
                email: user.technicianProfile.email || user.email || '',
                latitude: user.technicianProfile.latitude || null,
                longitude: user.technicianProfile.longitude || null,
                specializations: user.technicianProfile.specializations || [],
                certifications: user.technicianProfile.certifications || [],
                serviceRadiusKm: user.technicianProfile.serviceRadiusKm || 20,
                emergencyAvailable: user.technicianProfile.emergencyAvailable || false
            });
        } else if (user) {
            setFormData(prev => ({ ...prev, email: user.email || '', phone: user.phone || '' }));
        }
    }, [user]);

    if (!user) return null;

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const captureLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            return;
        }

        setLocating(true);
        setError('');
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setFormData(prev => ({
                    ...prev,
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                }));
                setLocating(false);
            },
            (err) => {
                setLocating(false);
                console.error('Geolocation Error:', err);
                if (err.code === 1) {
                    setError('Location permission denied. Please allow location access in your browser settings.');
                } else if (err.code === 2) {
                    setError('Position unavailable. This could be due to a poor satellite signal or location services being disabled on your device.');
                } else if (err.code === 3) {
                    setError('Location request timed out. Please try again or enter your coordinates manually.');
                } else {
                    setError(`Geolocation Error: ${err.message || 'Unknown error'}`);
                }
            },
            options
        );
    };

    const addSpecialization = () => {
        if (!currentSpec.name) return;
        setFormData(prev => ({ ...prev, specializations: [...prev.specializations, currentSpec] }));
        setCurrentSpec({ name: '', skillLevel: 'Intermediate', yearsExperience: 1 });
    };

    const removeSpecialization = (index: number) => {
        setFormData(prev => ({ ...prev, specializations: prev.specializations.filter((_, i) => i !== index) }));
    };

    const addCertification = () => {
        if (!currentCert.title || !currentCert.organization) return;
        setFormData(prev => ({ ...prev, certifications: [...prev.certifications, currentCert] }));
        setCurrentCert({ title: '', organization: '', verificationUrl: '' });
    };

    const removeCertification = (index: number) => {
        setFormData(prev => ({ ...prev, certifications: prev.certifications.filter((_, i) => i !== index) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (step < 4) {
            if (step === 2 && formData.specializations.length === 0) {
                setError('Please add at least one specialization.');
                return;
            }
            if (step === 1 && (!formData.latitude || !formData.longitude)) {
                setError('Please capture your workshop location for the expert map.');
                return;
            }
            setStep(step + 1);
            return;
        }

        setLoading(true);
        try {
            await authService.requestTechnicianUpgrade(formData);
            navigate('/profile');
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || err.message || 'Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { id: 1, title: 'Identity & Location', subtitle: 'Where do you operate?' },
        { id: 2, title: 'Expertise', subtitle: 'What are your core skills?' },
        { id: 3, title: 'Credentials', subtitle: 'Upload certifications' },
        { id: 4, title: 'Availability', subtitle: 'Final service settings' }
    ];

    return (
        <PageWrapper maxWidth="900px">
            <div className="application-wizard">
                <PageHeader title="Expert Verification" subtitle="Join the professional PRO-WISE network" backTo="/profile" />

                <div className="wizard-card">
                    <div className="wizard-progress">
                        {steps.map(s => (
                            <div key={s.id} className={`progress-step ${step === s.id ? 'active' : step > s.id ? 'completed' : ''}`}>
                                {step > s.id ? <IonIcon name="checkmark" /> : s.id}
                            </div>
                        ))}
                    </div>

                    <div className="step-header">
                        <h2 className="step-title">{steps[step - 1].title}</h2>
                        <p className="step-subtitle">{steps[step - 1].subtitle}</p>
                    </div>

                    {error && (
                        <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
                            <IonIcon name="alert-circle-outline" /><span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {step === 1 && (
                            <div className="field-section">
                                <InputField id="headline" name="headline" label="Professional Headline" placeholder="e.g. Master Microsoldering Technician" value={formData.headline} onChange={handleChange} required />
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <InputField id="phone" name="phone" label="Phone" value={formData.phone} onChange={handleChange} required />
                                    <InputField id="email" name="email" label="Public Email" value={formData.email} onChange={handleChange} required />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <InputField id="governorate" name="governorate" label="Governorate" value={formData.governorate} onChange={handleChange} required />
                                    <InputField id="city" name="city" label="City" value={formData.city} onChange={handleChange} required />
                                </div>
                                
                                <div className={`location-box ${formData.latitude ? 'active' : ''}`}>
                                    <div className="location-info">
                                        <h5>Workshop Geolocation</h5>
                                        <p>{locating ? 'Searching for satellites...' : formData.latitude ? `Position Captured: ${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'Required for Discovery Map'}</p>
                                    </div>
                                    <Button type="button" size="sm" variant={formData.latitude ? 'success' : 'secondary'} onClick={captureLocation} loading={locating}>
                                        <IonIcon name="navigate-outline" style={{ marginRight: '8px' }} />
                                        {formData.latitude ? 'Refresh Position' : 'Capture Location'}
                                    </Button>
                                </div>
                                <InputField id="bio" name="bio" label="Bio" textArea value={formData.bio} onChange={handleChange} required />
                            </div>
                        )}

                        {step === 2 && (
                            <div className="field-section">
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                                    <InputField id="specName" label="Skill" placeholder="Repair" value={currentSpec.name} onChange={(e: any) => setCurrentSpec({...currentSpec, name: e.target.value})} />
                                    <InputField id="specLevel" label="Level" value={currentSpec.skillLevel} onChange={(e: any) => setCurrentSpec({...currentSpec, skillLevel: e.target.value})} />
                                    <InputField id="specYears" label="Years" type="number" value={currentSpec.yearsExperience} onChange={(e: any) => setCurrentSpec({...currentSpec, yearsExperience: parseInt(e.target.value)})} />
                                    <Button type="button" onClick={addSpecialization} variant="secondary" style={{ marginBottom: '4px' }}><IonIcon name="add" /></Button>
                                </div>
                                <div className="spec-list">
                                    {formData.specializations.map((spec, i) => (
                                        <div key={i} className="item-row">
                                            <div className="item-content">
                                                <strong>{spec.name}</strong>
                                                <span>{spec.skillLevel} • {spec.yearsExperience} Years</span>
                                            </div>
                                            <button type="button" onClick={() => removeSpecialization(i)} className="remove-btn"><IonIcon name="trash-outline" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="field-section">
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 2fr auto', gap: '1rem', alignItems: 'end' }}>
                                    <InputField id="certTitle" label="Title" value={currentCert.title} onChange={(e: any) => setCurrentCert({...currentCert, title: e.target.value})} />
                                    <InputField id="certOrg" label="Organization" value={currentCert.organization} onChange={(e: any) => setCurrentCert({...currentCert, organization: e.target.value})} />
                                    <InputField id="certUrl" label="Link" placeholder="https://" value={currentCert.verificationUrl} onChange={(e: any) => setCurrentCert({...currentCert, verificationUrl: e.target.value})} />
                                    <Button type="button" onClick={addCertification} variant="secondary" style={{ marginBottom: '4px' }}><IonIcon name="add" /></Button>
                                </div>
                                <div className="cert-list">
                                    {formData.certifications.length === 0 && <p style={{ textAlign: 'center', color: 'var(--wiz-text-light)' }}>No certifications added yet.</p>}
                                    {formData.certifications.map((cert, i) => (
                                        <div key={i} className="item-row">
                                            <div className="item-content">
                                                <strong>{cert.title}</strong>
                                                <span>{cert.organization}</span>
                                            </div>
                                            <button type="button" onClick={() => removeCertification(i)} className="remove-btn"><IonIcon name="trash-outline" /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="field-section">
                                <InputField id="serviceRadius" name="serviceRadiusKm" label="Service Radius (km)" type="number" value={formData.serviceRadiusKm} onChange={handleChange} required />
                                <label className="emergency-toggle">
                                    <input type="checkbox" name="emergencyAvailable" checked={formData.emergencyAvailable} onChange={handleChange} />
                                    <div className="item-content">
                                        <strong style={{ color: '#ef4444' }}>Available for Emergency 24/7 Calls</strong>
                                        <span>Your profile will be highlighted in red for urgent repair requests.</span>
                                    </div>
                                </label>
                            </div>
                        )}

                        <div className="wizard-footer">
                            {step > 1 && <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} fullWidth>Previous Step</Button>}
                            <Button type="submit" fullWidth loading={loading}>
                                {step < 4 ? 'Continue' : 'Submit Application'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </PageWrapper>
    );
};
