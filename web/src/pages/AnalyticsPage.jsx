import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Card, PageHeader, Skeleton, Alert, Badge } from '../components/ui';
import UserDistributionChart from '../components/UserDistributionChart';
import CompanyEngagementChart from '../components/CompanyEngagementChart';

const AnalyticsPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const user = useSelector((state) => state.auth.user);
    const userRole = (user?.role?.name || user?.Role?.name || 'user').toLowerCase();
    const isSuperAdmin = userRole === 'super_admin';

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/analytics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setStats(data.summary);
            } catch (err) {
                setError('Failed to load analytics data.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [token]);

    if (loading) return (
        <div className="page">
            <PageHeader title="Analytics" subtitle="Loading metrics..." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={140} raised />)}
            </div>
            <div className="mt-8">
                <Skeleton height={400} raised />
            </div>
        </div>
    );

    return (
        <div className="page">
            <PageHeader
                title={isSuperAdmin ? 'Platform Analytics' : 'Company Analytics'}
                subtitle={isSuperAdmin ? 'Comprehensive governance metrics and system insights.' : 'Performance metrics for your products and guides.'}
            />

            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            {/* Top Level KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {stats?.products?.total || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Total Products
                    </div>
                </Card>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-success)' }}>
                        {stats?.products?.published || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Live Catalog
                    </div>
                </Card>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-accent)' }}>
                        {stats?.products?.scans || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Consumer Engagement
                    </div>
                </Card>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--color-info)' }}>
                        {stats?.guides?.total || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Support Assets
                    </div>
                </Card>
            </div>

            {/* Advanced Visualization Section (Graphic Avance) */}
            {isSuperAdmin && stats?.users && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginTop: '2rem' }}>
                    <Card p={0} raised style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(var(--color-primary-rgb), 0.05)' }}>
                            <h3 style={{ margin: 0 }}>User Role Distribution</h3>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Distribution of active Super Admins, Company Admins, and and Technicians.</p>
                        </div>
                        <div style={{ padding: '1rem' }}>
                            <UserDistributionChart data={stats.users.roles} />
                        </div>
                    </Card>

                    <Card raised className="p-6">
                        <h3 className="mb-6">Super Admin Governance</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600 }}>Total User Base</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Global account count</span>
                                </div>
                                <Badge tone="neutral" size="lg">{stats.users.totalUsers}</Badge>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(var(--color-success-rgb), 0.1)', border: '1px solid rgba(var(--color-success-rgb), 0.2)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-success)' }}>Active Users</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Currently authenticated</span>
                                </div>
                                <Badge tone="success" size="lg">{stats.users.activeUsers}</Badge>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(var(--color-warning-rgb), 0.1)', border: '1px solid rgba(var(--color-warning-rgb), 0.2)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-warning)' }}>Pending Validations</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Awaiting Super Admin review</span>
                                </div>
                                <Badge tone="warning" size="lg">{stats.users.pendingUsers}</Badge>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(var(--color-info-rgb), 0.1)', border: '1px solid rgba(var(--color-info-rgb), 0.2)', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-info)' }}>Active Companies</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>Total tracked entities</span>
                                </div>
                                <Badge tone="info" size="lg">{stats.companies?.total || 0}</Badge>
                            </div>
                        </div>
                    </Card>

                    {stats.companies?.topCompanies && stats.companies.topCompanies.length > 0 && (
                        <Card p={0} raised style={{ overflow: 'hidden', gridColumn: '1 / -1' }}>
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', background: 'rgba(var(--color-accent-rgb), 0.05)' }}>
                                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span>🏆</span> Most Visited Companies
                                </h3>
                                <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Top 5 companies ranked by total consumer product scans.</p>
                            </div>
                            <div style={{ padding: '2rem 1rem 1rem' }}>
                                <CompanyEngagementChart data={stats.companies.topCompanies} />
                            </div>
                        </Card>
                    )}
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
