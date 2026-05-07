import React, { useState, useEffect } from 'react';
import { PageWrapper, PageHeader, Button, IonIcon, Section, Badge } from '../../components/index';
import { InputField } from '../../components/ui/InputField';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import '../../styles/technician-application.css';

export const TechnicianProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        city: '',
        governorate: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        preferredContactMethod: 'phone',
        latitude: null as number | null,
        longitude: null as number | null,
        specializations: [] as any[],
        certifications: [] as any[],
        serviceRadiusKm: 20,
        availability: {
            weekdays: true,
            weekends: false,
            morning: true,
            afternoon: true,
            evening: false,
            emergencyAvailable: false
        }
    });

    const [currentSpec, setCurrentSpec] = useState({ name: '', skillLevel: 'Intermediate', yearsExperience: 1 });
    const [currentCert, setCurrentCert] = useState({ title: '', organization: '', verificationUrl: '' });

    useEffect(() => {
        if (user?.technicianProfile) {
            const profile = user.technicianProfile;
            setFormData({
                headline: profile.headline || '',
                bio: profile.bio || '',
                city: profile.city || '',
                governorate: profile.governorate || '',
                phone: profile.phone || user.phone || '',
                whatsapp: profile.whatsapp || '',
                email: profile.email || user.email || '',
                address: profile.address || '',
                preferredContactMethod: profile.preferredContactMethod || 'phone',
                latitude: profile.latitude || null,
                longitude: profile.longitude || null,
                specializations: profile.specializations || [],
                certifications: profile.certifications || [],
                serviceRadiusKm: profile.serviceRadiusKm || 20,
                availability: profile.availability || {
                    weekdays: true,
                    weekends: false,
                    morning: true,
                    afternoon: true,
                    evening: false,
                    emergencyAvailable: false
                }
            });
        }
    }, [user]);

    if (!user) return null;

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleToggleAvailability = (key: string) => {
        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [key as keyof typeof prev.availability]: !prev.availability[key as keyof typeof prev.availability]
            }
        }));
    };

    const addSpecialization = () => {
        if (!currentSpec.name) return;
        setFormData(prev => ({
            ...prev,
            specializations: [...prev.specializations, { ...currentSpec }]
        }));
        setCurrentSpec({ name: '', skillLevel: 'Intermediate', yearsExperience: 1 });
    };

    const removeSpecialization = (index: number) => {
        setFormData(prev => ({
            ...prev,
            specializations: prev.specializations.filter((_, i) => i !== index)
        }));
    };

    const addCertification = () => {
        if (!currentCert.title) return;
        setFormData(prev => ({
            ...prev,
            certifications: [...prev.certifications, { ...currentCert, verificationStatus: 'pending' }]
        }));
        setCurrentCert({ title: '', organization: '', verificationUrl: '' });
    };

    const removeCertification = (index: number) => {
        setFormData(prev => ({
            ...prev,
            certifications: prev.certifications.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await authService.updateTechnicianProfile(formData);
            setMessage('Profile updated successfully!');
            setTimeout(() => setMessage(''), 3000);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    if (!user.isTechnician || user.technicianStatus !== 'approved') {
        return (
            <PageWrapper>
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <IonIcon name="lock-closed-outline" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }} />
                    <h2>Access Restricted</h2>
                    <p>You must be an approved technician to manage your professional profile.</p>
                    <Button onClick={() => navigate('/profile')} style={{ marginTop: '1.5rem' }}>Back to Profile</Button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper maxWidth="1000px">
            <PageHeader 
                title="Professional Profile" 
                subtitle={`Verification Level: ${user.technicianProfile?.verificationLevel || 'Basic'}`}
                backTo="/technician-portal"
            />

            <form onSubmit={handleSubmit} className="tech-profile-form">
                {message && <div className="alert alert-success" style={{ marginBottom: '2rem' }}>{message}</div>}
                {error && <div className="alert alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}

                <div className="profile-layout-grid">
                    <div className="profile-main-column">
                        <Section title="Professional Identity">
                            <div className="card glass-card">
                                <InputField id="headline" name="headline" label="Professional Headline" placeholder="e.g. Expert Hardware Technician & Smartphone Repair" value={formData.headline} onChange={handleChange} required />
                                <InputField id="bio" name="bio" label="About Me" textArea placeholder="Describe your experience and services..." value={formData.bio} onChange={handleChange} required />
                                
                                <div className="subsection">
                                    <h4 className="modern-h4">Specializations</h4>
                                    <div className="spec-adder">
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem', marginBottom: '1rem' }}>
                                            <InputField id="new-spec-name" label="Specialization" value={currentSpec.name} onChange={(e) => setCurrentSpec({...currentSpec, name: e.target.value})} />
                                            <div className="input-group">
                                                <label className="label">Level</label>
                                                <select className="input" value={currentSpec.skillLevel} onChange={(e) => setCurrentSpec({...currentSpec, skillLevel: e.target.value})}>
                                                    <option>Beginner</option>
                                                    <option>Intermediate</option>
                                                    <option>Expert</option>
                                                    <option>Master</option>
                                                </select>
                                            </div>
                                            <InputField id="new-spec-years" label="Years" type="number" value={currentSpec.yearsExperience} onChange={(e) => setCurrentSpec({...currentSpec, yearsExperience: Number(e.target.value)})} />
                                        </div>
                                        <Button type="button" variant="secondary" onClick={addSpecialization} fullWidth>Add Specialization</Button>
                                    </div>

                                    <div className="spec-list" style={{ marginTop: '1rem' }}>
                                        {formData.specializations.map((s, i) => (
                                            <div key={i} className="spec-chip">
                                                <span><strong>{s.name}</strong> • {s.skillLevel} ({s.yearsExperience}y)</span>
                                                <button type="button" onClick={() => removeSpecialization(i)}><IonIcon name="close-outline" /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Section>

                        <Section title="Verified Credentials">
                            <div className="card glass-card">
                                <div className="cert-adder">
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                        <InputField id="new-cert-title" label="Certification Name" value={currentCert.title} onChange={(e) => setCurrentCert({...currentCert, title: e.target.value})} />
                                        <InputField id="new-cert-org" label="Issuing Organization" value={currentCert.organization} onChange={(e) => setCurrentCert({...currentCert, organization: e.target.value})} />
                                    </div>
                                    <InputField id="new-cert-url" label="Verification URL (Link to certificate/document)" value={currentCert.verificationUrl} onChange={(e) => setCurrentCert({...currentCert, verificationUrl: e.target.value})} />
                                    <Button type="button" variant="secondary" onClick={addCertification} fullWidth style={{ marginTop: '1rem' }}>Add Certificate</Button>
                                </div>

                                <div className="cert-list-manage" style={{ marginTop: '2rem' }}>
                                    {formData.certifications.map((c, i) => (
                                        <div key={i} className="cert-item-card">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div>
                                                    <h5 style={{ margin: 0, fontWeight: 700 }}>{c.title}</h5>
                                                    <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{c.organization}</p>
                                                    <Badge tone={c.verificationStatus === 'verified' ? 'success' : c.verificationStatus === 'rejected' ? 'danger' : 'warning'}>
                                                        {c.verificationStatus || 'pending'}
                                                    </Badge>
                                                </div>
                                                <button type="button" className="btn-icon-danger" onClick={() => removeCertification(i)}><IonIcon name="trash-outline" /></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Section>
                    </div>

                    <div className="profile-side-column">
                        <Section title="Service & Location">
                            <div className="card glass-card">
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <InputField id="governorate" name="governorate" label="Governorate" value={formData.governorate} onChange={handleChange} />
                                    <InputField id="city" name="city" label="City" value={formData.city} onChange={handleChange} />
                                </div>
                                <InputField id="serviceRadiusKm" name="serviceRadiusKm" label="Service Radius (KM)" type="number" value={formData.serviceRadiusKm} onChange={handleChange} />
                                
                                <div className="location-picker-mini" style={{ padding: '1rem', background: 'rgba(0,0,0,0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: 600 }}>Map Coordinates</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formData.latitude ? `${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'Not set'}</span>
                                        <Button type="button" size="sm" onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition((pos) => {
                                                    setFormData(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                                                });
                                            }
                                        }}>Update</Button>
                                    </div>
                                </div>

                                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                    <input type="checkbox" name="emergencyAvailable" checked={formData.availability.emergencyAvailable} onChange={() => handleToggleAvailability('emergencyAvailable')} />
                                    <span style={{ fontWeight: 600, color: 'var(--color-danger)' }}>Available for 24/7 Emergencies</span>
                                </label>
                            </div>
                        </Section>

                        <Section title="Contact Info">
                            <div className="card glass-card">
                                <InputField id="phone" name="phone" label="Phone" value={formData.phone} onChange={handleChange} />
                                <InputField id="whatsapp" name="whatsapp" label="WhatsApp" value={formData.whatsapp} onChange={handleChange} />
                                <InputField id="email" name="email" label="Contact Email" value={formData.email} onChange={handleChange} />
                                <div className="input-group">
                                    <label className="label">Preferred Method</label>
                                    <select name="preferredContactMethod" value={formData.preferredContactMethod} onChange={handleChange} className="input">
                                        <option value="phone">Phone</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="email">Email</option>
                                    </select>
                                </div>
                            </div>
                        </Section>

                        <Section title="Work Slots">
                            <div className="card glass-card">
                                <div className="availability-grid">
                                    {['weekdays', 'weekends', 'morning', 'afternoon', 'evening'].map(slot => (
                                        <button key={slot} type="button" className={`slot-btn ${formData.availability[slot as keyof typeof formData.availability] ? 'active' : ''}`} onClick={() => handleToggleAvailability(slot)}>
                                            {slot.charAt(0).toUpperCase() + slot.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </Section>

                        <Button type="submit" loading={loading} fullWidth size="lg" style={{ marginTop: '2rem' }}>Save All Changes</Button>
                    </div>
                </div>
            </form>
        </PageWrapper>
    );
};
