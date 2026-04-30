import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader, Button, Spinner, EmptyState, IonIcon } from '../../components/index';
import axios from 'axios';
import { API_URL } from '../../config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface UserRecord {
    id: string;
    username: string;
    name: string;
    email: string;
    status: string;
    role: any;
    company: any;
    createdAt: string;
}

export const UsersPage: React.FC = () => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [users, setUsers] = useState<UserRecord[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const headers = { Authorization: `Bearer ${token}` };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/users`, { headers });
            setUsers(data.data || data || []);
        } catch (err) {
            console.error('Failed to fetch users', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchRoles = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/roles`, { headers });
            setRoles(data.data || data || []);
        } catch (err) {
            console.error('Failed to fetch roles', err);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const filteredUsers = useMemo(() => {
        if (!searchTerm.trim()) return users;
        const lower = searchTerm.toLowerCase();
        
        if (lower === 'status:pending') {
            return users.filter(u => u.status === 'pending');
        }

        return users.filter(u =>
            (u.name || '').toLowerCase().includes(lower) ||
            (u.email || '').toLowerCase().includes(lower) ||
            (u.username || '').toLowerCase().includes(lower)
        );
    }, [users, searchTerm]);

    const getRoleName = (user: UserRecord): string => {
        const role = user.role;
        if (!role) return 'N/A';
        if (typeof role === 'object') return role.name || 'N/A';
        return String(role);
    };

    const getCompanyName = (user: UserRecord): string => {
        const company = user.company;
        if (!company) return '—';
        if (typeof company === 'object') return company.name || '—';
        return String(company);
    };

    const handleRoleChange = async (userId: string, newRoleId: string) => {
        setActionLoading(userId);
        try {
            await axios.put(`${API_URL}/users/${userId}/role`, { role: newRoleId }, { headers });
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update role');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: string) => {
        setActionLoading(userId);
        try {
            const endpoint = currentStatus === 'active' ? 'deactivate' : 'activate';
            await axios.put(`${API_URL}/users/${userId}/${endpoint}`, {}, { headers });
            setUsers(users.map(u => u.id === userId ? { ...u, status: currentStatus === 'active' ? 'inactive' : 'active' } : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleValidate = async (userId: string) => {
        setActionLoading(userId);
        try {
            await axios.put(`${API_URL}/users/${userId}/validate`, {}, { headers });
            setUsers(users.map(u => u.id === userId ? { ...u, status: 'active' } : u));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to validate user');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (userId: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete user "${name}"? This action cannot be undone.`)) return;
        setActionLoading(userId);
        try {
            await axios.delete(`${API_URL}/users/${userId}`, { headers });
            setUsers(users.filter(u => u.id !== userId));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete user');
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusDot = (status: string) => {
        const colors: Record<string, string> = {
            active: 'var(--color-success)',
            pending: 'var(--color-warning)',
            inactive: 'var(--color-error)',
            deactivated: 'var(--color-error)',
        };
        const color = colors[status] || 'var(--color-text-muted)';
        return (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'capitalize' as const }}>{status}</span>
            </span>
        );
    };

    return (
        <div>
            <PageHeader
                title="User Management"
                subtitle={`${users.length} registered users`}
            />

            {/* Search Bar */}
            <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <IonIcon name="search-outline" style={{ color: 'var(--color-text-muted)', fontSize: '20px', flexShrink: 0 }} />
                    <input
                        type="text"
                        className="input"
                        placeholder="Search by name, email, or username..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }}
                    />
                    {searchTerm && (
                        <Button variant="ghost" size="sm" onClick={() => setSearchTerm('')}>Clear</Button>
                    )}
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '1rem' }}>
                    <Button 
                        variant={searchTerm === '' ? 'primary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setSearchTerm('')}
                    >
                        All Users
                    </Button>
                    <Button 
                        variant={searchTerm === 'status:pending' ? 'primary' : 'ghost'} 
                        size="sm" 
                        onClick={() => setSearchTerm('status:pending')}
                        style={{ color: searchTerm === 'status:pending' ? '#fff' : 'var(--color-warning)' }}
                    >
                        Pending Requests
                    </Button>
                </div>
            </div>

            {loading ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
            ) : filteredUsers.length === 0 ? (
                <EmptyState
                    icon="people-outline"
                    title={searchTerm ? 'No users found' : 'No Users'}
                    description={searchTerm ? `No users matching "${searchTerm}"` : 'There are no registered users yet.'}
                />
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Company</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))',
                                                    color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 700, fontSize: '0.8rem', flexShrink: 0
                                                }}>
                                                    {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{user.name || user.username}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@{user.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            {roles.length > 0 ? (
                                                <select
                                                    className="select"
                                                    value={typeof user.role === 'object' ? user.role?.id : user.role || ''}
                                                    onChange={e => handleRoleChange(user.id, e.target.value)}
                                                    disabled={actionLoading === user.id}
                                                    style={{ padding: '4px 28px 4px 8px', fontSize: '0.8rem', minWidth: '130px' }}
                                                >
                                                    {roles.map(r => (
                                                        <option key={r.id} value={r.id}>{r.name}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className="badge badge-primary">{getRoleName(user)}</span>
                                            )}
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)' }}>{getCompanyName(user)}</td>
                                        <td>{getStatusDot(user.status || 'active')}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                {user.status === 'pending' && (
                                                    <button 
                                                        className="btn btn-primary btn-sm" 
                                                        onClick={() => handleValidate(user.id)} 
                                                        disabled={actionLoading === user.id}
                                                        style={{ backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                                    >
                                                        {getRoleName(user) === 'customer' || getRoleName(user) === 'user' ? 'Approve Technician' : 'Validate'}
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleToggleStatus(user.id, user.status || 'active')}
                                                    disabled={actionLoading === user.id}
                                                >
                                                    {(user.status || 'active') === 'active' ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDelete(user.id, user.name || user.username)}
                                                    disabled={actionLoading === user.id}
                                                    style={{ color: 'var(--color-error)' }}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
