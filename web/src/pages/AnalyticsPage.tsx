import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Card, PageHeader, Skeleton, Alert, Badge } from '@/components/ui';
import UserDistributionChart from '@/components/UserDistributionChart';
import CompanyEngagementChart from '@/components/CompanyEngagementChart';
import { RootState } from '@/store';

const AnalyticsPage: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || 'user').toLowerCase();
    const isSuperAdmin = roleName === 'super_admin';

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/analytics`);
                setStats(data.summary);
            } catch (err) {
                setError('Synchronization of platform metrics failed.');
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, [token]);

    if (loading) return (
        <div className="page">
            <PageHeader title="📊 Command Center" subtitle="Streaming platform metrics..." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
                {[1, 2, 3, 4].map(i => <Skeleton key={i} height={160} style={{ borderRadius: '24px' }} />)}
            </div>
            <div className="mt-8" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <Skeleton height={400} style={{ borderRadius: '32px' }} />
                <Skeleton height={400} style={{ borderRadius: '32px' }} />
            </div>
        </div>
    );

    return (
        <div className="page pb-20">
            <PageHeader
                title={isSuperAdmin ? '📊 Platform Command Center' : '🏢 Organization Intelligence'}
                subtitle={isSuperAdmin ? 'Real-time telemetry and governance metrics for the PRO-WISE ecosystem.' : 'Performance insights for your product catalog and digital assets.'}
            />

            {error && <Alert tone="error" className="mb-8">{error}</Alert>}

            {/* High-Impact KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                <Card className="p-8 relative overflow-hidden" raised style={{ borderRadius: '28px', border: '1px solid var(--color-border)' }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '100px', height: '100px', background: 'var(--color-primary)', filter: 'blur(40px)', opacity: 0.1 }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Total Assets</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-text-strong)', lineHeight: 1 }}>{stats?.products?.total || 0}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', marginTop: '0.75rem' }}>↑ System Total</div>
                </Card>

                <Card className="p-8 relative overflow-hidden" raised style={{ borderRadius: '28px', border: '1px solid var(--color-border)' }}>
                     <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '100px', height: '100px', background: 'var(--color-success)', filter: 'blur(40px)', opacity: 0.1 }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Live Catalog</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-success)', lineHeight: 1 }}>{stats?.products?.published || 0}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, opacity: 0.6, marginTop: '0.75rem' }}>• PUBLIC_VISIBILITY</div>
                </Card>

                <Card className="p-8 relative overflow-hidden" raised style={{ borderRadius: '28px', border: '1px solid var(--color-border)' }}>
                     <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '100px', height: '100px', background: 'var(--color-accent)', filter: 'blur(40px)', opacity: 0.1 }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Total Scans</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-accent)', lineHeight: 1 }}>{stats?.products?.scans || 0}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)', marginTop: '0.75rem' }}>✦ Active Engagement</div>
                </Card>

                <Card className="p-8 relative overflow-hidden" raised style={{ borderRadius: '28px', border: '1px solid var(--color-border)' }}>
                     <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '100px', height: '100px', background: 'var(--color-info)', filter: 'blur(40px)', opacity: 0.1 }} />
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Support Items</div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: 'var(--color-info)', lineHeight: 1 }}>{stats?.guides?.total || 0}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-info)', marginTop: '0.75rem' }}>★ Utility Assets</div>
                </Card>
            </div>

            {isSuperAdmin && stats?.users && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem' }}>
                    
                    {/* Role Distribution Hub */}
                    <Card raised style={{ overflow: 'hidden', padding: 0, borderRadius: '32px', border: '1px solid var(--color-border)' }}>
                        <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(var(--color-primary-rgb), 0.05)' }}>
                            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900 }}>Global Role Weighting</h3>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Distribution of authority levels across the platform identifier registry.</p>
                        </div>
                        <div style={{ padding: '2.5rem' }}>
                            <UserDistributionChart data={stats.users.roles} />
                        </div>
                    </Card>

                    {/* Governance Metrics */}
                    <Card raised style={{ borderRadius: '32px', border: '1px solid var(--color-border)', background: 'var(--color-surface)', position: 'relative', overflow: 'hidden' }}>
                        <div className="p-8">
                            <h3 style={{ marginBottom: '2rem', fontSize: '1.25rem', fontWeight: 900 }}>User Governance Telemetry</h3>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--color-background-soft)', borderRadius: '18px', border: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>Total Registry</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ID_COUNT_TOTAL</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>{stats.users.totalUsers}</div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(var(--color-success-rgb), 0.08)', borderRadius: '18px', border: '1px dashed var(--color-success)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-success)' }}>Active Pulse</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>AUTH_STATE_ACTIVE</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-success)' }}>{stats.users.activeUsers}</div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(var(--color-warning-rgb), 0.08)', borderRadius: '18px', border: '1px dashed var(--color-warning)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-warning)' }}>Awaiting Audit</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ID_STATE_PENDING</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-warning)' }}>{stats.users.pendingUsers}</div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'rgba(var(--color-info-rgb), 0.08)', borderRadius: '18px', border: '1px dashed var(--color-info)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-info)' }}>Tracked Entities</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>ORGS_ENROLLED</span>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-info)' }}>{stats.companies?.total || 0}</div>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Top Companies Large Visualization */}
                    {stats.companies?.topCompanies && stats.companies.topCompanies.length > 0 && (
                        <Card raised style={{ overflow: 'hidden', gridColumn: '1 / -1', padding: 0, borderRadius: '40px', border: '1px solid var(--color-border)', marginTop: '1rem' }}>
                            <div style={{ padding: '2.5rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(var(--color-accent-rgb), 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: 900 }}>
                                        <span>🏆</span> Engagement Leaderboard
                                    </h3>
                                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>Performance ranking by unique physical product scans within the ecosystem.</p>
                                </div>
                                <Badge tone="accent" style={{ padding: '8px 16px', borderRadius: '100px', fontWeight: 900 }}>TOP_5_ENTITIES</Badge>
                            </div>
                            <div style={{ padding: '3rem 2rem 2rem' }}>
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
