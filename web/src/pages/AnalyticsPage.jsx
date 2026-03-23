import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Card, PageHeader, Skeleton, Alert, Badge } from '../components/ui';

const AnalyticsPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const userRole = (useSelector((state) => state.auth.user?.role?.name) || 'administrator').toLowerCase();
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
            <Skeleton height={40} width="40%" className="mb-6" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <Skeleton height={120} />
                <Skeleton height={120} />
                <Skeleton height={120} />
            </div>
        </div>
    );

    return (
        <div className="page">
            <PageHeader
                title={isSuperAdmin ? 'Platform Analytics' : 'Company Analytics'}
                subtitle={isSuperAdmin ? 'Global performance metrics and system overview.' : 'Performance metrics for your products and guides.'}
            />

            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                        {stats?.products?.total || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Total Products</div>
                </Card>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-success)' }}>
                        {stats?.products?.published || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Published Products</div>
                </Card>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)' }}>
                        {stats?.products?.scans || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Total Scans</div>
                </Card>
                <Card className="text-center p-6" raised>
                    <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-info)' }}>
                        {stats?.guides?.total || 0}
                    </div>
                    <div style={{ color: 'var(--color-text-muted)' }}>Total Guides</div>
                </Card>
            </div>

            {stats?.users && (
                <div style={{ marginTop: '2.5rem' }}>
                    <h3 className="mb-4">Platform Overview (Super Admin)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                        <Card className="p-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Total Users</span>
                                <Badge tone="neutral">{stats.users.totalUsers}</Badge>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Active Users</span>
                                <Badge tone="success">{stats.users.activeUsers}</Badge>
                            </div>
                        </Card>
                        <Card className="p-6">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Pending Admin Approvals</span>
                                <Badge tone="warning">{stats.users.pendingAdmins}</Badge>
                            </div>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPage;
