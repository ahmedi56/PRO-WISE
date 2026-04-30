import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Spinner, IonIcon, Button } from '../../components/index';
import axios from 'axios';
import { API_URL } from '../../config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface PlatformStats {
    users: number;
    companies: number;
    products: number;
    categories: number;
}

export const SuperDashboardPage: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentUsers, setRecentUsers] = useState<any[]>([]);

    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [usersRes, companiesRes, productsRes, categoriesRes] = await Promise.allSettled([
                    axios.get(`${API_URL}/users`, { headers }),
                    axios.get(`${API_URL}/companies`, { headers }),
                    axios.get(`${API_URL}/products`, { headers }),
                    axios.get(`${API_URL}/categories`, { headers }),
                ]);

                const extract = (res: PromiseSettledResult<any>) => {
                    if (res.status !== 'fulfilled') return { count: 0, data: [] };
                    const d = res.value.data;
                    if (Array.isArray(d)) return { count: d.length, data: d };
                    if (d?.data && Array.isArray(d.data)) return { count: d.total || d.data.length, data: d.data };
                    return { count: 0, data: [] };
                };

                const usersData = extract(usersRes);
                setStats({
                    users: usersData.count,
                    companies: extract(companiesRes).count,
                    products: extract(productsRes).count,
                    categories: extract(categoriesRes).count,
                });
                setRecentUsers(usersData.data.slice(0, 5));
            } catch (err) {
                console.error('Failed to fetch stats', err);
                setStats({ users: 0, companies: 0, products: 0, categories: 0 });
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [token]);

    if (loading) {
        return (
            <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    const statCards = [
        { label: 'Total Users', value: stats?.users ?? 0, icon: 'people-outline', color: '#6366F1', bg: 'rgba(99,102,241,0.12)', route: '/admin/users' },
        { label: 'Companies', value: stats?.companies ?? 0, icon: 'business-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', route: '/admin/companies' },
        { label: 'Products', value: stats?.products ?? 0, icon: 'cube-outline', color: '#10B981', bg: 'rgba(16,185,129,0.12)', route: null },
        { label: 'Categories', value: stats?.categories ?? 0, icon: 'grid-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', route: '/admin/categories' },
    ];

    return (
        <div>
            <PageHeader title="Platform Overview" subtitle="Real-time system metrics" />

            {/* Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                {statCards.map((s, i) => (
                    <div
                        key={i}
                        className="card"
                        style={{ padding: '1.5rem', cursor: s.route ? 'pointer' : 'default' }}
                        onClick={() => s.route && navigate(s.route)}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 'var(--radius-lg)',
                                background: s.bg, color: s.color,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '22px'
                            }}>
                                <IonIcon name={s.icon} />
                            </div>
                            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', fontWeight: 600 }}>{s.label}</span>
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.03em' }}>
                            {s.value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions + Recent Users */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem' }}>
                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Quick Actions</h3>
                    </div>
                    <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { label: 'Manage Users', icon: 'people-outline', to: '/admin/users' },
                            { label: 'Manage Companies', icon: 'business-outline', to: '/admin/companies' },
                            { label: 'Manage Categories', icon: 'grid-outline', to: '/admin/categories' },
                            { label: 'Content Approvals', icon: 'checkmark-circle-outline', to: '/admin/support/pending' },
                            { label: 'Guide Types', icon: 'book-outline', to: '/admin/guide-types' },
                            { label: 'Audit Logs', icon: 'time-outline', to: '/admin/audit-logs' },
                        ].map(item => (
                            <button
                                key={item.to}
                                onClick={() => navigate(item.to)}
                                className="hover-premium"
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)',
                                    background: 'none', border: '1px solid var(--color-border)',
                                    color: 'var(--color-text-strong)', cursor: 'pointer',
                                    fontWeight: 500, fontSize: 'var(--text-sm)',
                                    fontFamily: 'var(--font-body)', textAlign: 'left', width: '100%'
                                }}
                            >
                                <IonIcon name={item.icon} style={{ fontSize: '18px', color: 'var(--color-primary)' }} />
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Users */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Recent Users</h3>
                        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/users')}>View All</Button>
                    </div>
                    {recentUsers.length === 0 ? (
                        <div className="card-body" style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '3rem' }}>
                            No users found.
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentUsers.map((u: any) => {
                                        const role = typeof u.role === 'object' ? u.role?.name : u.role;
                                        const status = u.status || 'active';
                                        const statusColor = status === 'active' ? 'var(--color-success)' : status === 'pending' ? 'var(--color-warning)' : 'var(--color-error)';
                                        return (
                                            <tr key={u.id}>
                                                <td style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{u.name || u.username}</td>
                                                <td>{u.email}</td>
                                                <td><span className="badge badge-primary">{role || 'N/A'}</span></td>
                                                <td>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
                                                        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' }}>{status}</span>
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Responsive fix */}
            <style>{`
                @media (max-width: 900px) {
                    div[style*="grid-template-columns: 1fr 1.5fr"] {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
};
