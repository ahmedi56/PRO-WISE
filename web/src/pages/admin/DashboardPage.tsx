import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner, EmptyState, IonIcon } from '../../components/index';
import { analyticsService } from '../../services/analyticsService';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await analyticsService.getAnalytics();
                const data = response.summary || response || {};
                setStats({
                    products: data.products?.total || 0,
                    feedback: data.feedback?.total || 0,
                    views: data.products?.scans || 0
                });
            } catch (err: any) {
                setError(err.message || 'Failed to load dashboard statistics.');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>;
    if (error) return <EmptyState icon="alert-circle-outline" title="Error" description={error} />;

    return (
        <div>
            <PageHeader title="Company Dashboard" subtitle="Overview of your products and user interactions" />
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IonIcon name="cube-outline" style={{ fontSize: '20px' }} />
                        </div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Total Products</h3>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text-strong)' }}>{stats?.products || 0}</div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IonIcon name="chatbubbles-outline" style={{ fontSize: '20px' }} />
                        </div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Feedback Received</h3>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text-strong)' }}>{stats?.feedback || 0}</div>
                </div>

                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IonIcon name="eye-outline" style={{ fontSize: '20px' }} />
                        </div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Total Views</h3>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text-strong)' }}>{stats?.views || 0}</div>
                </div>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: '1rem' }}>Recent Activity</h3>
                <EmptyState icon="time-outline" title="No Recent Activity" description="There has been no recent activity on your products." />
            </div>
        </div>
    );
};
