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
    const portfolio = profile.portfolioImages || [];

    return (
        <PageWrapper maxWidth="1200px">
            <div className="expert-profile-view">
                <Button variant="ghost" onClick={() => navigate('/technicians')} style={{ marginBottom: '2rem' }}>
                    <IonIcon name="arrow-back-outline" style={{ marginRight: '8px' }} /> Back to Directory
                </Button>

                <div className="profile-hero glass" style={{ 
                    padding: '3rem', 
                    borderRadius: '2rem', 
                    display: 'flex', 
                    flexWrap: 'wrap',
                    gap: '3rem', 
                    marginBottom: '3rem',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Decorative Background Element */}
                    <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '300px', height: '300px', background: 'var(--color-primary)', filter: 'blur(150px)', opacity: 0.1, pointerEvents: 'none' }}></div>

                    <div className="profile-avatar-xl" style={{ 
                        width: '180px', 
                        height: '180px', 
                        borderRadius: '2rem', 
                        backgroundColor: 'var(--color-surface-variant)', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        fontSize: '4rem', 
                        fontWeight: 800, 
                        color: 'var(--color-primary)', 
                        border: '4px solid var(--color-border)',
                        boxShadow: 'var(--shadow-xl)',
                        flexShrink: 0
                    }}>
                        {technician.avatar ? <img src={technician.avatar} alt={technician.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} /> : technician.name[0]}
                    </div>
                    
                    <div style={{ flex: '1 1 400px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.75rem' }}>
                            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800 }}>{technician.name}</h1>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {profile.verificationLevel !== 'Basic' && <Badge tone="success">Verified {profile.verificationLevel}</Badge>}
                                {profile.topExpertBadge && <Badge style={{ backgroundColor: 'gold', color: '#000', fontWeight: 700 }}>⭐ Top Expert</Badge>}
                            </div>
                        </div>
                        <p style={{ fontSize: '1.25rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '1.5rem', letterSpacing: '-0.01em' }}>{profile.headline}</p>
                        
                        <div className="stats-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
                            <div className="stat-pill">
                                <span className="stat-label">Rating</span>
                                <span className="stat-value"><IonIcon name="star" style={{ color: '#f59e0b' }} /> {profile.averageRating.toFixed(1)}</span>
                            </div>
                            <div className="stat-pill">
                                <span className="stat-label">Experience</span>
                                <span className="stat-value">{profile.experienceYears || 0} Years</span>
                            </div>
                            <div className="stat-pill">
                                <span className="stat-label">Completed</span>
                                <span className="stat-value">{profile.completedJobs} Jobs</span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IonIcon name="location-outline" /> {profile.city}, {profile.governorate}</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IonIcon name="time-outline" /> Member since {new Date(technician.createdAt).getFullYear()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '240px' }}>
                        <Button fullWidth size="lg" onClick={() => navigate(`/service-request?techId=${technician.id}`)} style={{ height: '60px', fontSize: '1.1rem' }}>
                            Book This Expert
                        </Button>
                        <Button variant="ghost" fullWidth onClick={() => {
                            if (profile.phone) window.location.href = `tel:${profile.phone}`;
                        }}>
                            <IonIcon name="call-outline" style={{ marginRight: '8px' }} /> Call Technician
                        </Button>
                        {profile.emergencyAvailable && (
                            <div className="emergency-banner">
                                <span className="pulse-dot"></span>
                                24/7 EMERGENCY READY
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-content-grid">
                    <div className="main-info">
                        <Section title="Professional Biography">
                            <div className="card glass-card" style={{ padding: '2rem' }}>
                                <p style={{ fontSize: '1.1rem', lineHeight: '1.8', whiteSpace: 'pre-wrap', color: 'var(--color-text-strong)' }}>
                                    {profile.bio || 'This expert has not provided a detailed biography yet.'}
                                </p>
                            </div>
                        </Section>

                        {portfolio.length > 0 && (
                            <Section title="Work Portfolio">
                                <div className="portfolio-grid">
                                    {portfolio.map((img: string, i: number) => (
                                        <div key={i} className="portfolio-item glass" style={{ borderRadius: '1rem', overflow: 'hidden', height: '200px' }}>
                                            <img src={img} alt={`Work ${i+1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ))}
                                </div>
                            </Section>
                        )}

                        <Section title="Expertise & Skills">
                            <div className="card glass-card" style={{ padding: '2rem' }}>
                                <div className="skills-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                    {profile.specializations?.map((spec: any, i: number) => (
                                        <div key={i} className="skill-box">
                                            <div className="skill-name">{spec.name}</div>
                                            <div className="skill-meta">
                                                <Badge tone="neutral" size="sm">{spec.skillLevel}</Badge>
                                                <span>{spec.yearsExperience}y exp.</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Section>
                    </div>

                    <div className="sidebar-info">
                        <Section title="Verified Credentials">
                            <div className="credentials-list">
                                {profile.certifications?.length > 0 ? profile.certifications.map((cert: any, i: number) => (
                                    <div key={i} className="cert-card-v2 glass">
                                        <div className="cert-icon-wrapper">
                                            <IonIcon name="ribbon-outline" />
                                        </div>
                                        <div className="cert-info">
                                            <h4>{cert.title}</h4>
                                            <p>{cert.organization}</p>
                                            {cert.verificationStatus === 'verified' && <Badge tone="success" size="sm">Verified</Badge>}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="empty-badge">No verified certifications</div>
                                )}
                            </div>
                        </Section>

                        <Section title="Availability">
                            <div className="card glass-card" style={{ padding: '1.5rem' }}>
                                <div className="availability-summary">
                                    <div className="avail-row">
                                        <span>Service Radius</span>
                                        <Badge tone="primary">{profile.serviceRadiusKm} KM</Badge>
                                    </div>
                                    <div className="avail-divider"></div>
                                    <div className="days-grid">
                                        <div className={`day-chip ${profile.availability?.weekdays ? 'active' : ''}`}>Weekdays</div>
                                        <div className={`day-chip ${profile.availability?.weekends ? 'active' : ''}`}>Weekends</div>
                                    </div>
                                    <div className="slots-grid">
                                        <span className={profile.availability?.morning ? 'active' : ''}><IonIcon name="sunny-outline" /> Morning</span>
                                        <span className={profile.availability?.afternoon ? 'active' : ''}><IonIcon name="partly-sunny-outline" /> Afternoon</span>
                                        <span className={profile.availability?.evening ? 'active' : ''}><IonIcon name="moon-outline" /> Evening</span>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>
                </div>
            </div>

            <style>{`
                .expert-profile-view { padding-bottom: 5rem; }
                .profile-content-grid { display: grid; grid-template-columns: 1fr 380px; gap: 3rem; }
                
                .stat-pill { display: flex; flex-direction: column; }
                .stat-label { font-size: 0.75rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
                .stat-value { font-size: 1.25rem; font-weight: 800; color: var(--color-text-strong); display: flex; align-items: center; gap: 6px; }
                
                .emergency-banner {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    font-weight: 800;
                    font-size: 0.8rem;
                    border-radius: 12px;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                
                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse 1.5s infinite;
                }
                
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }

                .portfolio-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 1rem; }
                
                .skill-box {
                    padding: 1.25rem;
                    background: var(--color-surface-variant);
                    border-radius: 1rem;
                    border: 1px solid var(--color-border);
                }
                .skill-name { font-weight: 700; font-size: 1rem; margin-bottom: 0.5rem; }
                .skill-meta { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: var(--color-text-muted); }
                
                .cert-card-v2 {
                    display: flex;
                    gap: 1.25rem;
                    padding: 1.25rem;
                    border-radius: 1.25rem;
                    margin-bottom: 1rem;
                    border: 1px solid var(--color-border);
                }
                .cert-icon-wrapper {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    background: var(--color-primary-subtle);
                    color: var(--color-primary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.25rem;
                    flex-shrink: 0;
                }
                .cert-info h4 { margin: 0 0 4px; font-size: 0.95rem; font-weight: 700; }
                .cert-info p { margin: 0 0 8px; font-size: 0.8rem; color: var(--color-text-muted); }
                
                .availability-summary { display: flex; flex-direction: column; gap: 1.25rem; }
                .avail-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.95rem; font-weight: 600; }
                .avail-divider { height: 1px; background: var(--color-border); }
                .days-grid { display: flex; gap: 0.5rem; }
                .day-chip { flex: 1; padding: 8px; text-align: center; border-radius: 8px; background: var(--color-surface-variant); font-size: 0.8rem; font-weight: 700; opacity: 0.4; }
                .day-chip.active { background: var(--color-primary); color: white; opacity: 1; }
                
                .slots-grid { display: flex; flex-direction: column; gap: 0.75rem; }
                .slots-grid span { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 600; opacity: 0.4; }
                .slots-grid span.active { opacity: 1; color: var(--color-text-strong); }
                .slots-grid span ion-icon { font-size: 1.1rem; }

                @media (max-width: 1000px) {
                    .profile-content-grid { grid-template-columns: 1fr; }
                    .profile-hero { flex-direction: column; align-items: center; text-align: center; }
                    .stats-row { justify-content: center; }
                    .profile-avatar-xl { margin-bottom: 1rem; }
                }
            `}</style>
        </PageWrapper>
    );
};
