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

const ROLE_BADGE: Record<string, 'accent' | 'info' | 'primary' | 'neutral' | 'success' | 'danger' | 'warning' | 'ghost'> = {
    super_admin: 'accent',
    administrator: 'info',
    company_admin: 'info',
    client: 'primary',
};

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'danger' | 'neutral' | 'info' | 'primary' | 'warning' | 'ghost'> = {
    active: 'success',
    pending: 'warning',
    deactivated: 'danger'
};

const DEFAULT_ROLES: Role[] = [
    { id: 'super_admin', name: 'super_admin' },
    { id: 'company_admin', name: 'company_admin' },
    { id: 'administrator', name: 'administrator' },
    { id: 'technician', name: 'technician' },
    { id: 'user', name: 'user' },
    { id: 'client', name: 'client' }
];

interface UserEditModalProps {
    user: User;
    roles: Role[];
    companies: Company[];
    onClose: () => void;
    onSave: (data: any) => void;
    saving: boolean;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, roles, companies, onClose, onSave, saving }) => {
    const [formData, setFormData] = useState({
        name: user.name || '',
        email: user.email || '',
        role: user.role?.id || user.role?.name || (typeof user.role === 'string' ? user.role : 'client'),
        status: user.status || 'active',
        company: user.company?.id || (typeof user.company === 'string' ? user.company : '')
    });

    useEffect(() => {
        setFormData({
            name: user.name || '',
            email: user.email || '',
            role: user.role?.id || user.role?.name || (typeof user.role === 'string' ? user.role : 'client'),
            status: user.status || 'active',
            company: user.company?.id || (typeof user.company === 'string' ? user.company : '')
        });
    }, [user]);

    const isAdministrator = useMemo(() => {
        const selectedRole = roles.find(r => (r.id === formData.role || r.name === formData.role));
        if (!selectedRole) return false;
        const name = String(selectedRole.name || '').toLowerCase();
        return name === 'company_admin' || name === 'administrator';
    }, [formData.role, roles]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormData((previous) => ({ ...previous, [name]: value }));
    };

    return (
        <div className="overlay" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.4)' }}>
            <Card className="max-w-md w-full">
                <div className="p-6">
                    <h3 className="mb-6 text-xl font-bold">Edit User</h3>

                    <InputField
                        id="edit-user-name"
                        label="Full Name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                    />
                    <InputField
                        id="edit-user-email"
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                    />

                    <div className="input-group">
                        <label className="label" htmlFor="edit-user-role">Role</label>
                        <select id="edit-user-role" name="role" className="input" value={formData.role} onChange={handleChange}>
                            {roles.map((role) => (
                                <option key={role.id || role.name} value={role.id || role.name}>
                                    {String(role.name).replace('_', ' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="label" htmlFor="edit-user-status">Status</label>
                        <select id="edit-user-status" name="status" className="input" value={formData.status} onChange={handleChange}>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="deactivated">Deactivated</option>
                        </select>
                    </div>

                    {isAdministrator ? (
                        <div className="input-group">
                            <label className="label" htmlFor="edit-user-company">Company</label>
                            <select
                                id="edit-user-company"
                                name="company"
                                className="input"
                                value={formData.company}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select company</option>
                                {companies.map((company) => (
                                    <option key={company.id} value={company.id}>
                                        {company.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <div className="flex gap-4 mt-8">
                        <Button variant="secondary" fullWidth onClick={onClose} disabled={saving}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            fullWidth
                            onClick={() => onSave(formData)}
                            disabled={saving}
                        >
                            Save
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
            setError(requestError.response?.data?.message || 'Failed to load users.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInitialData();
    }, [statusFilter]);

    const filteredUsers = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) {
            return users;
        }

        return users.filter((user) => {
            const roleName = String(user.role?.name || user.role || '').toLowerCase();
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
            base = base.filter(u => ['administrator', 'company_admin'].includes(String(u.role?.name || u.role || '').toLowerCase()));
        } else if (activeTab === 'clients') {
            base = base.filter(u => !['administrator', 'company_admin', 'super_admin'].includes(String(u.role?.name || u.role || '').toLowerCase()));
        }
        return base;
    }, [filteredUsers, activeTab]);

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
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        setActionLoading(true);
        try {
            await axios.delete(`${API_URL}/users/${id}`);
            setUsers((previous) => previous.filter((entry) => entry.id !== id));
            setSelectedUserIds((previous) => previous.filter(sid => sid !== id));
        } catch (requestError: any) {
            window.alert(requestError.response?.data?.message || 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedUserIds.length) return;
        if (!window.confirm(`Are you sure you want to delete ${selectedUserIds.length} users? This action is permanent.`)) return;
        
        setActionLoading(true);
        try {
            for (const id of selectedUserIds) {
                await axios.delete(`${API_URL}/users/${id}`);
            }
            setUsers((previous) => previous.filter((entry) => !selectedUserIds.includes(entry.id)));
            setSelectedUserIds([]);
        } catch (requestError: any) {
            window.alert(requestError.response?.data?.message || 'Bulk delete failed. Some users might not have been deleted.');
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
            window.alert(requestError.response?.data?.message || 'Update failed');
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
                title={statusFilter === 'pending' ? 'Pending Approvals' : 'User Management'}
                subtitle={statusFilter === 'pending' ? '' : 'Manage all platform users and roles.'}
            />

            {statusFilter === 'pending' && (
                <Alert tone="warning" className="mb-6" style={{ borderLeft: '4px solid var(--color-warning)' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>ACTION REQUIRED</div>
                    <div>Review and validate new administrator accounts to grant platform access.</div>
                </Alert>
            )}

            {error ? <Alert tone="error" className="mb-6">{error}</Alert> : null}

            <Card className="w-full" raised style={{ position: 'relative', overflow: 'hidden' }}>
                {actionLoading && <Spinner overlay />}

                <div style={{ padding: 'var(--space-4)', borderBottom: '1px solid var(--color-border)', display: 'grid', gap: '0.75rem' }}>
                    <InputField
                        id="admin-user-search"
                        label="Search Users"
                        placeholder="Search by name, email, role, company, or status"
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                    />

                    <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
                        <button
                            onClick={() => setActiveTab('all')}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'all' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === 'all' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                fontWeight: activeTab === 'all' ? 700 : 400,
                                cursor: 'pointer',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setActiveTab('admins')}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'admins' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === 'admins' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                fontWeight: activeTab === 'admins' ? 700 : 400,
                                cursor: 'pointer',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            Company Administrators
                        </button>
                        <button
                            onClick={() => setActiveTab('clients')}
                            style={{
                                background: 'none',
                                border: 'none',
                                borderBottom: activeTab === 'clients' ? '2px solid var(--color-primary)' : '2px solid transparent',
                                color: activeTab === 'clients' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                fontWeight: activeTab === 'clients' ? 700 : 400,
                                cursor: 'pointer',
                                padding: '0.5rem 1rem'
                            }}
                        >
                            Regular Users / Clients
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Button
                            size="sm"
                            variant={statusFilter === 'all' ? 'primary' : 'ghost'}
                            onClick={() => setStatusFilterParam('all')}
                        >
                            All
                        </Button>
                        <Button
                            size="sm"
                            variant={statusFilter === 'pending' ? 'primary' : 'ghost'}
                            onClick={() => setStatusFilterParam('pending')}
                        >
                            Pending
                        </Button>
                        <Button
                            size="sm"
                            variant={statusFilter === 'deactivated' ? 'primary' : 'ghost'}
                            onClick={() => setStatusFilterParam('deactivated')}
                        >
                            Deactivated
                        </Button>
                    </div>

                    {selectedUserIds.length > 0 && (
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '1rem', 
                            padding: '0.75rem 1rem', 
                            backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-error)',
                            marginTop: '0.5rem',
                            marginBottom: '1rem'
                        }}>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-error)' }}>
                                {selectedUserIds.length} users selected
                            </span>
                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                                <Button size="sm" variant="ghost" onClick={() => setSelectedUserIds([])}>
                                    Deselect All
                                </Button>
                                <Button size="sm" variant="secondary" style={{ color: 'var(--color-error)' }} onClick={handleBulkDelete}>
                                    Delete Selected
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr className="table-head-row">
                                <th style={{ width: '40px' }}>
                                    <input 
                                        type="checkbox" 
                                        checked={finalDisplayUsers.length > 0 && selectedUserIds.length === finalDisplayUsers.filter(u => u.id !== currentUser?.id).length}
                                        onChange={toggleSelectAll}
                                        style={{ cursor: 'pointer' }}
                                    />
                                </th>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                {activeTab !== 'clients' && <th>Company</th>}
                                <th>Status</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? Array.from({ length: 5 }).map((_, index) => (
                                <tr key={`skeleton-row-${index}`}>
                                    <td><Skeleton width={20} /></td>
                                    <td><Skeleton width="70%" /></td>
                                    <td><Skeleton width="85%" /></td>
                                    <td><Skeleton width={90} /></td>
                                    <td><Skeleton width="75%" /></td>
                                    <td><Skeleton width={80} /></td>
                                    <td><Skeleton width={180} /></td>
                                </tr>
                            )) : null}

                            {!loading && finalDisplayUsers.length === 0 ? (
                                <tr>
                                     <td colSpan={activeTab === 'clients' ? 6 : 7}>
                                        <EmptyState
                                            title="No users found"
                                            text="Try another search query or status filter."
                                        />
                                    </td>
                                </tr>
                            ) : null}

                            {!loading ? finalDisplayUsers.map((entry) => {
                                const roleName = String(entry.role?.name || entry.role || 'client').toLowerCase();
                                const roleTone = ROLE_BADGE[roleName] || 'neutral';
                                const status = String(entry.status || 'pending').toLowerCase();
                                const statusTone = STATUS_BADGE[status] || 'neutral';
                                const isSelf = currentUser?.id === entry.id;
                                const isPendingAdmin = (roleName === 'administrator' || roleName === 'company_admin') && status === 'pending';

                                return (
                                    <tr key={entry.id} style={{ backgroundColor: selectedUserIds.includes(entry.id) ? 'rgba(79, 70, 229, 0.05)' : 'transparent' }}>
                                        <td>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedUserIds.includes(entry.id)}
                                                onChange={() => toggleSelectUser(entry.id)}
                                                disabled={isSelf}
                                                style={{ cursor: isSelf ? 'not-allowed' : 'pointer' }}
                                            />
                                        </td>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{entry.name || entry.username}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>@{entry.username}</div>
                                        </td>
                                        <td style={{ fontSize: '0.9rem' }}>{entry.email}</td>
                                        <td>
                                            <Badge tone={roleTone}>{roleName.replace('_', ' ')}</Badge>
                                        </td>
                                        {activeTab !== 'clients' && (
                                            <td>{entry.company?.name || (roleName === 'administrator' || roleName === 'company_admin' ? 'UNASSIGNED' : 'N/A')}</td>
                                        )}
                                        <td>
                                            <Badge tone={statusTone}>{status}</Badge>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                {isPendingAdmin ? (
                                                    <Button
                                                        variant="primary"
                                                        size="sm"
                                                        style={{ fontWeight: 700, backgroundColor: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                                                        onClick={() => handleAction(entry.id, 'validate')}
                                                    >
                                                        Approve Access
                                                    </Button>
                                                ) : null}

                                                <Button variant="ghost" size="sm" onClick={() => setEditingUser(entry)}>
                                                    Edit
                                                </Button>

                                                {status === 'active' ? (
                                                    <Button
                                                        variant="warning"
                                                        size="sm"
                                                        onClick={() => handleAction(entry.id, 'deactivate')}
                                                        disabled={isSelf}
                                                    >
                                                        Deactivate
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={() => handleAction(entry.id, 'activate')}
                                                    >
                                                        Activate
                                                    </Button>
                                                )}

                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    style={{ color: 'var(--color-error)' }}
                                                    onClick={() => handleDelete(entry.id)}
                                                    disabled={isSelf}
                                                >
                                                    Delete
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
