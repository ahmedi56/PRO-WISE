import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import RecommendationSection from '@/components/RecommendationSection';
import MainLayout from '@/components/MainLayout';
import { formatProductName } from '@/utils/formatProduct';
import { Product } from '@/types/product';
import { RootState } from '@/store';

function classifyMedia(guides: any[] = [], supportVideos: any[] = [], supportPDFs: any[] = []) {
    const videos: any[] = [];
    const pdfs: any[] = [];

    // Aggregate Legacy Guides
    guides.forEach((guide) => {
        (guide.steps || []).forEach((step: any) => {
            (step.media || []).forEach((mediaItem: any) => {
                const context = {
                    guideTitle: guide.title,
                    stepTitle: step.title,
                    stepNumber: step.stepNumber,
                };
                if (mediaItem.type === 'video') {
                    videos.push({ ...mediaItem, author: 'Legacy Support', _ctx: context });
                }
                if (mediaItem.type === 'pdf') {
                    pdfs.push({ ...mediaItem, author: 'Legacy Support', _ctx: context });
                }
            });
        });
    });

    // Aggregate Native Support Videos
    supportVideos.forEach((video) => {
        videos.push({
            id: video.id,
            videoId: video.videoId,
            videoUrl: video.videoUrl,
            title: video.title,
            author: video.author || 'Internal Support',
            _ctx: { guideTitle: 'Native Support', stepTitle: 'Public Video' }
        });
    });

    // Aggregate Native Support PDFs
    supportPDFs.forEach((pdf) => {
        pdfs.push({
            id: pdf.id,
            title: pdf.title,
            url: pdf.fileUrl,
            author: pdf.author || 'Internal Support',
            _ctx: { guideTitle: 'Native Support', stepTitle: 'Public Document' }
        });
    });

    return { videos, pdfs };
}

function buildComponentSelection(component: any, index: number) {
    return {
        name: component?.name || '',
        type: component?.type || '',
        manufacturer: component?.manufacturer || '',
        modelNumber: component?.modelNumber || '',
        specifications: component?.specifications || '',
        selectionKey: [
            index,
            component?.name || '',
            component?.type || '',
            component?.manufacturer || '',
            component?.modelNumber || '',
        ].join('|'),
    };
}

