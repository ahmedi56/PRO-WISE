import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper, Spinner, EmptyState, IonIcon, Button, Badge, Section } from '../../components/index';
import { authService } from '../../services/authService';
import '../../styles/technician-application.css'; // Reuse some layout styles

export const ExpertProfilePage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [technician, setTechnician] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            try {
                // Use public expert endpoint instead of restricted user endpoint
                const data = await authService.getExpertProfile(id); 
                setTechnician(data);
            } catch (err: any) {
                setError('Expert profile not found.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return <PageWrapper><Spinner size="lg" /></PageWrapper>;
    if (error || !technician) return <PageWrapper><EmptyState icon="person-outline" title="Expert Not Found" description={error || 'Profile unavailable'} /></PageWrapper>;

    const profile = technician.technicianProfile || {};

    return (
        <PageWrapper maxWidth="1000px">
            <div className="expert-profile-view">
                <Button variant="ghost" onClick={() => navigate('/technicians')} style={{ marginBottom: '2rem' }}>
                    <IonIcon name="arrow-back-outline" style={{ marginRight: '8px' }} /> Back to Directory
                </Button>

                <div className="profile-header-card glass" style={{ padding: '2.5rem', borderRadius: '1.5rem', display: 'flex', gap: '2.5rem', marginBottom: '2rem' }}>
                    <div className="profile-avatar-large" style={{ width: '120px', height: '120px', borderRadius: '1.5rem', backgroundColor: 'var(--color-surface-variant)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', fontWeight: 800, color: 'var(--color-primary)', border: '2px solid var(--color-border)' }}>
                        {technician.avatar ? <img src={technician.avatar} alt={technician.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : technician.name[0]}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h1 style={{ margin: 0, fontSize: '2rem' }}>{technician.name}</h1>
                            {profile.verificationLevel !== 'Basic' && <Badge tone="success">Verified {profile.verificationLevel}</Badge>}
                            {profile.topExpertBadge && <Badge style={{ backgroundColor: 'gold', color: '#000' }}>⭐ Top Expert</Badge>}
                        </div>
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1rem' }}>{profile.headline}</p>
                        
                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                            <span><IonIcon name="location-outline" /> {profile.city}, {profile.governorate}</span>
                            <span><IonIcon name="calendar-outline" /> Joined {new Date(technician.createdAt).toLocaleDateString()}</span>
                            <span><IonIcon name="star" style={{ color: 'var(--color-warning)' }} /> {profile.averageRating.toFixed(1)} ({profile.completedJobs} jobs)</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <Button fullWidth onClick={() => navigate(`/service-request?techId=${technician.id}`)}>Book Maintenance</Button>
                        {profile.emergencyAvailable && (
                            <div style={{ textAlign: 'center', color: 'var(--color-danger)', fontWeight: 700, fontSize: '0.75rem', padding: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-sm)' }}>
                                🚨 24/7 EMERGENCY READY
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <Section title="Expert Bio">
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <p style={{ fontSize: '1.05rem', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{profile.bio || 'No bio provided.'}</p>
                            </div>
                        </Section>

                        <Section title="Verified Credentials">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {profile.certifications?.length > 0 ? profile.certifications.map((cert: any, i: number) => (
                                    <div key={i} className="card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: cert.verificationStatus === 'verified' ? '1px solid var(--color-success)' : '1px solid var(--color-border)' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '1rem' }}>{cert.title}</h4>
                                                {cert.verificationStatus === 'verified' && <IonIcon name="checkmark-circle" style={{ color: 'var(--color-success)' }} />}
                                            </div>
                                            <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>{cert.organization}</p>
                                        </div>
                                        {cert.verificationUrl && (
                                            <a href={cert.verificationUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                                                View Document ↗
                                            </a>
                                        )}
                                    </div>
                                )) : (
                                    <p style={{ color: 'var(--color-text-muted)' }}>No certifications listed.</p>
                                )}
                            </div>
                        </Section>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <Section title="Specializations">
                            <div className="card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {profile.specializations?.map((spec: any, i: number) => (
                                    <div key={i} style={{ padding: '0.5rem 0.75rem', background: 'var(--color-surface-variant)', borderRadius: '0.75rem', fontSize: '0.85rem', width: '100%' }}>
                                        <div style={{ fontWeight: 700 }}>{spec.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{spec.skillLevel} • {spec.yearsExperience}y Experience</div>
                                    </div>
                                ))}
                            </div>
                        </Section>

                        <Section title="Service Availability">
                            <div className="card" style={{ padding: '1.25rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span>Service Radius</span>
                                        <span style={{ fontWeight: 700 }}>{profile.serviceRadiusKm} KM</span>
                                    </div>
                                    <div style={{ height: '1px', background: 'var(--color-border)' }} />
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {profile.availability?.weekdays && <Badge tone="primary">Weekdays</Badge>}
                                        {profile.availability?.weekends && <Badge tone="primary">Weekends</Badge>}
                                        {profile.availability?.morning && <Badge tone="neutral">Morning</Badge>}
                                        {profile.availability?.afternoon && <Badge tone="neutral">Afternoon</Badge>}
                                        {profile.availability?.evening && <Badge tone="neutral">Evening</Badge>}
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};
