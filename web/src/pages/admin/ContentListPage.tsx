import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Button, Spinner, EmptyState, IonIcon, Badge } from '../../components/index';
import axios from 'axios';
import { API_URL } from '../../config';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface ContentItem {
    id: string;
    title: string;
    type: string;
    status: string;
    product: any;
    createdAt: string;
    approvedBy?: string;
    needsManualReview?: boolean;
    rejectionReason?: string;
}

export const ContentListPage: React.FC = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<string>('all');
    const [selectedType, setSelectedType] = useState<string>('all');

    const headers = { Authorization: `Bearer ${token}` };

    const fetchContent = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API_URL}/content`, { headers });
            setContent(data.data || data || []);
        } catch (err) {
            console.error('Failed to fetch content', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchProductsList = async () => {
        try {
            const { data } = await axios.get(`${API_URL}/products`, {
                headers,
                params: { limit: 100, manage: true }
            });
            setProducts(data.data || data || []);
        } catch (err) {
            console.error('Failed to fetch products for filtering', err);
        }
    };

    useEffect(() => {
        fetchContent();
        fetchProductsList();
    }, []);

    const handleSubmitForApproval = async (id: string) => {
        try {
            await axios.put(`${API_URL}/content/${id}/submit`, {}, { headers });
            fetchContent();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to submit for approval');
        }
    };

    const handleDelete = async (id: string, title: string) => {
        if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API_URL}/content/${id}`, { headers });
            setContent(content.filter(c => c.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete content');
        }
    };

    const renderStatusBadge = (item: ContentItem) => {
        const status = item.status;
        
        if (status === 'approved' || status === 'published') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Badge tone="success">Active</Badge>
                    {item.approvedBy === 'system' && <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Auto Approved</span>}
                </div>
            );
        }

        if (status === 'pending') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Badge tone="warning">Pending Approval</Badge>
                    {item.needsManualReview && <span style={{ fontSize: '10px', color: 'var(--color-warning)' }}>Flagged for Review</span>}
                </div>
            );
        }

        if (status === 'rejected') {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <Badge tone="error">Rejected</Badge>
                    {item.rejectionReason && (
                        <span 
                            title={item.rejectionReason}
                            style={{ 
                                fontSize: '10px', color: 'var(--color-error)', maxWidth: '120px', 
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                            }}
                        >
                            {item.rejectionReason}
                        </span>
                    )}
                </div>
            );
        }

        return <Badge tone="neutral">Draft</Badge>;
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '—';
        return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(dateStr));
    };

    const filteredContent = content.filter(item => {
        const matchesProduct = selectedProduct === 'all' || 
            (typeof item.product === 'object' ? item.product?.id === selectedProduct : item.product === selectedProduct);
        const matchesType = selectedType === 'all' || item.type === selectedType;
        return matchesProduct && matchesType;
    });

    return (
        <div>
            <PageHeader
                title="Support Content Library"
                subtitle="Manage articles, guides, and troubleshooting documentation"
                actions={
                    <Button onClick={() => navigate('/admin/support/new')} icon={<IonIcon name="add-outline" />}>
                        Add New Content
                    </Button>
                }
            />

            <div className="filter-bar" style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '1rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Filter by Product</label>
                    <select
                        value={selectedProduct}
                        onChange={e => setSelectedProduct(e.target.value)}
                        style={{
                            background: 'var(--color-bg-alt)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text-main)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Products</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                    <label style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>Filter by Type</label>
                    <select
                        value={selectedType}
                        onChange={e => setSelectedType(e.target.value)}
                        style={{
                            background: 'var(--color-bg-alt)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            padding: '0.5rem',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-text-main)',
                            outline: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all">All Types</option>
                        <option value="article">📖 Knowledge Base Article</option>
                        <option value="guide">🛠️ Step-by-Step Repair Guide</option>
                        <option value="faq">❓ FAQ Entry</option>
                        <option value="tutorial">🎬 Video Episode</option>
                    </select>
                </div>
            </div>

            {loading ? (
                <div style={{ height: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>
            ) : content.length === 0 ? (
                <EmptyState
                    icon="document-text-outline"
                    title="Library is Empty"
                    description="You haven't created any support content for your products yet."
                    action={<Button onClick={() => navigate('/admin/support/new')}>Create Your First Article</Button>}
                />
            ) : filteredContent.length === 0 ? (
                <EmptyState
                    icon="funnel-outline"
                    title="No Matching Content"
                    description="No support documents match the chosen product and type filters."
                    action={<Button onClick={() => { setSelectedProduct('all'); setSelectedType('all'); }}>Clear Filters</Button>}
                />
            ) : (
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Content Info</th>
                                    <th>Product / Category</th>
                                    <th>Status</th>
                                    <th>Last Modified</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredContent.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--color-text-strong)' }}>{item.title}</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Badge tone="primary" style={{ fontSize: '10px', padding: '0 4px' }}>{item.type || 'article'}</Badge>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ color: 'var(--color-text-main)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                                                    {typeof item.product === 'object' ? item.product?.name : (item.product || 'Global')}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '11px' }}>Support Resource</div>
                                            </div>
                                        </td>
                                        <td>{renderStatusBadge(item)}</td>
                                        <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatDate(item.createdAt)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                <Button variant="ghost" size="sm" onClick={() => navigate(`/admin/support/${item.id}/edit`)} icon={<IonIcon name="create-outline" />}>
                                                    Edit
                                                </Button>
                                                {(item.status === 'draft' || item.status === 'rejected') && (
                                                    <Button variant="primary" size="sm" onClick={() => handleSubmitForApproval(item.id)} icon={<IonIcon name="send-outline" />}>
                                                        Submit
                                                    </Button>
                                                )}
                                                <Button variant="danger" size="sm" onClick={() => handleDelete(item.id, item.title)} icon={<IonIcon name="trash-outline" />} />
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
