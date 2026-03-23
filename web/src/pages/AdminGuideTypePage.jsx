import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Alert, Button, Card, EmptyState, InputField, PageHeader, Skeleton } from '../components/ui';

const AdminGuideTypePage = () => {
    const { token } = useSelector((state) => state.auth);
    const [guideTypes, setGuideTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', icon: '' });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/guidetypes`, config);
            setGuideTypes(data);
        } catch (err) {
            setError('Failed to load guide types');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (editingId) {
                await axios.put(`${API_URL}/guidetypes/${editingId}`, formData, config);
            } else {
                await axios.post(`${API_URL}/guidetypes`, formData, config);
            }
            setFormData({ name: '', slug: '', description: '', icon: '' });
            setEditingId(null);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Operation failed');
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setFormData({
            name: item.name,
            slug: item.slug,
            description: item.description || '',
            icon: item.icon || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="page">
            <PageHeader
                title="Guide Types"
                subtitle="Manage types of guides (e.g. Replacement, Troubleshooting)."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-6)' }}>
                {/* Form */}
                <Card className="sticky-card" style={{ height: 'fit-content', position: 'sticky', top: 80 }}>
                    <h3 style={{ marginBottom: 'var(--space-4)' }}>
                        {editingId ? 'Edit Guide Type' : 'New Guide Type'}
                    </h3>
                    {error && <Alert tone="error" style={{ marginBottom: 'var(--space-4)' }}>{error}</Alert>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                        <InputField
                            id="gt-name"
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Replacement"
                            required
                        />
                        <InputField
                            id="gt-slug"
                            label="Slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="Auto-generated if empty"
                        />
                        <InputField
                            id="gt-icon"
                            label="Icon (Emoji)"
                            value={formData.icon}
                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="e.g. 🔧"
                        />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                            <label className="label">Description</label>
                            <textarea
                                className="input"
                                style={{ minHeight: 80 }}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Description of this guide type..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                            <Button type="submit" variant="primary" fullWidth>
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="secondary" onClick={() => {
                                    setEditingId(null);
                                    setFormData({ name: '', slug: '', description: '', icon: '' });
                                }}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Table */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr className="table-head-row">
                                <th style={{ width: 40 }}>Icon</th>
                                <th>Name / Slug</th>
                                <th>Description</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 4 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton width={24} height={24} borderRadius={12} /></td>
                                        <td><Skeleton width="60%" /></td>
                                        <td><Skeleton width="80%" /></td>
                                        <td><Skeleton width={80} style={{ float: 'right' }} /></td>
                                    </tr>
                                ))
                            ) : guideTypes.length === 0 ? (
                                <tr>
                                    <td colSpan="4">
                                        <EmptyState
                                            icon="[]"
                                            title="No guide types"
                                            text="Create one to categorize guides."
                                        />
                                    </td>
                                </tr>
                            ) : guideTypes.map((gt) => (
                                <tr key={gt.id}>
                                    <td style={{ fontSize: '1.2rem', textAlign: 'center' }}>
                                        {gt.icon || '📄'}
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>{gt.name}</div>
                                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{gt.slug}</div>
                                    </td>
                                    <td style={{ color: 'var(--color-text-muted)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {gt.description || '-'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(gt)}>
                                            Edit
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminGuideTypePage;
