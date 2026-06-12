import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner, EmptyState, IonIcon } from '../../components/index';
import { analyticsService } from '../../services/analyticsService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

export const DashboardPage: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useSelector((state: RootState) => state.auth);
    const company = user?.company;

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await analyticsService.getAnalytics();
                const data = response.summary || response || {};
                setStats({
                    products: data.products?.total || 0,
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
                        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <IonIcon name="eye-outline" style={{ fontSize: '20px' }} />
                        </div>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600 }}>Total Views</h3>
                    </div>
                    <div style={{ fontSize: '1.875rem', fontWeight: 800, color: 'var(--color-text-strong)' }}>{stats?.views || 0}</div>
                </div>
            </div>

            {company && (
                <div className="card" style={{ padding: '2rem' }}>
                    <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: '1.5rem', borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '0.75rem', color: 'var(--color-text-strong)' }}>
                        Company Information
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                        <div>
                            <span style={{ display: 'block', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Company Name</span>
                            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-strong)' }}>{company.name}</span>
                        </div>
                        {company.description && (
                            <div>
                                <span style={{ display: 'block', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Description</span>
                                <span style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>{company.description}</span>
                            </div>
                        )}
                        {company.address && (
                            <div>
                                <span style={{ display: 'block', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Address</span>
                                <span style={{ color: 'var(--color-text)' }}>{company.address}</span>
                            </div>
                        )}
                        {company.website && (
                            <div>
                                <span style={{ display: 'block', fontSize: 'var(--text-xs)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Website</span>
                                <a 
                                    href={company.website.startsWith('http') ? company.website : `https://${company.website}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    {company.website}
                                    <IonIcon name="open-outline" style={{ fontSize: '16px' }} />
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
