
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Badge, Button, PageHeader, Skeleton, EmptyState } from '../components/ui';
import RecommendationSection from '../components/RecommendationSection';
import MainLayout from '../components/MainLayout';
import { formatProductName } from '../utils/formatProduct';

/* ── helpers ─────────────────────────────────────────────────── */

/** Walk every guide → step → media and collect items by type */
function classifyMedia(guides) {
    const videos = [];
    const pdfs   = [];

    (guides || []).forEach(guide => {
        (guide.steps || []).forEach(step => {
            (step.media || []).forEach(m => {
                const ctx = { guideTitle: guide.title, stepTitle: step.title, stepNumber: step.stepNumber };
                if (m.type === 'video') videos.push({ ...m, _ctx: ctx });
                if (m.type === 'pdf')   pdfs.push({ ...m, _ctx: ctx });
            });
        });
    });

    return { videos, pdfs };
}

/* ── tab configuration ───────────────────────────────────────── */
const TABS = [
    { key: 'videos', label: 'Videos',            icon: '🎬' },
    { key: 'pdfs',   label: 'PDFs',              icon: '📄' },
    { key: 'steps',  label: 'Steps with Images', icon: '📋' },
];

/* ── component ───────────────────────────────────────────────── */

const ProductDetailPage = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [categoryPath, setCategoryPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('steps');
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProductAndPath = async () => {
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const response = await axios.get(`${API_URL}/products/${id}`, config);
                const fetchedProduct = response.data;
                setProduct(fetchedProduct);
                if (fetchedProduct.categoryPath) {
                    setCategoryPath(fetchedProduct.categoryPath);
                }
            } catch (error) {
                console.error('Failed to fetch product:', error);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchProductAndPath();
    }, [id, token]);

    /* derived classified media */
    const { videos, pdfs } = useMemo(() => classifyMedia(product?.guides), [product]);

    /* badge counts per tab */
    const tabCounts = useMemo(() => ({
        videos: videos.length,
        pdfs:   pdfs.length,
        steps:  (product?.guides || []).reduce((n, g) => n + (g.steps?.length || 0), 0),
    }), [videos, pdfs, product]);

    /* ── loading / not-found states ──────────────────────────── */

    if (loading) {
        return (
            <MainLayout>
                <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                    <Skeleton height={40} width="60%" className="mb-6" />
                    <Skeleton height={200} width="100%" className="mb-6" />
                    <div className="product-grid">
                        <Skeleton height={150} />
                        <Skeleton height={150} />
                    </div>
                </div>
            </MainLayout>
        );
    }

    if (!product) {
        return (
            <MainLayout>
                <EmptyState
                    title="Product not found"
                    text="The product you are looking for does not exist or has been removed."
                    actions={<Button onClick={() => navigate('/products')}>Back to Products</Button>}
                />
            </MainLayout>
        );
    }

    /* ── render ───────────────────────────────────────────────── */

    return (
        <MainLayout>
            <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                {/* breadcrumb */}
                <nav className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                    <Link to="/categories" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Categories</Link>
                    {categoryPath.map((cat, index) => (
                        <React.Fragment key={cat.id}>
                            <span className="separator" style={{ opacity: 0.5 }}>/</span>
                            {index === categoryPath.length - 1 ? (
                                <span className="current" style={{ color: 'var(--color-text)' }}>{cat.name}</span>
                            ) : (
                                <Link to={`/categories?parent=${cat.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{cat.name}</Link>
                            )}
                        </React.Fragment>
                    ))}
                    <span className="separator" style={{ opacity: 0.5 }}>/</span>
                    <span className="current" style={{ color: 'var(--color-text)' }}>{formatProductName(product.name, product.manufacturer)}</span>
                </nav>

            <div className="product-detail-layout">
                <header className="product-detail-header">
                    <div className="header-main">
                        <PageHeader
                            title={`${formatProductName(product.name, product.manufacturer)}${product.modelNumber ? ' (' + product.modelNumber + ')' : ''}`}
                            subtitle={product.manufacturer ? `${product.manufacturer} • ${product.category?.name || 'General Product'}` : (product.category?.name || 'General Product')}
                            actions={
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <Badge tone={product.status === 'published' ? 'success' : 'warning'}>
                                        {product.status}
                                    </Badge>
                                </div>
                            }
                        />
                    </div>
                </header>

                <div className="product-detail-grid">
                    {/* ── left column: about card ─────────────────────── */}
                    <section className="product-info-card card">
                        <h3>About this Product</h3>
                        <p className="description" style={{ marginBottom: '1.5rem' }}>
                            {product.description || 'No description available for this product.'}
                        </p>

                        {product.content && (
                            <div className="full-content" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                <h4 style={{ marginBottom: '1rem' }}>Detailed Information</h4>
                                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                                    {product.content}
                                </div>
                            </div>
                        )}

                        <div className="specifications">
                            <div className="spec-item">
                                <span className="spec-label">Manufacturer</span>
                                <span className="spec-value">{product.manufacturer || 'N/A'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Model Number</span>
                                <span className="spec-value">{product.modelNumber || 'N/A'}</span>
                            </div>
                            <div className="spec-item">
                                <span className="spec-label">Category</span>
                                <span className="spec-value">{product.category?.name || 'Uncategorized'}</span>
                            </div>
                        </div>

                        {/* --- COMPONENTS SECTION --- */}
                        <div className="product-components" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ion-icon name="hardware-chip-outline" style={{ color: 'var(--color-primary)' }}></ion-icon>
                                Components & Composition
                            </h4>
                            
                            {(!product.components || product.components.length === 0) ? (
                                <div style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                        No component breakdown available yet.
                                    </p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {product.components.map((comp, idx) => (
                                        <div key={idx} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-strong)' }}>{comp.name}</h5>
                                                {comp.type && (
                                                    <Badge tone="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>{comp.type}</Badge>
                                                )}
                                            </div>
                                            
                                            {(comp.manufacturer || comp.modelNumber) && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                                                    <strong>Brand:</strong> {comp.manufacturer || 'N/A'} 
                                                    {comp.modelNumber && <span style={{ opacity: 0.7 }}> • <strong>Model:</strong> {comp.modelNumber}</span>}
                                                </div>
                                            )}
                                            
                                            {comp.specifications && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                                    {comp.specifications}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* ── right column: support content ──────────────── */}
                    <section className="product-support-content">
                        <h3 style={{ margin: '0 0 1rem 0' }}>Support Content</h3>

                        {/* tab bar */}
                        <div className="support-tabs">
                            {TABS.map(t => (
                                <button
                                    key={t.key}
                                    className={`support-tab ${activeTab === t.key ? 'active' : ''}`}
                                    onClick={() => setActiveTab(t.key)}
                                >
                                    <span className="tab-icon">{t.icon}</span>
                                    <span className="tab-label">{t.label}</span>
                                    {tabCounts[t.key] > 0 && (
                                        <span className="tab-count">{tabCounts[t.key]}</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* ── Videos tab ─────────────────────────────── */}
                        {activeTab === 'videos' && (
                            <div className="tab-panel">
                                {videos.length > 0 ? (
                                    <div className="video-list">
                                        {videos.map((v, i) => (
                                            <div key={v.id || i} className="video-card card">
                                                <video controls className="video-player">
                                                    <source src={v.url} type="video/mp4" />
                                                    Your browser does not support the video tag.
                                                </video>
                                                <div className="video-info">
                                                    <span className="video-title">{v.title || 'Video'}</span>
                                                    <span className="video-context">
                                                        {v._ctx.guideTitle} — Step {v._ctx.stepNumber}: {v._ctx.stepTitle}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <SupportEmptyState icon="🎬" message="No videos available for this product yet." />
                                )}
                            </div>
                        )}

                        {/* ── PDFs tab ───────────────────────────────── */}
                        {activeTab === 'pdfs' && (
                            <div className="tab-panel">
                                {pdfs.length > 0 ? (
                                    <div className="pdf-list">
                                        {pdfs.map((p, i) => (
                                            <div key={p.id || i} className="pdf-row card">
                                                <div className="pdf-row-left">
                                                    <span className="pdf-icon">📄</span>
                                                    <div className="pdf-meta">
                                                        <span className="pdf-title">{p.title || 'Document'}</span>
                                                        <span className="pdf-context">
                                                            {p._ctx.guideTitle} — Step {p._ctx.stepNumber}: {p._ctx.stepTitle}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" onClick={() => window.open(p.url, '_blank')}>
                                                    Open PDF ↗
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <SupportEmptyState icon="📄" message="No PDF documents available for this product yet." />
                                )}
                            </div>
                        )}

                        {/* ── Steps with Images tab ──────────────────── */}
                        {activeTab === 'steps' && (
                            <div className="tab-panel">
                                {(product.guides && product.guides.length > 0) ? (
                                    <div className="guides-step-list">
                                        {product.guides.map(guide => (
                                            <div key={guide.id} className="guide-block card">
                                                <div className="guide-block-header">
                                                    <h4 className="guide-title">{guide.title}</h4>
                                                    <div className="guide-meta-tags">
                                                        <Badge tone={guide.difficulty === 'hard' ? 'error' : guide.difficulty === 'medium' ? 'warning' : 'success'} size="sm">
                                                            {guide.difficulty?.toUpperCase()}
                                                        </Badge>
                                                        <span className="meta-item" style={{ marginLeft: '0.75rem' }}>
                                                            {guide.estimatedTime || 'N/A'}
                                                        </span>
                                                        <span className="meta-item" style={{ marginLeft: '0.75rem' }}>
                                                            {guide.steps?.length || 0} Steps
                                                        </span>
                                                    </div>
                                                </div>

                                                {guide.steps && guide.steps.length > 0 ? (
                                                    <div className="vertical-steps">
                                                        {guide.steps.map((step, sIdx) => {
                                                            const images = (step.media || []).filter(m => m.type === 'image');
                                                            return (
                                                                <div key={step.id} className="hierarchy-step-item">
                                                                    <div className="step-indicator">
                                                                        <div className="step-number">{sIdx + 1}</div>
                                                                        {sIdx < guide.steps.length - 1 && <div className="step-line"></div>}
                                                                    </div>
                                                                    <div className="step-content-box">
                                                                        <h5 className="step-header">{step.title}</h5>
                                                                        {step.description && <p className="step-desc">{step.description}</p>}
                                                                        {images.length > 0 && (
                                                                            <div className="step-media-gallery">
                                                                                {images.map(m => (
                                                                                    <div key={m.id} className="media-item-container">
                                                                                        <img src={m.url} alt={m.title || 'Step image'} />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="empty-text">This guide has no steps yet.</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <SupportEmptyState icon="📋" message="No step-by-step guides available for this product yet." />
                                )}
                            </div>
                        )}
                    </section>
                </div>

                <RecommendationSection 
                    currentProductId={id} 
                    title="Recommended Similar Products" 
                />
            </div>

            <style dangerouslySetInnerHTML={{ __html: DETAIL_STYLES }} />
            </div>
        </MainLayout>
    );
};

/* ── small empty-state sub-component ─────────────────────────── */

function SupportEmptyState({ icon, message }) {
    return (
        <div className="support-empty-state card">
            <span className="empty-icon">{icon}</span>
            <p>{message}</p>
        </div>
    );
}

/* ── styles ──────────────────────────────────────────────────── */

const DETAIL_STYLES = `
    .product-detail-page {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        color: var(--color-text);
    }

    /* grid */
    .product-detail-grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 3rem;
        margin-top: 2rem;
    }
    @media (max-width: 992px) {
        .product-detail-grid { grid-template-columns: 1fr; }
    }

    /* about card */
    .product-info-card {
        padding: 1.5rem;
        height: fit-content;
        position: sticky;
        top: 100px;
        border: 1px solid var(--color-border);
        background: rgba(255,255,255,0.01);
    }

    /* ── tabs ───────────────────────────────────────── */
    .support-tabs {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid var(--color-border);
        padding-bottom: 0;
    }
    .support-tab {
        display: flex;
        align-items: center;
        gap: 0.45rem;
        padding: 0.65rem 1.1rem;
        border: none;
        background: transparent;
        color: var(--color-text-muted);
        font-size: 0.92rem;
        font-weight: 500;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -2px;
        transition: color 0.2s, border-color 0.2s;
    }
    .support-tab:hover {
        color: var(--color-text);
    }
    .support-tab.active {
        color: var(--color-primary);
        border-bottom-color: var(--color-primary);
        font-weight: 600;
    }
    .tab-count {
        background: var(--color-primary);
        color: #fff;
        font-size: 0.72rem;
        padding: 0.1rem 0.5rem;
        border-radius: 999px;
        font-weight: 700;
        line-height: 1.4;
    }
    .tab-panel {
        animation: fadeIn 0.2s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

    /* ── video tab ──────────────────────────────────── */
    .video-list {
        display: grid;
        gap: 1.25rem;
    }
    .video-card {
        overflow: hidden;
        border: 1px solid var(--color-border);
    }
    .video-player {
        width: 100%;
        max-height: 400px;
        background: #000;
        display: block;
    }
    .video-info {
        padding: 0.85rem 1rem;
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
    }
    .video-title {
        font-weight: 600;
        font-size: 0.95rem;
    }
    .video-context {
        color: var(--color-text-muted);
        font-size: 0.82rem;
    }

    /* ── pdf tab ────────────────────────────────────── */
    .pdf-list {
        display: grid;
        gap: 0.75rem;
    }
    .pdf-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.9rem 1.1rem;
        border: 1px solid var(--color-border);
    }
    .pdf-row-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .pdf-icon {
        font-size: 1.6rem;
    }
    .pdf-meta {
        display: flex;
        flex-direction: column;
    }
    .pdf-title {
        font-weight: 600;
        font-size: 0.95rem;
    }
    .pdf-context {
        font-size: 0.8rem;
        color: var(--color-text-muted);
    }

    /* ── steps tab ──────────────────────────────────── */
    .guides-step-list {
        display: grid;
        gap: 1.5rem;
    }
    .guide-block {
        border: 1px solid var(--color-border);
        overflow: hidden;
        padding: 0;
    }
    .guide-block-header {
        padding: 1.25rem 1.5rem;
        border-bottom: 1px solid var(--color-border);
        background: rgba(255,255,255,0.03);
    }
    .guide-title {
        margin: 0 0 0.35rem 0;
        font-size: 1.3rem;
        font-weight: 700;
        letter-spacing: -0.02em;
    }
    .guide-meta-tags {
        display: flex;
        align-items: center;
        color: var(--color-text-muted);
        font-size: 0.85rem;
    }
    .vertical-steps {
        display: flex;
        flex-direction: column;
        padding: 1.5rem;
    }
    .hierarchy-step-item {
        display: flex;
        gap: 1.5rem;
    }
    .step-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 32px;
        flex-shrink: 0;
    }
    .step-number {
        width: 32px;
        height: 32px;
        background: var(--color-primary);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.9rem;
        box-shadow: 0 0 15px rgba(var(--color-primary-rgb), 0.3);
    }
    .step-line {
        width: 2px;
        flex-grow: 1;
        background: var(--color-border);
        margin: 0.5rem 0;
    }
    .step-content-box {
        flex-grow: 1;
        padding-bottom: 2rem;
    }
    .step-header {
        margin: 0 0 0.5rem 0;
        font-size: 1.15rem;
        font-weight: 600;
    }
    .step-desc {
        margin: 0;
        font-size: 0.95rem;
        color: var(--color-text-muted);
        line-height: 1.6;
    }
    .step-media-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.85rem;
        margin-top: 1rem;
    }
    .media-item-container img {
        width: 100%;
        max-height: 360px;
        object-fit: contain;
        background: #000;
        border-radius: 8px;
        border: 1px solid var(--color-border);
    }
    .empty-text {
        padding: 1.5rem;
        color: var(--color-text-muted);
        text-align: center;
    }

    /* ── empty state ───────────────────────────────── */
    .support-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 4rem 2rem;
        text-align: center;
        border: 1px dashed var(--color-border);
        opacity: 0.7;
    }
    .empty-icon {
        font-size: 3rem;
        margin-bottom: 0.75rem;
        opacity: 0.35;
    }
`;

export default ProductDetailPage;
