import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner, EmptyState } from '../../components/index';
import { analyticsService } from '../../services/analyticsService';

export const AnalyticsPage: React.FC = () => {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await analyticsService.getAnalytics();
                const data = res.summary || res || {};
                setAnalytics({
                    totalViews: data.products?.scans || 0,
                    mostViewedProduct: data.products?.mostViewed || 'None'
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>;

    return (
        <div>
            <PageHeader title="Analytics" subtitle="Detailed insights into your products' performance" />

            {!analytics ? (
                <EmptyState icon="analytics-outline" title="No Data" description="Not enough data to display analytics." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '1rem' }}>Traffic Overview</h3>
                        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)', padding: 'var(--space-4)' }}>
                            {[40, 70, 45, 90, 65, 80, 55].map((h, i) => (
                                <div key={i} style={{ 
                                    flex: 1, 
                                    height: `${h}%`, 
                                    backgroundColor: 'var(--color-primary)', 
                                    borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
                                    opacity: 0.6 + (h/200)
                                }} />
                            ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 1rem', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                        </div>
                    </div>
                    
                    <div className="card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: '1rem' }}>Key Metrics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>Total Views</span>
                                <span style={{ fontSize: 'var(--text-xl)', fontWeight: 700 }}>{analytics.totalViews || 0}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)' }}>
                                <span style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>Most Viewed Product</span>
                                <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{analytics.mostViewedProduct || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
