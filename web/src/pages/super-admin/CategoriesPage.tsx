import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Spinner, IonIcon } from '../../components/index';
import { categoryService } from '../../services/categoryService';

export const CategoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = () => {
        setLoading(true);
        categoryService.getCategories().then(res => {
            setCategories(res.data || res || []);
        }).catch(err => {
            console.error(err);
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`Are you sure you want to delete category "${name}"?`)) return;
        try {
            await categoryService.deleteCategory(id);
            fetchCategories();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to delete category');
        }
    };

    return (
        <div>
            <PageHeader
                title="Category Registry"
                subtitle={`${categories.length} categories`}
                actions={
                    <Button icon={<IonIcon name="add-outline" />} onClick={() => navigate('/admin/categories/new')}>
                        Add Category
                    </Button>
                }
            />

            {loading ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
            ) : categories.length === 0 ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <IonIcon name="grid-outline" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: '1rem', display: 'block' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Categories</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Create your first category to get started.</p>
                    <Button onClick={() => navigate('/admin/categories/new')} icon={<IonIcon name="add-outline" />}>Create Category</Button>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Slug</th>
                                    <th>Products</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {categories.map(cat => (
                                    <tr key={cat.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                    background: 'rgba(139,92,246,0.12)', color: '#8B5CF6',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '16px', flexShrink: 0
                                                }}>
                                                    <IonIcon name="grid-outline" />
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{cat.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ color: 'var(--color-text-muted)', fontFamily: 'monospace', fontSize: 'var(--text-sm)' }}>{cat.slug || cat.id}</td>
                                        <td><span className="badge badge-neutral">{cat.count || 0}</span></td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/admin/categories/${cat.id}/edit`)}>
                                                    <IonIcon name="create-outline" style={{ marginRight: '4px' }} />
                                                    Edit
                                                </button>
                                                <button
                                                    className="btn btn-ghost btn-sm"
                                                    onClick={() => handleDelete(cat.id, cat.name)}
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
