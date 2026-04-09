import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { API_URL } from '@/config';
import { 
    Alert, 
    Badge, 
    Button, 
    Card, 
    EmptyState, 
    InputField, 
    PageHeader, 
    Skeleton, 
    Spinner 
} from '@/components/ui';
import { RootState } from '@/store';
import { User, Role } from '@/types/user';
import { Company } from '@/types/company';

const ROLE_BADGE: Record<string, 'info' | 'primary' | 'neutral' | 'success' | 'danger' | 'warning'> = {
    super_admin: 'primary',
    administrator: 'info',
    company_admin: 'info',
    client: 'primary',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary'> = {
    active: 'success',
    pending: 'warning',
    deactivated: 'danger'
};

const DEFAULT_ROLES: Role[] = [
    'super_admin',
    'company_admin',
    'administrator',
    'technician',
    'user',
    'client'
] as any;

const getUserInitials = (user: User) => {
    const name = user.name || user.username || 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const getAvatarColor = (id: string) => {
    const colors = [
        '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
        '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'
    ];
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
};

interface UserEditModalProps {
    user: User;
    roles: Role[];
    companies: Company[];
    onClose: () => void;
    onSave: (data: any) => void;
    saving: boolean;
}
const UserEditModal: React.FC<UserEditModalProps> = ({ user, roles, companies, onClose, onSave, saving }) => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const currentUserRole = currentUser?.role;
    const currentUserRoleName = (typeof currentUserRole === 'object' && currentUserRole !== null ? (currentUserRole as any).name : String(currentUserRole || '')).toLowerCase();
    const isSuperAdmin = currentUserRoleName === 'super_admin';

    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        role: typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'client',
        status: user.status || 'active',
        company: typeof user.company === 'string' ? user.company : user.company?.id || (currentUser?.company?.id || currentUser?.company || '')
    });

    useEffect(() => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            role: typeof user.role === 'string' ? user.role : (user.role as any)?.name || 'client',
            status: user.status || 'active',
            company: typeof user.company === 'string' ? user.company : user.company?.id || (currentUser?.company?.id || currentUser?.company || '')
        });
    }, [user, currentUser]);

    const isCompanyScopedRole = useMemo(() => {
        const selectedRoleName = String(formData.role || '').toLowerCase();
        return ['company_admin', 'administrator', 'technician'].includes(selectedRoleName);
    }, [formData.role]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    return (
        <div className="overlay" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <Card className="max-w-md w-full relative overflow-hidden" raised style={{ border: '1px solid var(--color-border)', borderRadius: '24px' }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '300px', height: '300px', background: 'var(--color-primary)', filter: 'blur(100px)', opacity: 0.1 }} />
                
                <div className="p-8 relative z-1">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '48px', height: '48px', 
                            borderRadius: '16px', 
                            background: getAvatarColor(user.id), 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 800, fontSize: '1.2rem',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                        }}>
                            {getUserInitials(user)}
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Edit Identity</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Updating platform profile policies.</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <InputField
                            id="edit-user-name"
                            label="Physical Identifier (Name)"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Full Legal Name"
                        />
                        <InputField
                            id="edit-user-email"
                            label="Identity Endpoint (Email)"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            autoComplete="off"
                        />

                        <div className="input-group">
                            <label className="label" htmlFor="edit-user-role">Assigned Role</label>
                            <select id="edit-user-role" name="role" className="input" value={formData.role} onChange={handleChange} style={{ borderRadius: '12px', padding: '12px' }}>
                                {roles.map((role) => (
                                    <option key={typeof role === 'string' ? role : (role as any).id} value={typeof role === 'string' ? role : (role as any).id}>
                                        {String(typeof role === 'string' ? role : (role as any).name).replace(/_/g, ' ').toUpperCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="input-group">
                            <label className="label" htmlFor="edit-user-status">Account Status</label>
                            <select id="edit-user-status" name="status" className="input" value={formData.status} onChange={handleChange} style={{ borderRadius: '12px', padding: '12px' }}>
                                <option value="active">ACTIVE ✓</option>
                                <option value="pending">PENDING ⚖</option>
                                <option value="deactivated">HIDDEN 🔒</option>
                            </select>
                        </div>

                        {(isSuperAdmin || isCompanyScopedRole) ? (
                            <div className="input-group">
                                <label className="label" htmlFor="edit-user-company">Organization Mapping</label>
                                <select
                                    id="edit-user-company"
                                    name="company"
                                    className="input"
                                    value={formData.company}
                                    onChange={handleChange}
                                    required
                                    disabled={!isSuperAdmin}
                                    style={{ borderRadius: '12px', padding: '12px' }}
                                >
                                    <option value="">Select company</option>
                                    {companies.map((company) => (
                                        <option key={company.id} value={company.id}>
                                            {company.name}
                                        </option>
                                    ))}
                                </select>
                                {!isSuperAdmin && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--color-primary)', marginTop: '0.5rem', opacity: 0.8 }}>
                                        ★ Fixed to current organization.
                                    </p>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <div className="flex gap-4 mt-10">
                        <Button variant="secondary" fullWidth onClick={onClose} disabled={saving} style={{ borderRadius: '14px' }}>
                            Discard Changes
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => onSave(formData)}
                            disabled={saving}
                            style={{ borderRadius: '14px', boxShadow: '0 10px 20px rgba(var(--color-primary-rgb), 0.2)' }}
                        >
                            {saving ? 'Saving...' : 'Commit Updates'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
};

const AdminUsersPage: React.FC = () => {
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [searchParams, setSearchParams] = useSearchParams();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'all' | 'admins' | 'clients'>('all');

    const statusFilter = searchParams.get('status') || 'all';
    
    const fetchInitialData = async () => {
        setLoading(true);
        setError('');
        try {
            const params: any = {};
            if (statusFilter && statusFilter !== 'all') {
                params.status = statusFilter;
            }

            const [usersRes, rolesRes, companiesRes] = await Promise.all([
                axios.get(`${API_URL}/users`, { params }),
                axios.get(`${API_URL}/roles`).catch(() => ({ data: DEFAULT_ROLES })),
                axios.get(`${API_URL}/companies`)
            ]);

            setUsers(Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.users || []));
            setRoles(Array.isArray(rolesRes.data) && rolesRes.data.length ? rolesRes.data : DEFAULT_ROLES);
            setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : []);
        } catch (requestError: any) {
            setError(requestError.response?.data?.message || 'Failed to sync platform entities.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [statusFilter]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return users;

        return users.filter((user) => {
            const roleName = String(user.role || '').toLowerCase();
            const companyName = String(user.company?.name || '').toLowerCase();
            return (
                String(user.name || user.username || '').toLowerCase().includes(query) ||
                String(user.email || '').toLowerCase().includes(query) ||
                roleName.includes(query) ||
                companyName.includes(query) ||
                String(user.status || '').toLowerCase().includes(query)
            );
        });
    }, [users, search]);

    const finalDisplayUsers = useMemo(() => {
        let base = filteredUsers;
        if (activeTab === 'admins') {
            base = base.filter(u => ['administrator', 'company_admin'].includes(String(u.role || '').toLowerCase()));
        } else if (activeTab === 'clients') {
            base = base.filter(u => !['administrator', 'company_admin', 'super_admin'].includes(String(u.role || '').toLowerCase()));
        }
        return base;
    }, [filteredUsers, activeTab]);

    const stats = useMemo(() => {
        return {
            total: users.length,
            active: users.filter(u => u.status === 'active').length,
            pending: users.filter(u => u.status === 'pending').length,
            deactivated: users.filter(u => u.status === 'deactivated').length
        };
    }, [users]);

    useEffect(() => {
        setSelectedUserIds([]);
    }, [activeTab, statusFilter, search]);

    const updateLocalUser = (updatedUser: User) => {
        setUsers((previous) => previous.map((entry) => (entry.id === updatedUser.id ? updatedUser : entry)));
    };

    const handleAction = async (id: string, action: string) => {
        setActionLoading(true);
        try {
            const { data } = await axios.put(`${API_URL}/users/${id}/${action}`, {});
            if (data?.user) {
                updateLocalUser(data.user);
            } else {
                await fetchInitialData();
            }
        } catch (requestError: any) {
            window.alert(requestError.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('IRREVERSIBLE: Execute permanent deletion for this identity?')) return;
        setActionLoading(true);
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            setUsers((previous) => previous.filter((entry) => entry.id !== id));
            setSelectedUserIds((previous) => previous.filter(sid => sid !== id));
        } catch (requestError: any) {
            window.alert(requestError.response?.data?.message || 'Removal failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedUserIds.length) return;
        if (!window.confirm(`CRITICAL: Purge ${selectedUserIds.length} users? This bypasses standard deactivation.`)) return;
        
        setActionLoading(true);
        try {
            for (const id of selectedUserIds) {
                await axios.delete(`${API_URL}/users/${id}`);
            }
            setUsers((previous) => previous.filter((entry) => !selectedUserIds.includes(entry.id)));
            setSelectedUserIds([]);
        } catch (requestError: any) {
            window.alert(requestError.response?.data?.message || 'Purge incomplete.');
            await fetchInitialData();
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSelectAll = () => {
        const selectableUsers = finalDisplayUsers.filter(u => u.id !== currentUser?.id);
        if (selectedUserIds.length === selectableUsers.length && selectableUsers.length > 0) {
            setSelectedUserIds([]);
        } else {
            setSelectedUserIds(selectableUsers.map(u => u.id));
        }
    };

    const toggleSelectUser = (id: string) => {
        setSelectedUserIds(prev => 
            prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
        );
    };

    const handleUpdate = async (updatedData: any) => {
        if (!editingUser) return;
        setActionLoading(true);
        try {
            const payload = {
                ...updatedData,
                company: updatedData.company || null
            };
            const { data } = await axios.put(`${API_URL}/users/${editingUser.id}`, payload);
            if (data?.user) {
                updateLocalUser(data.user);
            }
            setEditingUser(null);
        } catch (requestError: any) {
            window.alert(requestError.response?.data?.message || 'Persistence failed');
        } finally {
            setActionLoading(false);
        }
    };

    const setStatusFilterParam = (nextStatus: string) => {
        if (nextStatus === 'all') {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('status');
            setSearchParams(nextParams);
            return;
        }
        setSearchParams({ status: nextStatus });
    };

    return (
        <div className="page">
            <PageHeader
                title={statusFilter === 'pending' ? '🛡️ Identity Validation' : '👥 User Governance Hub'}
                subtitle="Centralized management of platform access, global roles, and organization mapping."
            />

            {/* KPI Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <Card raised className="text-center p-6 border-l-4" style={{ borderColor: 'var(--color-primary)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800 }}>{loading ? '—' : stats.total}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Total Identifiers</div>
                </Card>
                <Card raised className="text-center p-6 border-l-4" style={{ borderColor: 'var(--color-success)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{loading ? '—' : stats.active}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Active Sessions</div>
                </Card>
                <Card raised className="text-center p-6 border-l-4" style={{ borderColor: 'var(--color-warning)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-warning)' }}>{loading ? '—' : stats.pending}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pending Review</div>
                </Card>
                <Card raised className="text-center p-6 border-l-4" style={{ borderColor: 'var(--color-error)' }}>
                    <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--color-error)' }}>{loading ? '—' : stats.deactivated}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Hidden/Locked</div>
                </Card>
            </div>

            {statusFilter === 'pending' && (
                <Alert tone="warning" className="mb-8">
                    <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>⚠️ Pending Entity Lock</span>
                    </div>
                    <p style={{ marginTop: '0.25rem', opacity: 0.9 }}>Validate organization administrators to unlock platform features and product management.</p>
                </Alert>
            )}

            {error ? <Alert tone="error" className="mb-8">{error}</Alert> : null}

            <Card className="w-full relative overflow-hidden" raised style={{ border: '1px solid var(--color-border)', borderRadius: '20px' }}>
                {actionLoading && <Spinner overlay />}

                <div style={{ padding: '2rem', borderBottom: '1px solid var(--color-border)', background: 'var(--color-background-soft)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'flex-start' }}>
                        <div style={{ width: '100%', maxWidth: '600px' }}>
                            <InputField
                                id="admin-user-search"
                                placeholder="Filter identities by name, email, or registry..."
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                icon="search-outline"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <Button size="sm" variant={statusFilter === 'all' ? 'primary' : 'secondary'} onClick={() => setStatusFilterParam('all')}>All Systems</Button>
                            <Button size="sm" variant={statusFilter === 'pending' ? 'warning' : 'secondary'} onClick={() => setStatusFilterParam('pending')}>Pending Only</Button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '2rem', marginTop: '1.5rem', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        {(['all', 'admins', 'clients'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                style={{
                                    background: 'none', border: 'none', padding: '0.75rem 0',
                                    fontSize: '0.9rem', fontWeight: activeTab === tab ? 800 : 500,
                                    color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                    cursor: 'pointer', position: 'relative', outline: 'none'
                                }}
                            >
                                {tab.toUpperCase()}
                                {activeTab === tab && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: 'var(--color-primary)', borderRadius: '100px' }} />}
                            </button>
                        ))}
                    </div>

                    {selectedUserIds.length > 0 && (
                        <div style={{ 
                            display: 'flex', alignItems: 'center', gap: '1rem', 
                            padding: '1rem 1.5rem', background: 'rgba(var(--color-error-rgb), 0.08)', 
                            borderRadius: '16px', border: '1px solid rgba(var(--color-error-rgb), 0.2)',
                            marginTop: '1.5rem'
                        }}>
                            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-error)' }}>
                                {selectedUserIds.length} Identities Selected for Policy Action
                            </span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem' }}>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds([])}>Cancel</Button>
                                <Button size="sm" variant="danger" onClick={handleBulkDelete}>Execute Mass Removal</Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="table-container" style={{ padding: '0 1rem 1rem' }}>
                    <table className="table">
                        <thead>
                            <tr style={{ background: 'transparent' }}>
                                <th style={{ width: '40px', padding: '1.5rem 1rem' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={finalDisplayUsers.length > 0 && selectedUserIds.length === finalDisplayUsers.filter(u => u.id !== currentUser?.id).length}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                    />
                                </th>
                                <th style={{ padding: '1.5rem 1rem' }}>Principal Identity</th>
                                <th style={{ padding: '1.5rem 1rem' }}>Role Authority</th>
                                {activeTab !== 'clients' && <th style={{ padding: '1.5rem 1rem' }}>Entity Mapping</th>}
                                <th style={{ padding: '1.5rem 1rem' }}>Registry Status</th>
                                <th style={{ textAlign: 'right', padding: '1.5rem 1rem' }}>Policy Controls</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 5 }).map((_, index) => (
                                <tr key={`skeleton-row-${index}`}>
                                    <td colSpan={6} style={{ padding: '1.5rem 1rem' }}><Skeleton height={60} /></td>
                                </tr>
                            )) : null}

                            {!loading && finalDisplayUsers.length === 0 ? (
                                <tr>
                                     <td colSpan={activeTab === 'clients' ? 5 : 6} style={{ padding: '4rem' }}>
                                        <EmptyState
                                            icon="person-outline"
                                            title="Registry Sweep Complete"
                                            text="No identities match the current filter or search criteria."
                                        />
                                    </td>
                                </tr>
                            ) : null}

                            {!loading ? finalDisplayUsers.map((entry) => {
                                const roleName = String(typeof entry.role === 'string' ? entry.role : (entry.role as any).name || 'client').toLowerCase();
                                const roleTone = ROLE_BADGE[roleName] || 'neutral';
                                const status = String(entry.status || 'pending').toLowerCase();
                                const statusTone = STATUS_BADGE[status] || 'neutral';
                                const isSelf = currentUser?.id === entry.id;
                                const isPendingAdmin = (roleName === 'administrator' || roleName === 'company_admin') && status === 'pending';

                                return (
                                    <tr key={entry.id} style={{ 
                                        transition: 'background 0.2s',
                                        background: selectedUserIds.includes(entry.id) ? 'rgba(var(--color-primary-rgb), 0.03)' : 'transparent',
                                    }} className="hover:bg-surface-soft">
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUserIds.includes(entry.id)}
                                                onChange={() => toggleSelectUser(entry.id)}
                                                disabled={isSelf}
                                                style={{ cursor: isSelf ? 'not-allowed' : 'pointer', transform: 'scale(1.1)' }}
                                            />
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{ 
                                                    width: '40px', height: '40px', borderRadius: '12px', 
                                                    background: getAvatarColor(entry.id), color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                                                }}>
                                                    {getUserInitials(entry)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                                        {entry.name || entry.username}
                                                        {isSelf && <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', opacity: 0.5 }}>(YOU)</span>}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>{entry.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <Badge tone={roleTone} size="sm">{roleName.replace(/_/g, ' ').toUpperCase()}</Badge>
                                        </td>
                                        {activeTab !== 'clients' && (
                                            <td style={{ padding: '1.25rem 1rem', fontSize: '0.9rem', fontWeight: 500 }}>
                                                {entry.company?.name ? (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <ion-icon name="business-outline" style={{ opacity: 0.5 }}></ion-icon>
                                                        {entry.company.name}
                                                    </span>
                                                ) : (
                                                    <span style={{ opacity: 0.3, letterSpacing: '0.1em', fontSize: '0.7rem' }}>EMPTY_ENTITY</span>
                                                )}
                                            </td>
                                        )}
                                        <td style={{ padding: '1.25rem 1rem' }}>
                                            <Badge tone={statusTone} size="sm">{status.toUpperCase()}</Badge>
                                        </td>
                                        <td style={{ textAlign: 'right', padding: '1.25rem 1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {isPendingAdmin && (
                                                    <Button variant="primary" size="sm" onClick={() => handleAction(entry.id, 'validate')} style={{ fontWeight: 800 }}>
                                                        Verify
                                                    </Button>
                                                )}
                                                <Button variant="ghost" size="sm" onClick={() => setEditingUser(entry)}>
                                                    Configure
                                                </Button>
                                                <Button variant="secondary" size="sm" onClick={() => handleDelete(entry.id)} disabled={isSelf} style={{ color: 'var(--color-error)' }}>
                                                    Remove
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : null}
                        </tbody>
                    </table>
                </div>
            </Card>

            {editingUser ? (
                <UserEditModal
                    user={editingUser}
                    roles={roles}
                    companies={companies}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdate}
                    saving={actionLoading}
                />
            ) : null}
        </div>
    );
};

export default AdminUsersPage;
