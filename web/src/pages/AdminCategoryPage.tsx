import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '@/config';
import { useSelector } from 'react-redux';
import { Alert, Button, Card, EmptyState, InputField, PageHeader, Skeleton, Badge } from '@/components/ui';
import { RootState } from '@/store';
import { Category } from '@/types/product';

const IonIcon = 'ion-icon' as any;

interface CategoryWithChildren extends Category {
    id: string; 
    children?: CategoryWithChildren[];
    visibility?: 'public' | 'draft' | 'private';
    level?: number;
    parent?: any;
    summary?: string;
    description?: string;
    sortOrder?: number;
    image?: { url: string };
}

// Inline Glassmorphic Styles
const GS: any = {
    grid: {
        display: 'grid',
        gridTemplateColumns: '400px 1fr',
        gap: '2rem',
        alignItems: 'start',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2.5rem',
    },
    statCard: (borderColor: string = 'var(--color-border)') => ({
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '20px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    }),
    statValue: (color = 'var(--color-text-strong)') => ({
        fontSize: '2.25rem',
        fontWeight: 900,
        color,
        lineHeight: 1,
        letterSpacing: '-0.02em',
    }),
    statLabel: {
        fontSize: '0.7rem',
        fontWeight: 800,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase' as any,
        letterSpacing: '0.1em',
    },
    formGlass: {
        position: 'sticky' as any,
        top: '20px',
        background: 'rgba(var(--color-background-rgb), 0.7)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(var(--color-border-rgb), 0.5)',
        borderRadius: '32px',
        padding: '32px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
    },
    formTitle: {
        fontSize: '1.25rem',
        fontWeight: 900,
        color: 'var(--color-text-strong)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        letterSpacing: '-0.01em',
    },
    inputIcon: {
        width: '32px', height: '32px',
        borderRadius: '10px',
        background: 'var(--color-primary-soft)',
        color: 'var(--color-primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
    },
    treeHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '24px 32px',
        borderBottom: '1px solid var(--color-border)',
        background: 'rgba(var(--color-surface-raised-rgb), 0.4)',
    },
    treeRow: (depth: number, isHovered: boolean, isActive: boolean) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '14px 32px',
        paddingLeft: `${depth * 32 + 32}px`,
        borderBottom: '1px solid rgba(var(--color-border-rgb), 0.5)',
        cursor: 'pointer',
        background: isActive ? 'rgba(var(--color-primary-rgb), 0.08)' : (isHovered ? 'rgba(var(--color-primary-rgb), 0.03)' : 'transparent'),
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative' as any,
    }),
    levelBadge: (level: number) => {
        const variants: any = {
            0: { tone: 'primary', label: 'Domain' },
            1: { tone: 'success', label: 'Family' },
            2: { tone: 'warning', label: 'Device' },
        };
        const v = variants[level] || { tone: 'neutral', label: 'Layer' };
        return {
            background: `rgba(var(--color-${v.tone}-rgb), 0.15)`,
            color: `var(--color-${v.tone})`,
            padding: '2px 10px',
            borderRadius: '100px',
            fontSize: '0.6rem',
            fontWeight: 900,
            textTransform: 'uppercase' as any,
            letterSpacing: '0.05em',
            marginLeft: '12px',
        };
    },
};

