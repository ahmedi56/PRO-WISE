import React, { useState, useEffect } from 'react';
import { PageWrapper, PageHeader, Section, Button, Badge, IonIcon } from '../../components/index';
import { authService } from '../../services/authService';
import { formatDate } from '../../utils/helpers';

export const TechnicianApplicationsPage: React.FC = () => {
    const [applications, setApplications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [verificationNotes, setVerificationNotes] = useState('');
    const [activeApp, setActiveApp] = useState<any>(null);
    const [certStatuses, setCertStatuses] = useState<any[]>([]);

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

    useEffect(() => {
        if (activeApp && activeApp.technicianProfile?.certifications) {
            setCertStatuses(activeApp.technicianProfile.certifications.map((c: any) => ({
                title: c.title,
                status: c.verificationStatus || 'pending'
            })));
        } else {
            setCertStatuses([]);
        }
    }, [activeApp]);

    const handleCertStatusChange = (title: string, status: string) => {
        setCertStatuses(prev => prev.map(c => c.title === title ? { ...c, status } : c));
    };

    const handleApprove = async (userId: string) => {
        if (!window.confirm('Approve this technician? Check certification statuses before proceeding.')) return;
        try {
            await authService.approveTechnician(userId, { certificationsStatus: certStatuses, verificationNotes });
            fetchApplications();
            setActiveApp(null);
            setVerificationNotes('');
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
        <PageWrapper maxWidth="1200px">
            <PageHeader title="Technician Applications" subtitle="Review profiles and verify certifications" />

            <div style={{ display: 'grid', gridTemplateColumns: activeApp ? '1fr 500px' : '1fr', gap: '2rem' }}>
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
                                <div key={app.id} className={`card ${activeApp?.id === app.id ? 'active' : ''}`} style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', border: activeApp?.id === app.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }} onClick={() => setActiveApp(app)}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600 }}>{app.name ? app.name.charAt(0) : 'U'}</div>
                                        <div>
                                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{app.name}</h4>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>{app.technicianProfile?.city} • {app.technicianProfile?.specializations?.length || 0} Specializations</div>
                                        </div>
                                    </div>
                                    <IonIcon name="chevron-forward-outline" style={{ color: 'var(--color-text-muted)' }} />
                                </div>
                            ))}
                        </div>
                    )}
                </Section>

                {activeApp && (
                    <Section title="Review Workspace">
                        <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'sticky', top: '2rem' }}>
                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Headline</h4>
                                <p style={{ fontWeight: 600 }}>{activeApp.technicianProfile?.headline}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div><h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Contact</h4><p>{activeApp.technicianProfile?.phone}</p></div>
                                <div><h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Location</h4><p>{activeApp.technicianProfile?.city}</p></div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Specializations</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {activeApp.technicianProfile?.specializations?.map((s: any, i: number) => (
                                        <div key={i} style={{ padding: '0.5rem', background: 'var(--color-surface-variant)', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                                            <strong>{s.name}</strong> - {s.skillLevel} ({s.yearsExperience}y)
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Certifications ({activeApp.technicianProfile?.certifications?.length || 0})</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {activeApp.technicianProfile?.certifications?.map((c: any, i: number) => {
                                        const currentStatus = certStatuses.find(cs => cs.title === c.title)?.status || 'pending';
                                        return (
                                            <div key={i} style={{ padding: '1rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <strong>{c.title}</strong>
                                                    <Badge tone={currentStatus === 'verified' ? 'success' : currentStatus === 'rejected' ? 'danger' : 'warning'}>{currentStatus}</Badge>
                                                </div>
                                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: '0 0 0.5rem 0' }}>{c.organization}</p>
                                                {c.verificationUrl && <a href={c.verificationUrl} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>Verify Link ↗</a>}
                                                
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                                    <Button size="sm" variant={currentStatus === 'verified' ? 'primary' : 'secondary'} onClick={() => handleCertStatusChange(c.title, 'verified')}>Verify</Button>
                                                    <Button size="sm" variant={currentStatus === 'rejected' ? 'danger' : 'secondary'} onClick={() => handleCertStatusChange(c.title, 'rejected')}>Reject</Button>
                                                    <Button size="sm" variant={currentStatus === 'requires_info' ? 'warning' : 'secondary'} onClick={() => handleCertStatusChange(c.title, 'requires_info')}>Ask Info</Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
                                <h4 style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Resolution</h4>
                                <textarea placeholder="Internal Verification Notes..." className="input" style={{ minHeight: '80px', marginBottom: '1rem' }} value={verificationNotes} onChange={(e) => setVerificationNotes(e.target.value)} />
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Button fullWidth onClick={() => handleApprove(activeApp.id)}>Approve Technician</Button>
                                    <Button variant="danger" fullWidth onClick={() => {
                                        const reason = prompt('Rejection reason:');
                                        if (reason) { setRejectionReason(reason); handleReject(activeApp.id); }
                                    }}>Reject Application</Button>
                                </div>
                            </div>
                        </div>
                    </Section>
                )}
            </div>
        </PageWrapper>
    );
};
