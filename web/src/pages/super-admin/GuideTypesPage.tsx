import React, { useEffect, useState } from 'react';
import { PageHeader, Button, Spinner, IonIcon } from '../../components/index';
import { guideService } from '../../services/guideService';

interface GuideTypeForm {
    name: string;
    description: string;
}

export const GuideTypesPage: React.FC = () => {
    const [types, setTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<GuideTypeForm>({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    const fetchTypes = async () => {
        setLoading(true);
        try {
            const res = await guideService.getGuideTypes();
            setTypes(res.data || res || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const openCreateModal = () => {
        setEditingId(null);
        setFormData({ name: '', description: '' });
        setShowModal(true);
    };

    const openEditModal = (type: any) => {
        setEditingId(type.id);
        setFormData({ name: type.name || '', description: type.description || '' });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await guideService.createGuideType(formData);
            setShowModal(false);
            setFormData({ name: '', description: '' });
            setEditingId(null);
            await fetchTypes();
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.message || 'Failed to save guide type');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Guide Types"
                subtitle={`${types.length} types registered`}
                actions={
                    <Button icon={<IonIcon name="add-outline" />} onClick={openCreateModal}>
                        Add Type
                    </Button>
                }
            />

            {loading ? (
                <div style={{ height: '40vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
            ) : types.length === 0 ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
                    <IonIcon name="book-outline" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: '1rem', display: 'block' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Guide Types</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Click "Add Type" to create your first guide type.</p>
                    <Button onClick={openCreateModal} icon={<IonIcon name="add-outline" />}>Create Guide Type</Button>
                </div>
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Description</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {types.map(t => (
                                    <tr key={t.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: 36, height: 36, borderRadius: 'var(--radius-md)',
                                                    background: 'var(--color-primary-light)', color: 'var(--color-primary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '16px', flexShrink: 0
                                                }}>
                                                    <IonIcon name="book-outline" />
                                                </div>
                                                <span style={{ fontWeight: 600, color: 'var(--color-text-strong)' }}>{t.name}</span>
                                            </div>
                                        </td>
                                        <td style={{ maxWidth: '400px' }}>{t.description || <span style={{ color: 'var(--color-text-muted)', fontStyle: 'italic' }}>No description</span>}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(t)}>
                                                <IonIcon name="create-outline" style={{ marginRight: '4px' }} />
                                                Edit
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 1000,
                    backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem', animation: 'fadeIn 0.2s ease'
                }} onClick={() => setShowModal(false)}>
                    <div className="card" style={{ maxWidth: '480px', width: '100%', animation: 'slideUp 0.3s ease' }} onClick={e => e.stopPropagation()}>
                        <div className="card-header">
                            <h3 className="card-title">{editingId ? 'Edit Guide Type' : 'Create Guide Type'}</h3>
                            <button className="btn btn-ghost btn-sm" onClick={() => setShowModal(false)} style={{ padding: '4px' }}>
                                <IonIcon name="close-outline" style={{ fontSize: '20px' }} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                                <div className="input-group">
                                    <label className="label">Name</label>
                                    <input
                                        className="input"
                                        type="text"
                                        placeholder="e.g. Battery Replacement"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        autoFocus
                                    />
                                </div>
                                <div className="input-group" style={{ marginBottom: 0 }}>
                                    <label className="label">Description</label>
                                    <textarea
                                        className="input"
                                        rows={3}
                                        placeholder="Describe what this guide type covers..."
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', padding: 'var(--space-4) var(--space-6)', borderTop: '1px solid var(--color-border)' }}>
                                <Button variant="ghost" type="button" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button type="submit" loading={saving}>
                                    {editingId ? 'Save Changes' : 'Create Type'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>
        </div>
    );
};