const AdminCategoryPage: React.FC = () => {
    const [categories, setCategories] = useState<CategoryWithChildren[]>([]);
    const [flatCategories, setFlatCategories] = useState<CategoryWithChildren[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState(new Set<string>());
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '', slug: '', parent: '',
        summary: '', description: '',
        visibility: 'draft', sortOrder: 0, icon: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchData = async () => {
        try {
            const [treeRes, flatRes] = await Promise.all([
                axios.get(`${API_URL}/categories?tree=true`),
                axios.get(`${API_URL}/categories`)
            ]);
            setCategories(Array.isArray(treeRes.data) ? treeRes.data : []);
            setFlatCategories(Array.isArray(flatRes.data) ? flatRes.data : []);
            setLoading(false);
            if (!expandedIds.size) {
                 const topIds = new Set<string>((treeRes.data || []).map((c: any) => c.id));
                 setExpandedIds(topIds);
            }
        } catch (err) {
            setError("Failed to synchronize taxonomy registry.");
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const stats = useMemo(() => {
        const total = flatCategories.length;
        const domains = flatCategories.filter(c => (c.level || 0) === 0).length;
        const families = flatCategories.filter(c => (c.level || 0) === 1).length;
        const devices = flatCategories.filter(c => (c.level || 0) === 2).length;
        const published = flatCategories.filter(c => c.visibility === 'public').length;
        return { total, domains, families, devices, published };
    }, [flatCategories]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaving(true);
        try {
            let level = 0;
            if (formData.parent) {
                const parentCat = flatCategories.find(c => c.id === formData.parent);
                if (parentCat) level = (parentCat.level || 0) + 1;
            }
            const payload = {
                ...formData,
                parent: formData.parent || null,
                level,
                image: formData.icon ? { url: formData.icon } : null
            };

            if (editingId) {
                await axios.put(`${API_URL}/categories/${editingId}`, payload);
                setSuccess('Registry entry updated.');
            } else {
                await axios.post(`${API_URL}/categories`, payload);
                setSuccess('New registry entry created.');
            }
            resetForm();
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Persistence failed.");
        } finally {
            setSaving(false);
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

    const handleEdit = (cat: CategoryWithChildren) => {
        setEditingId(cat.id);
        setFormData({
            name: cat.name,
            slug: cat.slug || '',
            parent: cat.parent?.id || (typeof cat.parent === 'string' ? cat.parent : ''),
            summary: cat.summary || '',
            description: cat.description || '',
            visibility: cat.visibility || 'draft',
            sortOrder: cat.sortOrder || 0,
            icon: cat.image?.url || ''
        });
        setSuccess(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${API_URL}/categories/${deleteTarget}`);
            setDeleteTarget(null);
            setSuccess('Category purged from registry.');
            fetchData();
        } catch (err: any) {
            setError(err.response?.data?.message || "Removal failed.");
            setDeleteTarget(null);
        }
    };

    const toggleExpand = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const matchesSearch = (cat: CategoryWithChildren): boolean => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (cat.name.toLowerCase().includes(q)) return true;
        if (cat.slug?.toLowerCase().includes(q)) return true;
        return cat.children?.some(child => matchesSearch(child)) || false;
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(matchesSearch);
    }, [categories, searchQuery]);

    const renderTreeRow = (cat: CategoryWithChildren, depth = 0) => {
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedIds.has(cat.id);
        const isHovered = hoveredId === cat.id;
        const isActive = editingId === cat.id;

        return (
            <React.Fragment key={cat.id}>
                <div
                    style={GS.treeRow(depth, isHovered, isActive)}
                    onMouseEnter={() => setHoveredId(cat.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => handleEdit(cat)}
                >
                    {/* Depth Connector Line */}
                    {depth > 0 && <div style={{ position: 'absolute', left: `${depth * 32}px`, top: 0, bottom: 0, width: '1px', background: 'rgba(var(--color-primary-rgb), 0.1)' }} />}

                    <div style={{ width: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                        {hasChildren && (
                            <button
                                style={{ 
                                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onClick={(e) => toggleExpand(cat.id, e)}
                            >
                                <IonIcon name="chevron-forward-outline" style={{ fontSize: '0.9rem' }}></IonIcon>
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, zIndex: 1 }}>
                        <IonIcon 
                            name={cat.image?.url || (hasChildren ? (isExpanded ? 'folder-open-outline' : 'folder-outline') : 'cube-outline')} 
                            style={{ fontSize: '1.2rem', color: isHovered || isActive ? 'var(--color-primary)' : 'var(--color-text-muted)', transition: 'color 0.2s' } as any}
                        ></IonIcon>
                        <span style={{ fontWeight: depth === 0 ? 800 : 500, color: 'var(--color-text-strong)', fontSize: depth === 0 ? '1rem' : '0.9rem' }}>
                            {cat.name}
                        </span>
                        <span style={GS.levelBadge(cat.level || 0)}>{cat.level === 0 ? 'DOMAIN' : (cat.level === 1 ? 'FAMILY' : 'DEVICE')}</span>
                        {cat.visibility !== 'public' && (
                            <Badge tone="warning" size="sm" style={{ opacity: 0.7, scale: '0.8' }}>{cat.visibility.toUpperCase()}</Badge>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s', zIndex: 1 }}>
                        <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-text-muted)' }}
                            onClick={(e) => { e.stopPropagation(); handleEdit(cat); }}
                        >
                            <IonIcon name="create-outline"></IonIcon>
                        </button>
                        <button
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: 'var(--color-error)' }}
                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(cat.id); }}
                        >
                            <IonIcon name="trash-outline"></IonIcon>
                        </button>
                    </div>
                </div>

                {hasChildren && isExpanded && cat.children!.map(child => renderTreeRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="page">
            <PageHeader
                title="🏷️ Global Taxonomy Hub"
                subtitle="Recursive registry of classification metrics. Define multi-level hardware hierarchies."
            />

            {/* Premium Stats Grid */}
            <div style={GS.statsRow}>
                <div style={GS.statCard('var(--color-primary)')}>
                    <span style={GS.statValue()}>{loading ? '—' : stats.total}</span>
                    <span style={GS.statLabel}>Total Taxonomy Nodes</span>
                </div>
                <div style={GS.statCard('var(--color-info)')}>
                    <span style={GS.statValue('var(--color-info)')}>{loading ? '—' : stats.domains}</span>
                    <span style={GS.statLabel}>Foundational Domains (L0)</span>
                </div>
                <div style={GS.statCard('var(--color-success)')}>
                    <span style={GS.statValue('var(--color-success)')}>{loading ? '—' : stats.families}</span>
                    <span style={GS.statLabel}>Assembly Families (L1)</span>
                </div>
                <div style={GS.statCard('var(--color-warning)')}>
                    <span style={GS.statValue('var(--color-warning)')}>{loading ? '—' : stats.devices}</span>
                    <span style={GS.statLabel}>End Devices (L2)</span>
                </div>
            </div>

            <div style={GS.grid}>
                {/* Glassmorphic Form Container */}
                <div style={GS.formGlass}>
                    <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '150px', height: '150px', background: 'var(--color-primary)', filter: 'blur(100px)', opacity: 0.1, pointerEvents: 'none' }} />
                    
                    <div style={GS.formTitle}>
                        <div style={GS.inputIcon}>
                            <IonIcon name={editingId ? "pencil-outline" : "add-outline"}></IonIcon>
                        </div>
                        <span>{editingId ? 'Modify Taxonomy Link' : 'Register New Node'}</span>
                    </div>

                    {error && <Alert tone="error" className="mb-6">{error}</Alert>}
                    {success && <Alert tone="success" className="mb-6">{success}</Alert>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        <InputField
                            id="cat-name"
                            label="Node Identifier (Name)"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="e.g., Optical Sensors"
                        />
                        
                        <div>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Upstream Parent Node
                            </label>
                            <select
                                style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '14px', background: 'var(--color-background-soft)', color: 'var(--color-text-strong)', outline: 'none' }}
                                value={formData.parent}
                                onChange={e => setFormData({ ...formData, parent: e.target.value })}
                            >
                                <option value="">— PLATFORM DOMAIN (L0) —</option>
                                {flatCategories.filter(c => c.id !== editingId).map(c => (
                                    <option key={c.id} value={c.id}>
                                        {' ➔ '.repeat(c.level || 0)}{c.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                           <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text-muted)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Visibility</label>
                                <select
                                    style={{ width: '100%', padding: '12px 16px', border: '1px solid var(--color-border)', borderRadius: '14px', background: 'var(--color-background-soft)', color: 'var(--color-text-strong)', outline: 'none' }}
                                    value={formData.visibility}
                                    onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                >
                                    <option value="draft">DRAFT 📝</option>
                                    <option value="public">PUBLIC 🌐</option>
                                    <option value="private">PRIVATE 🔒</option>
                                </select>
                            </div>
                            <InputField
                                id="cat-sort"
                                label="Priority/Sort"
                                type="number"
                                value={formData.sortOrder}
                                onChange={e => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                            />
                        </div>

                        <InputField
                            id="cat-icon"
                            label="Graphic Token (Icon Name)"
                            value={formData.icon}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                            placeholder="e.g., hardware-chip-outline"
                        />

                        <div style={{ paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <Button type="submit" variant="primary" fullWidth disabled={saving} style={{ borderRadius: '16px', padding: '14px', fontWeight: 800 }}>
                                {saving ? 'SYNCING...' : (editingId ? '💾 PERSIST UPDATES' : '➕ ENLIST NODE')}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="secondary" onClick={resetForm} style={{ borderRadius: '16px' }}>
                                    Discard Edits
                                </Button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Hierarchy Registry Registry */}
                <Card raised style={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                    <div style={GS.treeHeader}>
                        <div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text-strong)' }}>Registry View</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Structured classification of {flatCategories.length} nodes.</div>
                        </div>
                        <input
                            style={{ 
                                padding: '12px 24px', border: '1px solid var(--color-border)', borderRadius: '100px', 
                                background: 'var(--color-background-soft)', color: 'var(--color-text-strong)', 
                                fontSize: '0.85rem', width: '250px', outline: 'none' 
                            }}
                            type="text"
                            placeholder="🔍 Filter taxonomy..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ padding: '0 0 2rem' }}>
                        {loading ? (
                            <div style={{ padding: '32px' }}>
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} style={{ padding: '12px 0', marginLeft: `${(i % 3) * 32}px` }}><Skeleton height={40} /></div>
                                ))}
                            </div>
                        ) : filteredCategories.length === 0 ? (
                            <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                                <EmptyState
                                    icon="list-outline"
                                    title="No Registry Matches"
                                    text="The current taxonomy definition does not contain a node with this fragment."
                                />
                            </div>
                        ) : (
                            <div>
                                {filteredCategories.map(cat => renderTreeRow(cat, 0))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Premium Confirm Modal */}
            {deleteTarget && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(10px)' }} onClick={() => setDeleteTarget(null)}>
                    <Card style={{ maxWidth: '440px', width: '90%', padding: '32px', borderRadius: '28px', border: '1px solid var(--color-border)', boxShadow: '0 30px 70px rgba(0,0,0,0.5)' }} onClick={(e: any) => e.stopPropagation()}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text-strong)', marginBottom: '12px' }}>Execute Removal?</div>
                        <p style={{ fontSize: '0.95rem', color: 'var(--color-text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
                            This will permanently excise the node from the platform taxonomy. Any linked products or children will be decoupled. <strong>Continue?</strong>
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <Button variant="secondary" onClick={() => setDeleteTarget(null)} style={{ borderRadius: '14px' }}>Reject</Button>
                            <Button variant="danger" onClick={confirmDelete} style={{ borderRadius: '14px', fontWeight: 800 }}>Confirm Purge</Button>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
};

export default AdminCategoryPage;
