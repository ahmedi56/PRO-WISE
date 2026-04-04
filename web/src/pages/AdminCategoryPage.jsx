import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { API_URL } from '../config';
import { useSelector } from 'react-redux';
import { Alert, Button, Card, EmptyState, InputField, PageHeader, Skeleton } from '../components/ui';

/* ─── inline styles (scoped to this page) ─── */
const S = {
    grid: {
        display: 'grid',
        gridTemplateColumns: '380px 1fr',
        gap: '24px',
        alignItems: 'start',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
    },
    statCard: {
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        transition: 'transform 0.2s, box-shadow 0.2s',
    },
    statValue: {
        fontSize: '1.75rem',
        fontWeight: 800,
        color: 'var(--color-text-strong)',
        lineHeight: 1,
    },
    statLabel: {
        fontSize: '0.75rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    statIcon: {
        fontSize: '1.3rem',
        marginBottom: '4px',
    },
    formCard: {
        position: 'sticky',
        top: '20px',
        maxHeight: 'calc(100vh - 60px)',
        overflowY: 'auto',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg, 12px)',
        padding: '24px',
    },
    formTitle: {
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--color-text-strong)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    formGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
    },
    formRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
    },
    label: {
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--color-text-muted)',
        marginBottom: '4px',
        display: 'block',
    },
    select: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-strong)',
        fontSize: '0.9rem',
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    textarea: {
        width: '100%',
        padding: '10px 12px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-strong)',
        fontSize: '0.9rem',
        outline: 'none',
        minHeight: '70px',
        resize: 'vertical',
        fontFamily: 'inherit',
    },
    formActions: {
        display: 'flex',
        gap: '8px',
        marginTop: '8px',
        paddingTop: '12px',
        borderTop: '1px solid var(--color-border)',
    },
    treeContainer: {
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg, 12px)',
        overflow: 'hidden',
    },
    treeHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px',
        borderBottom: '1px solid var(--color-border)',
        background: 'var(--color-surface-raised, var(--color-surface))',
    },
    treeTitle: {
        fontSize: '0.95rem',
        fontWeight: 700,
        color: 'var(--color-text-strong)',
    },
    searchInput: {
        padding: '8px 12px',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-md, 8px)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-strong)',
        fontSize: '0.85rem',
        width: '220px',
        outline: 'none',
    },
    treeRow: (depth, isHovered) => ({
        display: 'flex',
        alignItems: 'center',
        padding: '12px 20px',
        paddingLeft: `${depth * 24 + 20}px`,
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer',
        background: isHovered ? 'var(--color-surface-hover, rgba(0,0,0,0.03))' : 'transparent',
        transition: 'background 0.15s',
    }),
    treeName: (depth) => ({
        fontWeight: depth === 0 ? 700 : 500,
        fontSize: depth === 0 ? '0.95rem' : '0.88rem',
        color: 'var(--color-text-strong)',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    }),
    treeIndent: {
        color: 'var(--color-text-muted)',
        fontSize: '0.8rem',
        marginRight: '6px',
        opacity: 0.5,
    },
    levelBadge: (level) => {
        const colors = {
            0: { bg: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', text: 'Domain' },
            1: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981', text: 'Family' },
            2: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', text: 'Device' },
        };
        const c = colors[level] || colors[0];
        return {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '100px',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: c.bg,
            color: c.color,
        };
    },
    visBadge: (vis) => {
        const map = {
            public: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
            draft: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
            private: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' },
        };
        const c = map[vis] || map.draft;
        return {
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 8px',
            borderRadius: '100px',
            fontSize: '0.65rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            background: c.bg,
            color: c.color,
        };
    },
    treeActions: {
        display: 'flex',
        gap: '4px',
        opacity: 0,
        transition: 'opacity 0.15s',
    },
    treeActionsRow: {
        display: 'flex',
        gap: '4px',
    },
    actionBtn: (color = 'var(--color-text-muted)') => ({
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: 'var(--radius-md, 6px)',
        fontSize: '0.8rem',
        fontWeight: 600,
        color,
        transition: 'background 0.15s, color 0.15s',
    }),
    slugText: {
        fontSize: '0.75rem',
        color: 'var(--color-text-muted)',
        fontFamily: 'monospace',
        marginLeft: '12px',
        opacity: 0.7,
    },
    childCount: {
        fontSize: '0.7rem',
        color: 'var(--color-text-muted)',
        marginLeft: '6px',
    },
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        backdropFilter: 'blur(4px)',
    },
    modal: {
        background: 'var(--color-surface)',
        padding: '28px',
        borderRadius: 'var(--radius-lg, 12px)',
        maxWidth: '420px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
    },
    modalTitle: {
        fontSize: '1.15rem',
        fontWeight: 700,
        color: 'var(--color-text-strong)',
        marginBottom: '8px',
    },
    modalText: {
        fontSize: '0.9rem',
        color: 'var(--color-text-muted)',
        marginBottom: '20px',
        lineHeight: 1.5,
    },
    modalActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '10px',
    },
    expandBtn: {
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '0.75rem',
        padding: '2px 4px',
        color: 'var(--color-text-muted)',
        transition: 'transform 0.2s',
        marginRight: '4px',
    },
};

const AdminCategoryPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [categories, setCategories] = useState([]);
    const [flatCategories, setFlatCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState(new Set());
    const [hoveredId, setHoveredId] = useState(null);

    const [formData, setFormData] = useState({
        name: '', slug: '', parent: '',
        summary: '', description: '',
        visibility: 'draft', sortOrder: 0, icon: ''
    });
    const [editingId, setEditingId] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [saving, setSaving] = useState(false);

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
            // Auto-expand top level
            const topIds = new Set((treeRes.data || []).map(c => c.id));
            setExpandedIds(topIds);
        } catch (err) {
            setError("Failed to load categories");
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Compute stats
    const stats = useMemo(() => {
        const total = flatCategories.length;
        const publicCount = flatCategories.filter(c => c.visibility === 'public').length;
        const draftCount = flatCategories.filter(c => c.visibility === 'draft').length;
        const domains = flatCategories.filter(c => (c.level || 0) === 0).length;
        const families = flatCategories.filter(c => (c.level || 0) === 1).length;
        const devices = flatCategories.filter(c => (c.level || 0) === 2).length;
        return { total, publicCount, draftCount, domains, families, devices };
    }, [flatCategories]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
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
                await axios.put(`${API_URL}/categories/${editingId}`, payload, config);
                setSuccess('Category updated successfully');
            } else {
                await axios.post(`${API_URL}/categories`, payload, config);
                setSuccess('Category created successfully');
            }
            resetForm();
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Operation failed");
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
        setSuccess(null);
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        try {
            await axios.delete(`${API_URL}/categories/${deleteTarget}`, config);
            setDeleteTarget(null);
            setSuccess('Category deleted');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || "Delete failed");
            setDeleteTarget(null);
        }
    };

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        const allIds = new Set(flatCategories.map(c => c.id));
        setExpandedIds(allIds);
    };
    const collapseAll = () => setExpandedIds(new Set());

    // Filtered tree (search)
    const matchesSearch = (cat) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        if (cat.name.toLowerCase().includes(q)) return true;
        if (cat.slug?.toLowerCase().includes(q)) return true;
        if (cat.children?.some(child => matchesSearch(child))) return true;
        return false;
    };

    const filteredCategories = useMemo(() => {
        if (!searchQuery) return categories;
        return categories.filter(matchesSearch);
    }, [categories, searchQuery]);

    const levelLabels = { 0: 'Domain', 1: 'Family', 2: 'Device' };

    const renderTreeRow = (cat, depth = 0) => {
        if (searchQuery && !matchesSearch(cat)) return null;
        const hasChildren = cat.children && cat.children.length > 0;
        const isExpanded = expandedIds.has(cat.id);
        const isHovered = hoveredId === cat.id;

        return (
            <React.Fragment key={cat.id}>
                <div
                    style={S.treeRow(depth, isHovered)}
                    onMouseEnter={() => setHoveredId(cat.id)}
                    onMouseLeave={() => setHoveredId(null)}
                >
                    {/* Expand/collapse toggle */}
                    <span style={{ width: '20px', display: 'inline-flex', flexShrink: 0 }}>
                        {hasChildren && (
                            <button
                                style={{ ...S.expandBtn, transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                onClick={() => toggleExpand(cat.id)}
                            >
                                ▶
                            </button>
                        )}
                    </span>

                    {/* Indent indicator */}
                    {depth > 0 && <span style={S.treeIndent}>{'─'}</span>}

                    {/* Name + badges */}
                    <div style={S.treeName(depth)}>
                        <span>{cat.name}</span>
                        <span style={S.levelBadge(cat.level || depth)}>{levelLabels[cat.level || depth] || 'L' + (cat.level || depth)}</span>
                        {cat.visibility !== 'public' && (
                            <span style={S.visBadge(cat.visibility)}>{cat.visibility}</span>
                        )}
                        {hasChildren && (
                            <span style={S.childCount}>({cat.children.length})</span>
                        )}
                    </div>

                    {/* Slug */}
                    <span style={S.slugText}>{cat.slug}</span>

                    {/* Actions */}
                    <div style={{ ...S.treeActionsRow, opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}>
                        <button
                            style={S.actionBtn('var(--color-primary, #6366f1)')}
                            onClick={() => handleEdit(cat)}
                            onMouseOver={(e) => e.target.style.background = 'rgba(99,102,241,0.1)'}
                            onMouseOut={(e) => e.target.style.background = 'none'}
                        >
                            ✏️ Edit
                        </button>
                        <button
                            style={S.actionBtn('#ef4444')}
                            onClick={() => setDeleteTarget(cat.id)}
                            onMouseOver={(e) => e.target.style.background = 'rgba(239,68,68,0.1)'}
                            onMouseOut={(e) => e.target.style.background = 'none'}
                        >
                            🗑️ Delete
                        </button>
                    </div>
                </div>

                {/* Render children if expanded */}
                {hasChildren && isExpanded && cat.children.map(child => renderTreeRow(child, depth + 1))}
            </React.Fragment>
        );
    };

    // Auto-clear success messages
    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    return (
        <div className="page">
            <PageHeader
                title="🏷️ Category Taxonomy"
                subtitle="Manage the hierarchical product classification system — Domains, Families & Devices."
                actions={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
                        <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
                    </div>
                }
            />

            {/* Stats Row */}
            <div style={S.statsRow}>
                <div style={S.statCard}>
                    <span style={S.statIcon}>📊</span>
                    <span style={S.statValue}>{loading ? '—' : stats.total}</span>
                    <span style={S.statLabel}>Total Categories</span>
                </div>
                <div style={S.statCard}>
                    <span style={S.statIcon}>🌐</span>
                    <span style={S.statValue}>{loading ? '—' : stats.domains}</span>
                    <span style={S.statLabel}>Domains (L0)</span>
                </div>
                <div style={S.statCard}>
                    <span style={S.statIcon}>📂</span>
                    <span style={S.statValue}>{loading ? '—' : stats.families}</span>
                    <span style={S.statLabel}>Families (L1)</span>
                </div>
                <div style={S.statCard}>
                    <span style={S.statIcon}>📱</span>
                    <span style={S.statValue}>{loading ? '—' : stats.devices}</span>
                    <span style={S.statLabel}>Devices (L2)</span>
                </div>
                <div style={S.statCard}>
                    <span style={S.statIcon}>✅</span>
                    <span style={{ ...S.statValue, color: '#10b981' }}>{loading ? '—' : stats.publicCount}</span>
                    <span style={S.statLabel}>Published</span>
                </div>
                <div style={S.statCard}>
                    <span style={S.statIcon}>📝</span>
                    <span style={{ ...S.statValue, color: '#f59e0b' }}>{loading ? '—' : stats.draftCount}</span>
                    <span style={S.statLabel}>Drafts</span>
                </div>
            </div>

            {/* Main Grid: Form + Tree */}
            <div style={S.grid}>
                {/* ─── FORM PANEL ─── */}
                <div style={S.formCard}>
                    <div style={S.formTitle}>
                        <span>{editingId ? '✏️' : '➕'}</span>
                        <span>{editingId ? 'Edit Category' : 'New Category'}</span>
                    </div>

                    {error && <Alert tone="error" className="mb-4">{error}</Alert>}
                    {success && <Alert tone="success" className="mb-4">{success}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <div style={S.formGroup}>
                            <InputField
                                label="Category Name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Electrical Systems"
                            />
                            <InputField
                                label="Slug (URL-friendly)"
                                value={formData.slug}
                                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                placeholder="Auto-generated from name"
                            />

                            <div>
                                <label style={S.label}>Parent Category</label>
                                <select
                                    style={S.select}
                                    value={formData.parent}
                                    onChange={e => setFormData({ ...formData, parent: e.target.value })}
                                >
                                    <option value="">— Top Level (Domain) —</option>
                                    {flatCategories.filter(c => c.id !== editingId).map(c => (
                                        <option key={c.id} value={c.id}>
                                            {'  '.repeat((c.level || 0))}{'→ '.repeat(Math.min(c.level || 0, 1))}{c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div style={S.formRow}>
                                <div>
                                    <label style={S.label}>Visibility</label>
                                    <select
                                        style={S.select}
                                        value={formData.visibility}
                                        onChange={e => setFormData({ ...formData, visibility: e.target.value })}
                                    >
                                        <option value="draft">📝 Draft</option>
                                        <option value="public">✅ Public</option>
                                        <option value="private">🔒 Private</option>
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
                                label="Icon / Image URL"
                                value={formData.icon}
                                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                placeholder="https://..."
                            />

                            <div>
                                <label style={S.label}>SEO Summary <span style={{ opacity: 0.5 }}>({(formData.summary || '').length}/160)</span></label>
                                <textarea
                                    style={S.textarea}
                                    value={formData.summary}
                                    onChange={e => setFormData({ ...formData, summary: e.target.value })}
                                    maxLength={160}
                                    placeholder="Brief description for search engines..."
                                />
                            </div>

                            <div style={S.formActions}>
                                <Button type="submit" variant="primary" fullWidth disabled={saving}>
                                    {saving ? 'Saving...' : editingId ? '💾 Update Category' : '➕ Create Category'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="secondary" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </div>

                {/* ─── TREE VIEW ─── */}
                <div style={S.treeContainer}>
                    <div style={S.treeHeader}>
                        <span style={S.treeTitle}>
                            📂 Category Hierarchy
                            <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: '8px', fontSize: '0.8rem' }}>
                                {flatCategories.length} total
                            </span>
                        </span>
                        <input
                            style={S.searchInput}
                            type="text"
                            placeholder="🔍 Search categories..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {loading ? (
                        <div style={{ padding: '20px' }}>
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} style={{ padding: '12px 20px', paddingLeft: `${(i % 3) * 24 + 20}px` }}>
                                    <Skeleton width={140 + (i % 3) * 50} />
                                </div>
                            ))}
                        </div>
                    ) : filteredCategories.length === 0 ? (
                        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <EmptyState
                                icon="🏷️"
                                title={searchQuery ? 'No matching categories' : 'No categories yet'}
                                text={searchQuery ? 'Try a different search term.' : 'Create your first domain category to get started.'}
                            />
                        </div>
                    ) : (
                        <div>
                            {filteredCategories.map(cat => renderTreeRow(cat, 0))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── DELETE CONFIRMATION MODAL ─── */}
            {deleteTarget && (
                <div style={S.overlay} onClick={() => setDeleteTarget(null)}>
                    <div style={S.modal} onClick={e => e.stopPropagation()}>
                        <div style={S.modalTitle}>⚠️ Delete Category</div>
                        <p style={S.modalText}>
                            Are you sure you want to delete this category? This action may affect
                            products and child categories linked to it. This cannot be undone.
                        </p>
                        <div style={S.modalActions}>
                            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button variant="danger" onClick={confirmDelete}>🗑️ Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCategoryPage;