const getComponentLabel = (component: any) => {
    const name = component?.name || component?.modelNumber || component?.type || 'Component';
    const brand = component?.manufacturer;
    return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${name}`.trim()
        : name;
};

const getAccessContext = (user: any) => {
    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];
    
    let userCompanyId = user?.company;
    if (typeof userCompanyId === 'object' && userCompanyId !== null) {
        userCompanyId = userCompanyId.id;
    }

    return { roleName, permissions, userCompanyId };
};

const canManageProduct = (user: any, product: Product | null) => {
    if (!product) return false;
    const { roleName, permissions, userCompanyId } = getAccessContext(user);
    const isAdmin = permissions.includes('products.manage');

    if (!isAdmin) return false;
    if (roleName === 'super_admin') return true;
    
    let prodCompanyId = product?.company;
    if (typeof prodCompanyId === 'object' && prodCompanyId !== null) {
        prodCompanyId = prodCompanyId.id;
    }
    return String(prodCompanyId) === String(userCompanyId);
};

const TABS = [
    { key: 'videos', label: 'Videos' },
    { key: 'pdfs', label: 'PDFs' },
    { key: 'steps', label: 'Steps' },
] as const;

type TabKey = typeof TABS[number]['key'];

const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [categoryPath, setCategoryPath] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('steps');
    const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
    const navigate = useNavigate();
    const { user, token } = useSelector((state: RootState) => state.auth);

    const canManage = useMemo(() => canManageProduct(user, product), [user, product]);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchProduct = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/products/${id}`);
                const fetchedProduct = response.data;
                setProduct(fetchedProduct);
                setCategoryPath(Array.isArray(fetchedProduct.categoryPath) ? fetchedProduct.categoryPath : []);
            } catch (error) {
                console.error('Failed to fetch product:', error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, token]);

    useEffect(() => {
        setSelectedComponents([]);
    }, [id]);

    const { videos, pdfs } = useMemo(() => classifyMedia(product?.guides, product?.supportVideos, product?.supportPDFs), [product]);
    
    const tabCounts = useMemo(() => ({
        videos: videos.length,
        pdfs: pdfs.length,
        steps: (product?.guides || []).reduce((count: number, guide: any) => count + (guide.steps?.length || 0), 0),
    }), [videos, pdfs, product]);

    const toggleComponentSelection = (component: any, index: number) => {
        const nextSelection = buildComponentSelection(component, index);
        setSelectedComponents((previous) => (
            previous.some((entry) => entry.selectionKey === nextSelection.selectionKey)
                ? previous.filter((entry) => entry.selectionKey !== nextSelection.selectionKey)
                : [...previous, nextSelection]
        ));
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                        <Skeleton width={80} height={20} />
                        <Skeleton width={100} height={20} />
                        <Skeleton width={150} height={20} />
                    </div>

                    <div className="product-detail-layout">
                        <header className="product-detail-header" style={{ marginBottom: '2rem' }}>
                            <Skeleton height={40} width="60%" className="mb-2" />
                            <Skeleton height={20} width="30%" />
                        </header>

                        <div className="product-detail-grid">
                            <section className="product-info-card card">
                                <Skeleton height={24} width="40%" className="mb-4" />
                                <Skeleton height={100} width="100%" className="mb-6" />
                                <div className="specifications">
                                    <Skeleton height={40} width="100%" />
                                    <Skeleton height={40} width="100%" />
                                    <Skeleton height={40} width="100%" />
                                </div>
                                <div style={{ marginTop: '2rem' }}>
                                    <Skeleton height={24} width="50%" className="mb-4" />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <Skeleton height={60} width="100%" />
                                        <Skeleton height={60} width="100%" />
                                    </div>
                                </div>
                            </section>

                            <section className="product-support-content">
                                <Skeleton height={32} width="30%" className="mb-6" />
                                <div className="support-tabs" style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <Skeleton height={36} width={100} />
                                        <Skeleton height={36} width={100} />
                                        <Skeleton height={36} width={100} />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    <Skeleton height={200} width="100%" />
                                    <Skeleton height={200} width="100%" />
                                </div>
                            </section>
                        </div>
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
                    action={<Button onClick={() => navigate('/products')}>Back to Products</Button>}
                />
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                <nav className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.9rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
                    <Link to="/categories" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Categories</Link>
                    {categoryPath.map((category, index) => (
                        <React.Fragment key={category.id}>
                            <span style={{ opacity: 0.5 }}>/</span>
                            {index === categoryPath.length - 1 ? (
                                <span style={{ color: 'var(--color-text)' }}>{category.name}</span>
                            ) : (
                                <Link to={`/categories?parent=${category.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                    {category.name}
                                </Link>
                            )}
                        </React.Fragment>
                    ))}
                    <span style={{ opacity: 0.5 }}>/</span>
                    <span style={{ color: 'var(--color-text)' }}>{formatProductName(product.name, product.manufacturer)}</span>
                </nav>

                <div className="product-detail-layout">
                    <header className="product-detail-header">
                        <div className="header-main">
                            <PageHeader
                                title={`${formatProductName(product.name, product.manufacturer)}${product.modelNumber ? ` (${product.modelNumber})` : ''}`}
                                subtitle={product.manufacturer ? `${product.manufacturer} - ${product.category?.name || 'General Product'}` : (product.category?.name || 'General Product')}
                                actions={(
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        {canManage && (
                                            <Button 
                                                variant="secondary" 
                                                size="sm" 
                                                onClick={() => navigate(`/admin/products/${id}/edit`)}
                                            >
                                                Edit Product
                                            </Button>
                                        )}
                                        <Badge tone={product.status === 'published' ? 'success' : 'warning'}>
                                            {product.status}
                                        </Badge>
                                    </div>
                                )}
                            />
                        </div>
                    </header>

                    <div className="product-detail-grid">
                        <section className="product-info-card card">
                            <h3>About this Product</h3>
                            <p className="description" style={{ marginBottom: '1.5rem' }}>
                                {product.description || 'No description available for this product.'}
                            </p>

                            {product.content ? (
                                <div className="full-content" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                    <h4 style={{ marginBottom: '1rem' }}>Detailed Information</h4>
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: 'var(--color-text-muted)' }}>
                                        {product.content}
                                    </div>
                                </div>
                            ) : null}

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

                            <div className="product-components" style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <ion-icon name="hardware-chip-outline" style={{ color: 'var(--color-primary)' }}></ion-icon>
                                    Components and Composition
                                </h4>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: '0 0 1rem' }}>
                                    Click one or more components to find real catalog products built with matching parts.
                                </p>

                                {(!product.components || product.components.length === 0) ? (
                                    <div style={{ background: 'var(--color-surface)', border: '1px dashed var(--color-border)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}>
                                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                                            No component breakdown available yet.
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {product.components.map((component, index) => {
                                            const selection = buildComponentSelection(component, index);
                                            const isSelected = selectedComponents.some((entry) => entry.selectionKey === selection.selectionKey);

                                            return (
                                                <button
                                                    key={selection.selectionKey}
                                                    type="button"
                                                    onClick={() => toggleComponentSelection(component, index)}
                                                    style={{
                                                        background: isSelected ? 'rgba(var(--color-primary-rgb), 0.12)' : 'var(--color-surface)',
                                                        border: isSelected ? '1px solid rgba(var(--color-primary-rgb), 0.35)' : '1px solid var(--color-border)',
                                                        borderRadius: '8px',
                                                        padding: '1rem',
                                                        textAlign: 'left',
                                                        cursor: 'pointer',
                                                        color: 'inherit',
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                                        <h5 style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text-strong)' }}>{component.name}</h5>
                                                        {component.type ? (
                                                            <Badge tone="neutral" style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem' }}>
                                                                {component.type}
                                                            </Badge>
                                                        ) : null}
                                                    </div>

                                                    {(component.manufacturer || component.modelNumber) ? (
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>
                                                            <strong>Brand:</strong> {component.manufacturer || 'N/A'}
                                                            {component.modelNumber ? <span style={{ opacity: 0.7 }}> - <strong>Model:</strong> {component.modelNumber}</span> : null}
                                                        </div>
                                                    ) : null}

                                                    {component.specifications ? (
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
                                                            {component.specifications}
                                                        </div>
                                                    ) : null}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {selectedComponents.length > 0 ? (
                                    <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                                        {selectedComponents.map((component) => (
                                            <span
                                                key={component.selectionKey}
                                                style={{
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    padding: '0.35rem 0.65rem',
                                                    borderRadius: '999px',
                                                    background: 'rgba(var(--color-primary-rgb), 0.12)',
                                                    color: 'var(--color-primary)',
                                                    border: '1px solid rgba(var(--color-primary-rgb), 0.22)',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                }}
                                            >
                                                {getComponentLabel(component)}
                                            </span>
                                        ))}
                                        <Button type="button" variant="secondary" size="sm" onClick={() => setSelectedComponents([])}>
                                            Clear
                                        </Button>
                                    </div>
                                ) : null}
                            </div>
                        </section>

                        <section className="product-support-content">
                            <h3 style={{ margin: '0 0 1rem 0' }}>Support Content</h3>

                            <div className="support-tabs">
                                {TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        className={`support-tab ${activeTab === tab.key ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab.key)}
                                    >
                                        <span className="tab-label">{tab.label}</span>
                                        {tabCounts[tab.key] > 0 ? (
                                            <span className="tab-count">{tabCounts[tab.key]}</span>
                                        ) : null}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'videos' ? (
                                <div className="tab-panel">
                                    {videos.length > 0 ? (
                                        <div className="video-list">
                                            {videos.map((video: any, index: number) => (
                                                <div 
                                                    key={video.id || index} 
                                                    className="video-card card hover-premium"
                                                    onClick={() => navigate(`/products/${id}/videos/${video.id || video.videoId || video.url}`)}
                                                    style={{ cursor: 'pointer', display: 'flex', gap: '1.5rem', padding: '1rem', alignItems: 'center', transition: 'all 0.3s ease' }}
                                                >
                                                    <div style={{ width: '120px', height: '68px', borderRadius: '8px', background: '#000', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                                                        {video.videoId ? (
                                                            <img src={`https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', opacity: 0.6 }} />
                                                        ) : (
                                                            <div style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}><ion-icon name="videocam-outline"></ion-icon></div>
                                                        )}
                                                        <div style={{ position: 'absolute', color: '#fff', fontSize: '2rem' }}><ion-icon name="play-circle-outline"></ion-icon></div>
                                                    </div>
                                                    <div className="video-info" style={{ padding: 0 }}>
                                                        <span className="video-title" style={{ fontSize: '1.1rem', marginBottom: '0.25rem', display: 'block' }}>{video.title || 'Support Video'}</span>
                                                        <span className="video-context" style={{ opacity: 0.7 }}>
                                                            {video._ctx.guideTitle} • {video.author}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <SupportEmptyState message="No videos available for this product yet." />
                                    )}
                                </div>
                            ) : null}

                            {activeTab === 'pdfs' ? (
                                <div className="tab-panel">
                                    {pdfs.length > 0 ? (
                                        <div className="pdf-list">
                                            {pdfs.map((pdf: any, index: number) => (
                                                <div key={pdf.id || index} className="pdf-row card">
                                                    <div className="pdf-row-left">
                                                        <span className="pdf-icon">PDF</span>
                                                        <div className="pdf-meta">
                                                            <span className="pdf-title">{pdf.title || 'Document'}</span>
                                                            <span className="pdf-context">
                                                                {pdf._ctx.guideTitle} - Step {pdf._ctx.stepNumber}: {pdf._ctx.stepTitle}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm" 
                                                        onClick={() => {
                                                                const fullUrl = (pdf.url && (pdf.url.startsWith('http') || pdf.url.startsWith('//'))) 
                                                                    ? pdf.url 
                                                                    : `${API_URL}${pdf.url}?token=${token}`;
                                                                window.open(fullUrl, '_blank');
                                                        }}
                                                    >
                                                        Open PDF
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <SupportEmptyState message="No PDF documents available for this product yet." />
                                    )}
                                </div>
                            ) : null}

                            {activeTab === 'steps' ? (
                                <div className="tab-panel">
                                    {(product.guides && product.guides.length > 0) ? (
                                        <div className="guides-step-list">
                                            {product.guides.map((guide: any) => (
                                                <div key={guide.id} className="guide-block card">
                                                    <div className="guide-block-header">
                                                        <h4 className="guide-title">{guide.title}</h4>
                                                        <div className="guide-meta-tags">
                                                            <Badge tone={guide.difficulty === 'hard' ? 'danger' : guide.difficulty === 'medium' ? 'warning' : 'success'} size="sm">
                                                                {guide.difficulty?.toUpperCase()}
                                                            </Badge>
                                                            <span className="meta-item" style={{ marginLeft: '0.75rem', fontSize: '0.85rem' }}>
                                                                {guide.estimatedTime || 'N/A'}
                                                            </span>
                                                            <span className="meta-item" style={{ marginLeft: '0.75rem', fontSize: '0.85rem' }}>
                                                                {guide.steps?.length || 0} Steps
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {guide.steps && guide.steps.length > 0 ? (
                                                        <div className="vertical-steps">
                                                            {guide.steps.map((step: any, stepIndex: number) => {
                                                                const images = (step.media || []).filter((mediaItem: any) => mediaItem.type === 'image');
                                                                return (
                                                                    <div key={step.id} className="hierarchy-step-item">
                                                                        <div className="step-indicator">
                                                                            <div className="step-number">{stepIndex + 1}</div>
                                                                            {stepIndex < guide.steps.length - 1 ? <div className="step-line"></div> : null}
                                                                        </div>
                                                                        <div className="step-content-box">
                                                                            <h5 className="step-header">{step.title}</h5>
                                                                            {step.description ? <p className="step-desc">{step.description}</p> : null}
                                                                            {images.length > 0 ? (
                                                                                <div className="step-media-gallery">
                                                                                    {images.map((mediaItem: any) => (
                                                                                        <div key={mediaItem.id} className="media-item-container">
                                                                                            <img src={mediaItem.url} alt={mediaItem.title || 'Step image'} />
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : null}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="empty-text" style={{ padding: '1.5rem', color: 'var(--color-text-muted)' }}>This guide has no steps yet.</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <SupportEmptyState message="No step-by-step guides available for this product yet." />
                                    )}
                                </div>
                            ) : null}
                        </section>
                    </div>

                    {selectedComponents.length > 0 && (
                        <RecommendationSection
                            mode="components"
                            currentProductId={id}
                            categoryId={product.category?.id || (product.category as any)}
                            selectedComponents={selectedComponents}
                            onClearSelection={() => setSelectedComponents([])}
                        />
                    )}

                    <RecommendationSection
                        mode="product"
                        currentProductId={id}
                        categoryId={product.category?.id || (product.category as any)}
                        title="Related Products"
                    />
                </div>

                <style dangerouslySetInnerHTML={{ __html: DETAIL_STYLES }} />
            </div>
        </MainLayout>
    );
};

function SupportEmptyState({ message }: { message: string }) {
    return (
        <div className="support-empty-state card">
            <p>{message}</p>
        </div>
    );
}

const DETAIL_STYLES = `
    .product-detail-grid {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 3rem;
        margin-top: 2rem;
    }
    @media (max-width: 992px) {
        .product-detail-grid { grid-template-columns: 1fr; }
    }

    .specifications {
        display: grid;
        gap: 0.75rem;
    }
    .spec-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0.6rem 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.04);
    }
    .spec-item:last-child {
        border-bottom: none;
    }
    .spec-label {
        font-weight: 600;
        color: var(--color-text);
        font-size: 0.9rem;
    }
    .spec-value {
        color: var(--color-text-muted);
        font-size: 0.9rem;
    }

    .product-info-card {
        padding: 1.5rem;
        height: fit-content;
        position: sticky;
        top: 100px;
        border: 1px solid var(--color-border);
        background: rgba(255,255,255,0.01);
    }

    .support-tabs {
        display: flex;
        gap: 0.25rem;
        margin-bottom: 1.5rem;
        border-bottom: 2px solid var(--color-border);
    }
    .support-tab {
        display: inline-flex;
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

    .video-list,
    .guides-step-list,
    .pdf-list {
        display: grid;
        gap: 1rem;
    }

    .video-card,
    .pdf-row,
    .guide-block {
        border: 1px solid var(--color-border);
        overflow: hidden;
    }

    .video-info,
    .guide-block-header {
        padding: 0.85rem 1rem;
    }
    .video-title,
    .guide-title,
    .pdf-title {
        font-weight: 600;
    }
    .video-context,
    .pdf-context {
        color: var(--color-text-muted);
        font-size: 0.82rem;
    }

    .pdf-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.9rem 1.1rem;
    }
    .pdf-row-left {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }
    .pdf-icon {
        font-size: 0.82rem;
        font-weight: 700;
        color: var(--color-primary);
    }
    .pdf-meta {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
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

    .support-empty-state {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        text-align: center;
        border: 1px dashed var(--color-border);
        color: var(--color-text-muted);
    }
`;

export default ProductDetailPage;
