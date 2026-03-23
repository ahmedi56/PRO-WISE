import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Alert, Badge, Button, Card, EmptyState, InputField, PageHeader, Skeleton, Spinner } from '../components/ui';

const AdminCompanyPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '', status: 'active' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchCompanies = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get(`${API_URL}/companies`, config);
            setCompanies(Array.isArray(data) ? data : []);
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [token]);

    const resetForm = () => {
        setEditingId(null);
        setFormData({ name: '', description: '', status: 'active' });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setActionLoading(true);
        try {
            if (editingId) {
                await axios.put(`${API_URL}/companies/${editingId}`, formData, config);
                resetForm();
                await fetchCompanies();
            }
        } catch (requestError) {
            setError(requestError.response?.data?.message || 'Operation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (company) => {
        setEditingId(company.id);
        setFormData({
            name: company.name || '',
            description: company.description || '',
            status: company.status || 'active'
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStatusAction = async (companyId, action) => {
        setActionLoading(true);
        try {
            await axios.put(`${API_URL}/companies/${companyId}/${action}`, {}, config);
            await fetchCompanies();
        } catch (requestError) {
            window.alert(requestError.response?.data?.message || `${action} failed`);
        } finally {
            setActionLoading(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setActionLoading(true);
        try {
            await axios.delete(`${API_URL}/companies/${deleteTarget}`, config);
            setDeleteTarget(null);
            await fetchCompanies();
        } catch (requestError) {
            window.alert(requestError.response?.data?.message || 'Delete failed');
            setDeleteTarget(null);
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="page">
            <PageHeader
                title="Company Management"
                subtitle="Create, edit, activate, deactivate, and retire companies."
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: 'var(--space-6)', alignItems: 'start' }}>
                <Card raised>
                    <div className="p-6">
                        <h3 className="mb-6 text-xl font-bold">
                            {editingId ? 'Edit Company' : 'Select a Company'}
                        </h3>

                        {error ? <Alert tone="error">{error}</Alert> : null}

                        {editingId ? (
                            <form onSubmit={handleSubmit}>
                                <InputField
                                    id="company-name"
                                    label="Company Name"
                                    value={formData.name}
                                    onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                                    placeholder="e.g. Atlas Copco"
                                    required
                                />

                                <div className="input-group">
                                    <label className="label" htmlFor="company-desc">Description</label>
                                    <textarea
                                        id="company-desc"
                                        className="input"
                                        rows={4}
                                        value={formData.description}
                                        onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                                        placeholder="Company mission or profile..."
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="label" htmlFor="company-status">Status</label>
                                    <select
                                        id="company-status"
                                        className="input"
                                        value={formData.status}
                                        onChange={(event) => setFormData({ ...formData, status: event.target.value })}
                                    >
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="deactivated">Deactivated</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                                    <Button type="submit" variant="primary" fullWidth disabled={actionLoading}>
                                        Update
                                    </Button>

                                    <Button type="button" variant="secondary" onClick={resetForm} disabled={actionLoading}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
                                Companies are created when a new company administrator registers on the platform. 
                                Please select an existing company from the list to review, approve, or edit its profile.
                            </p>
                        )}
                    </div>
                </Card>

                <Card className="p-0" raised style={{ position: 'relative', overflow: 'hidden' }}>
                    {(loading || actionLoading) ? <Spinner overlay /> : null}

                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr className="table-head-row">
                                    <th>Company</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'center' }}>Products</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && companies.length === 0 ? (
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            <td><Skeleton width="70%" /></td>
                                            <td><Skeleton width="85%" /></td>
                                            <td><Skeleton width={80} /></td>
                                            <td><Skeleton width={40} /></td>
                                            <td><Skeleton width={170} style={{ float: 'right' }} /></td>
                                        </tr>
                                    ))
                                ) : null}

                                {!loading && companies.length === 0 ? (
                                    <tr>
                                        <td colSpan="5">
                                            <EmptyState
                                                title="No companies found"
                                                text="Create your first company to get started."
                                            />
                                        </td>
                                    </tr>
                                ) : null}

                                {!loading ? companies.map((company) => {
                                    const isActive = company.status !== 'deactivated';
                                    return (
                                        <tr key={company.id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{company.name}</div>
                                            </td>
                                            <td style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                                {company.description || 'No description provided.'}
                                            </td>
                                            <td>
                                                <Badge tone={isActive ? 'success' : 'danger'}>
                                                    {company.status || 'active'}
                                                </Badge>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <Badge tone="neutral">
                                                    {company.products?.length || 0}
                                                </Badge>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(company)}>
                                                        Edit
                                                    </Button>

                                                    {isActive ? (
                                                        <Button
                                                            variant="warning"
                                                            size="sm"
                                                            onClick={() => handleStatusAction(company.id, 'deactivate')}
                                                        >
                                                            Deactivate
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="success"
                                                            size="sm"
                                                            onClick={() => handleStatusAction(company.id, 'activate')}
                                                        >
                                                            Activate
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        style={{ color: 'var(--color-error)' }}
                                                        onClick={() => setDeleteTarget(company.id)}
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
            </div>

            {deleteTarget ? (
                <div className="overlay" style={{ backdropFilter: 'blur(10px)', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <Card className="max-w-sm w-full" raised>
                        <div className="p-6 text-center">
                            <h3 className="mb-4 font-bold text-xl">Delete company?</h3>
                            <p className="mb-8 text-muted text-sm">
                                This will permanently remove the company if no products or users are linked to it.
                            </p>
                            <div className="flex gap-4">
                                <Button variant="secondary" fullWidth onClick={() => setDeleteTarget(null)}>
                                    Cancel
                                </Button>
                                <Button variant="danger" fullWidth onClick={confirmDelete}>
                                    Confirm Delete
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            ) : null}
        </div>
    );
};

export default AdminCompanyPage;
