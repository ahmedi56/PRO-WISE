import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { API_URL } from '@/config';
import { Card, PageHeader, Badge, Button, Skeleton, Alert } from '@/components/ui';
import { RootState } from '@/store';
import { User } from '@/types/user';

interface DashboardStats {
    products: { total: number; scans: number };
    guides: { total: number };
    users: { totalUsers: number };
}

interface DashboardData {
    stats: DashboardStats;
    pendingUsers: User[];
}

const AdminDashboard: React.FC = () => {
    const { token, user } = useSelector((state: RootState) => state.auth);
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isSuperAdmin = roleName === 'super_admin';

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [analyticsRes, usersRes] = await Promise.all([
                    axios.get(`${API_URL}/analytics`),
                    isSuperAdmin ? axios.get(`${API_URL}/users`) : Promise.resolve({ data: [] })
                ]);

                setData({
                    stats: analyticsRes.data.summary,
                    pendingUsers: (Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || [])).filter((u: any) => u.status === 'pending')
                });
            } catch (err) {
                setError('Failed to load dashboard data.');
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [token, isSuperAdmin]);

    if (loading) return <div className="page"><Skeleton height={400} /></div>;

    return (
        <div className="page">
            <PageHeader
                title={`Welcome back, ${user?.name}`}
                subtitle={isSuperAdmin ? "Platform-wide overview and management." : `Overview for ${user?.company?.name || 'your company'}.`}
            />

            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20" raised>
                    <div className="text-sm text-muted mb-1">Total Products</div>
                    <div className="text-3xl font-bold text-primary">{data?.stats?.products?.total || 0}</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-teal-500/10 to-emerald-500/10 border-teal-500/20" raised>
                    <div className="text-sm text-muted mb-1">Active Guides</div>
                    <div className="text-3xl font-bold text-success">{data?.stats?.guides?.total || 0}</div>
                </Card>
                <Card className="p-6 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20" raised>
                    <div className="text-sm text-muted mb-1">QR Scans</div>
                    <div className="text-3xl font-bold text-warning">{data?.stats?.products?.scans || 0}</div>
                </Card>
                {isSuperAdmin && (
                    <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/20" raised>
                        <div className="text-sm text-muted mb-1">Total Users</div>
                        <div className="text-3xl font-bold text-info">{data?.stats?.users?.totalUsers || 0}</div>
                    </Card>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Action Required / Pending Approvals */}
                {isSuperAdmin && (
                    <Card className="lg:col-span-2" raised>
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="text-lg font-semibold">Pending Admin Approvals</h3>
                            <Link to="/admin/users?status=pending">
                                <Button variant="ghost" size="sm">View All</Button>
                            </Link>
                        </div>
                        <div className="p-0">
                            {data?.pendingUsers?.length === 0 ? (
                                <div className="p-8 text-center text-muted">No pending approvals.</div>
                            ) : (
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>User</th>
                                            <th>Company</th>
                                            <th>Date</th>
                                            <th style={{ textAlign: 'right' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data?.pendingUsers?.slice(0, 5).map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className="font-medium">{u.name}</div>
                                                    <div className="text-xs text-muted">{u.email}</div>
                                                </td>
                                                <td>{u.company?.name || 'N/A'}</td>
                                                <td className="text-xs">{u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <Link to="/admin/users">
                                                        <Button variant="primary" size="sm">Review</Button>
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                )}

                {/* Quick Links / Status */}
                <Card raised>
                    <div className="p-4 border-b">
                        <h3 className="text-lg font-semibold">System Status</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm">API Backend</span>
                            <Badge tone="success">Operational</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Database</span>
                            <Badge tone="success">Operational</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm">Storage (Cloudinary)</span>
                            <Badge tone="success">Operational</Badge>
                        </div>
                        <div className="pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-3">Recently Published</h4>
                            <div className="text-xs text-muted mb-2">• Industrial Compressor H2</div>
                            <div className="text-xs text-muted mb-2">• Smart Turbine V4</div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
