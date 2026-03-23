import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useSelector } from 'react-redux';
import { Alert, Button, Card, EmptyState, InputField, PageHeader, Skeleton } from '../components/ui';

const AdminCategoryPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [categories, setCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        parent: '',
        summary: '',
        description: '',
        visibility: 'draft',
        sortOrder: 0,
        icon: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchData = async () => {
        try {
            const [treeRes, flatRes] = await Promise.all([
                axios.get(`${API_URL}/categories?tree=true`, config),
                axios.get(`${API_URL}/categories`, config)
            ]);
            setCategories(Array.isArray(treeRes.data) ? treeRes.data : []);
            setFlatCategories(Array.isArray(flatRes.data) ? flatRes.data : []);
            setLoading(false);
        } catch (err) {
            setError("Failed to load categories");
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            // Calculate level based on parent
            let level = 0;
            if (formData.parent) {
                const parentCat = flatCategories.find(c => c.id === formData.parent);
                if (parentCat) level = (parentCat.level || 0) + 1;
            }

            const payload = {
                ...formData,
                parent: formData.parent || null,
                level,
                image: formData.icon ? { url: formData.icon } : null // Simple image handling
            };

            if (editingId) {
                await axios.put(`${API_URL}/categories/${editingId}`, payload, config);
            } else {
                await axios.post(`${API_URL}/categories`, payload, config);
            }
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed");
        }
    };

    const resetForm = () => {
        setFormData({
            name: '', slug: '', parent: '',
            summary: '', description: '',
            visibility: 'draft', sortOrder: 0, icon: ''
        });
        setEditingId(null);
    };

    const handleEdit = (cat) => {
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            slug: cat.slug,
            parent: cat.parent?.id || cat.parent || '',
            summary: cat.summary || '',
            description: cat.description || '',
            visibility: cat.visibility || 'draft',
            sortOrder: cat.sortOrder || 0,
            icon: cat.image?.url || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${API_URL}/categories/${deleteTarget}`, config);
            setDeleteTarget(null);
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Delete failed"); // Show in UI
            setDeleteTarget(null);
        }
    };

    const renderTree = (cats, depth = 0) => {
        return cats.map(cat => (
            <React.Fragment key={cat.id}>
                <tr>
                    <td style={{ paddingLeft: `${depth * 20 + 16}px` }}>
                        <span style={{ color: 'var(--color-text-muted)', marginRight: 8 }}>
                            {depth > 0 ? '└─' : ''}
                        </span>
                        <span style={{ fontWeight: depth === 0 ? 600 : 500, color: 'var(--color-text-strong)' }}>
                            {cat.name}
                        </span>
                        {cat.visibility !== 'public' && (
                            <span className="ml-2 text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                                {cat.visibility}
                            </span>
                        )}
                    </td>
                    <td className="text-slate-500 text-sm">{cat.slug}</td>
                    <td className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(cat)}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setDeleteTarget(cat.id)}>Delete</Button>
                    </td>
                </tr>
                {cat.children && renderTree(cat.children, depth + 1)}
            </React.Fragment>
        ));
    };

    return (
        <div className="page">
            <PageHeader
                title="Category Management"
                subtitle="Organize products into a hierarchical taxonomy."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 'var(--space-6)' }}>
                {/* Form */}
                <Card className="sticky top-20 h-fit max-h-[calc(100vh-100px)] overflow-y-auto" raised>
                    <h3 className="mb-4 font-semibold text-lg">
                        {editingId ? 'Edit Category' : 'New Category'}
                    </h3>
                    {error && <Alert tone="error" className="mb-4">{error}</Alert>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <InputField
                            label="Name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <InputField
                            label="Slug"
                            value={formData.slug}
                            onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            placeholder="Auto-generated"
                        />
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-slate-700">Parent Category</label>
                            <select
                                className="input select"
                                value={formData.parent}
                                onChange={e => setFormData({ ...formData, parent: e.target.value })}
                            >
                                <option value="">None (Top Level)</option>
                                {flatCategories.filter(c => c.id !== editingId).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {'-'.repeat((c.level || 0) * 2)} {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium text-slate-700">Visibility</label>
                                <select
                                    className="input select"
                                    value={formData.visibility}
                                    onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                >
                                    <option value="draft">Draft</option>
                                    <option value="public">Public</option>
                                    <option value="private">Private</option>
                                </select>
                            </div>
                            <InputField
                                label="Sort Order"
                                type="number"
                                value={formData.sortOrder}
                                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <InputField
                            label="Icon URL"
                            value={formData.icon}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="https://..."
                        />

                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-slate-700">Summary (SEO)</label>
                            <textarea
                                className="input min-h-[60px]"
                                value={formData.summary}
                                onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                maxLength={160}
                            />
                        </div>

                        <div className="flex gap-2 mt-2 sticky bottom-0 bg-white pt-2 border-t">
                            <Button type="submit" variant="primary" fullWidth>
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="secondary" onClick={resetForm}>
                                    Cancel
                                </Button>
                            )}
                        </div>
                    </form>
                </Card>

                {/* Tree Table */}
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr className="table-head-row">
                                <th>Hierarchy</th>
                                <th>Slug</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i}>
                                        <td><Skeleton width={140 + (i % 3) * 40} /></td>
                                        <td><Skeleton width={100} /></td>
                                        <td><Skeleton width={80} style={{ float: 'right' }} /></td>
                                    </tr>
                                ))
                            ) : categories.length === 0 ? (
                                <tr>
                                    <td colSpan="3">
                                        <EmptyState
                                            icon="[]"
                                            title="No categories"
                                            text="Start building your taxonomy."
                                        />
                                    </td>
                                </tr>
                            ) : renderTree(categories)}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirm Dialog */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white p-6 rounded-lg max-w-sm w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2">Delete Category</h3>
                        <p className="text-slate-600 mb-6">
                            Are you sure? This might affect products using this category.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button variant="danger" onClick={confirmDelete}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoryPage;
