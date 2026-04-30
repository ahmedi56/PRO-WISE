import React, { useState, useEffect } from 'react';
import { PageWrapper, PageHeader, Button, Section, Badge, IonIcon } from '../../components/index';
import { useAuth } from '../../hooks/useAuth';
import { maintenanceService } from '../../services/maintenanceService';
import { formatDate } from '../../utils/helpers';

export const TechnicianProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await maintenanceService.getTechnicianRequests();
            setRequests(data);
        } catch (err: any) {
            setError('Failed to load assigned requests.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            await maintenanceService.updateRequestStatus(id, status);
            fetchRequests();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge tone="warning">Pending</Badge>;
            case 'assigned': return <Badge tone="info">Assigned</Badge>;
            case 'in_progress': return <Badge tone="primary">In Progress</Badge>;
            case 'completed': return <Badge tone="success">Completed</Badge>;
            default: return <Badge>{status}</Badge>;
        }
    };

    const roleName = (typeof user?.role === 'object' ? (user?.role as any).name : user?.role) || '';
    const isTechnician = roleName.toLowerCase() === 'technician';

    if (!isTechnician) {
        return (
            <PageWrapper>
                <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <IonIcon name="lock-closed-outline" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }} />
                    <h2>Access Restricted</h2>
                    <p>You must be a verified technician to access this portal.</p>
                    <Button onClick={() => window.history.back()} style={{ marginTop: '1.5rem' }}>Go Back</Button>
                </div>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper maxWidth="1000px">
            <PageHeader 
                title="Technician Portal" 
                subtitle="Manage your assigned service requests and track your performance" 
            />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Section title="Assigned Requests">
                        {loading ? (
                            <div className="pw-card pw-p-6">Loading requests...</div>
                        ) : requests.length === 0 ? (
                            <div className="pw-card pw-p-6 pw-text-center">
                                <p className="pw-text-muted">No requests assigned to you yet.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {requests.map((req) => (
                                    <div key={req.id} className="pw-card pw-p-5" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                <h4 style={{ margin: 0, fontSize: '1.125rem' }}>{req.productName}</h4>
                                                {getStatusBadge(req.status)}
                                                <Badge tone={req.urgency === 'high' ? 'danger' : 'info'}>{req.urgency} urgency</Badge>
                                            </div>
                                            <p style={{ color: 'var(--color-text)', fontSize: '0.9375rem', marginBottom: '0.75rem' }}>
                                                {req.issueDescription}
                                            </p>
                                            <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                                Requested by {req.user?.name || 'Customer'} on {formatDate(req.createdAt)}
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {req.status === 'pending' && (
                                                <Button size="sm" onClick={() => handleUpdateStatus(req.id, 'assigned')}>Accept</Button>
                                            )}
                                            {req.status === 'assigned' && (
                                                <Button size="sm" onClick={() => handleUpdateStatus(req.id, 'in_progress')}>Start Work</Button>
                                            )}
                                            {req.status === 'in_progress' && (
                                                <Button size="sm" variant="success" onClick={() => handleUpdateStatus(req.id, 'completed')}>Mark Complete</Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Section>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <Section title="My Stats">
                        <div className="pw-card pw-p-5">
                            <div style={{ marginBottom: '1rem' }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Jobs</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                                    {requests.filter(r => r.status === 'completed').length}
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Jobs</div>
                                <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--color-secondary)' }}>
                                    {requests.filter(r => r.status === 'assigned' || r.status === 'in_progress').length}
                                </div>
                            </div>
                        </div>
                    </Section>
                </div>
            </div>
        </PageWrapper>
    );
};

