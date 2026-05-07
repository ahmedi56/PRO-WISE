import React, { useState, useEffect } from 'react';
import { PageWrapper, PageHeader, Section, Button, Badge, IonIcon } from '../../components/index';
import { authService } from '../../services/authService';
import { formatDate } from '../../utils/helpers';

export const TechnicianApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [activeApp, setActiveApp] = useState<any>(null);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const data = await authService.getTechnicianApplications();
            setApplications(data);
        } catch (err) {
            setError('Failed to load applications.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchApplications();
    }, []);

    const handleApprove = async (userId: string) => {
        if (!window.confirm('Are you sure you want to approve this technician?')) return;
        try {
            await authService.approveTechnician(userId);
            fetchApplications();
            setActiveApp(null);
        } catch (err) {
            alert('Failed to approve');
        }
    };

    const handleReject = async (userId: string) => {
        if (!rejectionReason) {
            alert('Please provide a rejection reason');
            return;
        }
        try {
            await authService.rejectTechnician(userId, rejectionReason);
            fetchApplications();
            setActiveApp(null);
            setRejectionReason('');
        } catch (err) {
            alert('Failed to reject');
        }
    };

    return (
        <PageWrapper maxWidth="1100px">
            <PageHeader 
                title="Technician Applications" 
                subtitle="Review and manage pending technician upgrade requests" 
            />

            <div style={{ display: 'grid', gridTemplateColumns: activeApp ? '1fr 400px' : '1fr', gap: '2rem' }}>
                <Section title={`Pending Applications (${applications.length})`}>
                    {loading ? (
                        <div className="card" style={{ padding: '2rem' }}>Loading...</div>
                    ) : applications.length === 0 ? (
                        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
                            <IonIcon name="checkmark-circle-outline" style={{ fontSize: '3rem', color: 'var(--color-success)', marginBottom: '1rem' }} />
                            <p style={{ color: 'var(--color-text-muted)' }}>No pending technician applications at the moment.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {applications.map(app => (
                                <div 
                                    key={app.id} 
                                    className={`card ${activeApp?.id === app.id ? 'active' : ''}`}
                                    style={{ 
                                        padding: '1.25rem', 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        border: activeApp?.id === app.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setActiveApp(app)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{ 
                                            width: '50px', height: '50px', borderRadius: 'var(--radius-full)', 
                                            backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '20px', fontWeight: 600
                                        }}>
                                            {app.name ? app.name.charAt(0) : 'U'}
                                        </div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{app.name}</h4>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                                {app.email} • Submitted {formatDate(app.updatedAt)}
                                            </div>
                                            <div style={{ marginTop: '0.5rem' }}>
                                                <Badge tone="info">{app.technicianProfile?.headline || 'Technician Application'}</Badge>
                                            </div>
                                        </div>
                                    </div>
                                    <IonIcon name="chevron-forward-outline" style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {activeApp && (
                    <Section title="Application Details">
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Headline</h4>
                                <p style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{activeApp.technicianProfile?.headline}</p>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Bio</h4>
                                <p style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>{activeApp.technicianProfile?.bio}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Experience</h4>
                                    <p style={{ fontWeight: 600 }}>{activeApp.technicianProfile?.experienceYears} Years</p>
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Location</h4>
                                    <p style={{ fontWeight: 600 }}>{activeApp.technicianProfile?.city}, {activeApp.technicianProfile?.governorate}</p>
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Skills</h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {activeApp.technicianProfile?.skills?.map((s: string) => <Badge key={s}>{s}</Badge>)}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contact</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                    {activeApp.technicianProfile?.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IonIcon name="call-outline" /> {activeApp.technicianProfile.phone}</div>}
                                    {activeApp.technicianProfile?.whatsapp && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IonIcon name="logo-whatsapp" /> {activeApp.technicianProfile.whatsapp}</div>}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
                                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <Button fullWidth onClick={() => handleApprove(activeApp.id)}>Approve</Button>
                                    <Button variant="danger" fullWidth onClick={() => {}}>Reject</Button>
                                </div>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    <textarea 
                                        placeholder="Reason for rejection..." 
                                        className="input"
                                        style={{ minHeight: '80px', padding: '0.75rem' }}
                                        value={rejectionReason}
                                        onChange={(e) => setRejectionReason(e.target.value)}
                                    />
                                    <Button variant="danger" fullWidth onClick={() => handleReject(activeApp.id)}>Confirm Rejection</Button>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        </PageWrapper>
    );
};
