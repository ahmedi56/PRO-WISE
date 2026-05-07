import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, PageHeader, Button, IonIcon } from '../../components/index';
import { InputField } from '../../components/ui/InputField';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';

const SKILL_OPTIONS = [
    'Smartphone Repair', 'Laptop Repair', 'Tablet Repair', 
    'Soldering', 'Micro-soldering', 'Data Recovery', 
    'Screen Replacement', 'Battery Service', 'Water Damage',
    'Console Repair', 'Audio/Visual', 'Appliances'
];

const CATEGORY_OPTIONS = [
    'Consumer Electronics', 'Industrial Machinery', 
    'Medical Equipment', 'Automotive Electronics',
    'Home Appliances', 'IT Infrastructure'
];

export const TechnicianApplicationPage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        headline: '',
        bio: '',
        skills: [] as string[],
        experienceYears: 1,
        experienceStartDate: '',
        city: '',
        governorate: '',
        phone: '',
        whatsapp: '',
        serviceCategories: [] as string[],
        cvLink: '',
        latitude: null as number | null,
        longitude: null as number | null
    });

    useEffect(() => {
        if (user?.technicianProfile) {
            setFormData({
                headline: user.technicianProfile.headline || '',
                bio: user.technicianProfile.bio || '',
                skills: user.technicianProfile.skills || [],
                experienceYears: user.technicianProfile.experienceYears || 1,
                experienceStartDate: user.technicianProfile.experienceStartDate || '',
                city: user.technicianProfile.city || '',
                governorate: user.technicianProfile.governorate || '',
                phone: user.technicianProfile.phone || user.phone || '',
                whatsapp: user.technicianProfile.whatsapp || '',
                serviceCategories: user.technicianProfile.serviceCategories || [],
                cvLink: user.technicianProfile.cvLink || '',
                latitude: user.technicianProfile.latitude || null,
                longitude: user.technicianProfile.longitude || null
            });
        }
    }, [user]);

    if (!user) return null;

    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const toggleSelection = (item: string, field: 'skills' | 'serviceCategories') => {
        setFormData(prev => {
            const current = prev[field];
            if (current.includes(item)) {
                return { ...prev, [field]: current.filter(i => i !== item) };
            } else {
                return { ...prev, [field]: [...current, item] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (formData.skills.length === 0) {
                setError('Please select at least one skill.');
                setLoading(false);
                return;
            }

            if (formData.serviceCategories.length === 0) {
                setError('Please select at least one service category.');
                setLoading(false);
                return;
            }

            await authService.requestTechnicianUpgrade(formData);
            navigate('/profile');
            window.location.reload();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to submit application.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper maxWidth="800px">
            <PageHeader 
                title="Technician Onboarding" 
                subtitle="Join the PRO-WISE expert network" 
                backTo="/profile"
            />

            <div className="card glass" style={{ padding: '2.5rem' }}>
                <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                    <div className="icon-box" style={{ margin: '0 auto 1.5rem' }}>
                        <IonIcon name="construct-outline" />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)' }}>Professional Profile</h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
                        Complete your technical profile to access the operator dashboard.
                    </p>
                </div>

                {error && (
                    <div className="alert alert-error" style={{ marginBottom: '2rem' }}>
                        <IonIcon name="alert-circle-outline" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <section>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Identify</h4>
                        <InputField 
                            id="headline"
                            name="headline"
                            label="Professional Headline"
                            placeholder="e.g. Master Microsoldering Technician"
                            value={formData.headline}
                            onChange={handleChange}
                            required
                        />
                    </section>

                    <section>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Expertise & Experience</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <InputField 
                                id="experienceYears"
                                name="experienceYears"
                                label="Total Years"
                                type="number"
                                min="0"
                                value={formData.experienceYears}
                                onChange={handleChange}
                                required
                            />
                            <InputField 
                                id="experienceStartDate"
                                name="experienceStartDate"
                                label="Career Start Date"
                                type="date"
                                value={formData.experienceStartDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <label className="label">Primary Skills</label>
                            <div className="chip-selection">
                                {SKILL_OPTIONS.map(skill => (
                                    <button
                                        key={skill}
                                        type="button"
                                        onClick={() => toggleSelection(skill, 'skills')}
                                        className={`chip ${formData.skills.includes(skill) ? 'active' : ''}`}
                                    >
                                        {skill}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginTop: '1.5rem' }}>
                            <label className="label">Service Categories</label>
                            <div className="chip-selection">
                                {CATEGORY_OPTIONS.map(cat => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => toggleSelection(cat, 'serviceCategories')}
                                        className={`chip ${formData.serviceCategories.includes(cat) ? 'active-secondary' : ''}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Location & Contact</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                            <InputField 
                                id="governorate"
                                name="governorate"
                                label="Governorate"
                                placeholder="e.g. Cairo"
                                value={formData.governorate}
                                onChange={handleChange}
                                required
                            />
                            <InputField 
                                id="city"
                                name="city"
                                label="City"
                                placeholder="e.g. Maadi"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        
                        <div style={{ padding: '1rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <h5 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-strong)' }}>Map Coordinates</h5>
                                    <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                        {formData.latitude ? `Location Captured: ${formData.latitude.toFixed(4)}, ${formData.longitude?.toFixed(4)}` : 'Capture your workshop coordinates for the map'}
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
                                                setError('Failed to detect location. Please ensure location permissions are enabled.');
                                            });
                                        }
                                    }}
                                >
                                    <IonIcon name="navigate-outline" style={{ marginRight: '8px' }} />
                                    {formData.latitude ? 'Location Updated' : 'Detect My Location'}
                                </Button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <InputField 
                                id="phone"
                                name="phone"
                                label="Direct Phone"
                                icon="call-outline"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                            <InputField 
                                id="whatsapp"
                                name="whatsapp"
                                label="WhatsApp Business"
                                icon="logo-whatsapp"
                                value={formData.whatsapp}
                                onChange={handleChange}
                            />
                        </div>
                    </section>

                    <section>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Documentation</h4>
                        <InputField 
                            id="cvLink"
                            name="cvLink"
                            label="CV / Portfolio Link"
                            icon="link-outline"
                            placeholder="Link to your Google Drive CV or LinkedIn profile"
                            value={formData.cvLink}
                            onChange={handleChange}
                            required
                        />
                        <InputField 
                            id="bio"
                            name="bio"
                            label="Short Professional Bio"
                            placeholder="Describe your specialization..."
                            textArea
                            value={formData.bio}
                            onChange={handleChange}
                            required
                        />
                    </section>

                    <div style={{ marginTop: '1rem' }}>
                        <Button type="submit" fullWidth loading={loading}>
                            Finalize Technician Profile
                        </Button>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
};
