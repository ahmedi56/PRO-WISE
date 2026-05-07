import React, { useState } from 'react';
import { PageWrapper, PageHeader, Button, IonIcon, Section } from '../../components/index';
import { InputField } from '../../components/ui/InputField';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';

export const TechnicianProfilePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    if (!user) return null;

    const profile = user.technicianProfile || {};

    const [formData, setFormData] = useState({
        headline: profile.headline || '',
        bio: profile.bio || '',
        skills: profile.skills?.join(', ') || '',
        serviceCategories: profile.serviceCategories?.join(', ') || '',
        experienceYears: profile.experienceYears || 0,
        governorate: profile.governorate || '',
        city: profile.city || '',
        address: profile.address || '',
        phone: profile.phone || '',
        whatsapp: profile.whatsapp || '',
        email: profile.email || user.email || '',
        preferredContactMethod: profile.preferredContactMethod || 'phone',
        serviceRadiusKm: profile.serviceRadiusKm || 20,
        certifications: profile.certifications?.join(', ') || '',
        availability: profile.availability || {
            weekdays: true,
            weekends: false,
            morning: true,
            afternoon: true,
            evening: false,
            emergencyAvailable: false
        },
        latitude: profile.latitude || null,
        longitude: profile.longitude || null
    });

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleToggleAvailability = (key: string) => {
        setFormData(prev => ({
            ...prev,
            availability: {
                ...prev.availability,
                [key]: !prev.availability[key]
            }
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            const submissionData = {
                ...formData,
                skills: formData.skills.split(',').map((s: string) => s.trim()).filter((s: string) => s !== ''),
                serviceCategories: formData.serviceCategories.split(',').map((s: string) => s.trim()).filter((s: string) => s !== ''),
                certifications: formData.certifications.split(',').map((s: string) => s.trim()).filter((s: string) => s !== ''),
                experienceYears: Number(formData.experienceYears),
                serviceRadiusKm: Number(formData.serviceRadiusKm)
            };

            await authService.updateTechnicianProfile(submissionData);
            setMessage('Technician profile updated successfully!');
            // Refresh to update local user state
            setTimeout(() => window.location.reload(), 1500);
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
                    <p>You must be an approved technician to edit your professional profile.</p>
                    <Button onClick={() => navigate('/profile')} style={{ marginTop: '1.5rem' }}>Back to Profile</Button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper maxWidth="900px">
            <PageHeader 
                title="Technician Profile" 
                subtitle="Complete your professional information to attract more customers" 
                backTo="/technician-portal"
            />

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {message && (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', borderRadius: '12px', fontWeight: 600 }}>
                        {message}
                    </div>
                )}
                {error && (
                    <div style={{ padding: '1rem', backgroundColor: 'var(--color-error-light)', color: 'var(--color-error)', borderRadius: '12px', fontWeight: 600 }}>
                        {error}
                    </div>
                )}

                <Section title="Professional Identity">
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <InputField 
                            id="headline"
                            name="headline"
                            label="Professional Headline"
                            value={formData.headline}
                            onChange={handleChange}
                            required
                        />
                        <InputField 
                            id="bio"
                            name="bio"
                            label="Detailed Bio"
                            textArea
                            value={formData.bio}
                            onChange={handleChange}
                            required
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <InputField 
                                id="skills"
                                name="skills"
                                label="Skills (comma separated)"
                                value={formData.skills}
                                onChange={handleChange}
                            />
                            <InputField 
                                id="experienceYears"
                                name="experienceYears"
                                label="Years of Experience"
                                type="number"
                                value={formData.experienceYears}
                                onChange={handleChange}
                            />
                        </div>
                        <InputField 
                            id="certifications"
                            name="certifications"
                            label="Certifications (comma separated)"
                            value={formData.certifications}
                            onChange={handleChange}
                        />
                    </div>
                </Section>

                <Section title="Service & Location">
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <InputField 
                            id="serviceCategories"
                            name="serviceCategories"
                            label="Service Categories (comma separated)"
                            value={formData.serviceCategories}
                            onChange={handleChange}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <InputField id="governorate" name="governorate" label="Governorate" value={formData.governorate} onChange={handleChange} />
                            <InputField id="city" name="city" label="City" value={formData.city} onChange={handleChange} />
                            <InputField id="serviceRadiusKm" name="serviceRadiusKm" label="Radius (KM)" type="number" value={formData.serviceRadiusKm} onChange={handleChange} />
                        </div>
                        <InputField id="address" name="address" label="Full Address / Shop Location" value={formData.address} onChange={handleChange} />
                        
                        <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-strong)' }}>Map Position</h5>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {formData.latitude ? `Pin active: ${Number(formData.latitude).toFixed(4)}, ${Number(formData.longitude).toFixed(4)}` : 'Set your location for the public map'}
                                    </p>
                                </div>
                                <Button 
                                    type="button" 
                                    size="sm" 
                                    variant={formData.latitude ? 'success' : 'secondary'}
                                    onClick={() => {
                                        if (navigator.geolocation) {
                                            navigator.geolocation.getCurrentPosition((pos) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    latitude: pos.coords.latitude,
                                                    longitude: pos.coords.longitude
                                                }));
                                            }, (err) => {
                                                setError('Failed to detect location. Please check browser permissions.');
                                            });
                                        }
                                    }}
                                >
                                    <IonIcon name="navigate-outline" style={{ marginRight: '8px' }} />
                                    {formData.latitude ? 'Location Updated' : 'Detect My Location'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Contact Information">
                    <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <InputField id="phone" name="phone" label="Phone Number" value={formData.phone} onChange={handleChange} />
                            <InputField id="whatsapp" name="whatsapp" label="WhatsApp Number" value={formData.whatsapp} onChange={handleChange} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <InputField id="email" name="email" label="Contact Email" type="email" value={formData.email} onChange={handleChange} />
                            <div className="input-group">
                                <label className="label">Preferred Contact Method</label>
                                <select 
                                    name="preferredContactMethod" 
                                    value={formData.preferredContactMethod} 
                                    onChange={handleChange}
                                    className="input"
                                >
                                    <option value="phone">Phone</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="email">Email</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </Section>

                <Section title="Availability">
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-strong)' }}>Work Days</h4>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Button 
                                        type="button"
                                        size="sm" 
                                        variant={formData.availability.weekdays ? 'primary' : 'outline'} 
                                        onClick={() => handleToggleAvailability('weekdays')}
                                    >
                                        Weekdays
                                    </Button>
                                    <Button 
                                        type="button"
                                        size="sm" 
                                        variant={formData.availability.weekends ? 'primary' : 'outline'} 
                                        onClick={() => handleToggleAvailability('weekends')}
                                    >
                                        Weekends
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '1rem', color: 'var(--color-text-strong)' }}>Time Slots</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    {['morning', 'afternoon', 'evening', 'emergencyAvailable'].map(slot => (
                                        <Button 
                                            key={slot}
                                            type="button"
                                            size="sm" 
                                            variant={formData.availability[slot] ? 'secondary' : 'outline'} 
                                            onClick={() => handleToggleAvailability(slot)}
                                        >
                                            {slot === 'emergencyAvailable' ? 'Emergency' : slot.charAt(0).toUpperCase() + slot.slice(1)}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '4rem' }}>
                    <Button type="submit" loading={loading} style={{ flex: 1 }}>Save Profile</Button>
                    <Button variant="ghost" onClick={() => navigate('/technician-portal')}>Cancel</Button>
                </div>
            </form>
        </PageWrapper>
    );
};
