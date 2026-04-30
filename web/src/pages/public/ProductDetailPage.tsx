import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../../config';
import { Badge, Button, EmptyState, PageHeader, Skeleton, IonIcon, Modal } from '../../components/ui';
import RecommendationSection from '../../components/RecommendationSection';
import { formatProductName } from '../../utils/formatProduct';
import { Product, Guide, Media } from '../../types/product';
import { RootState } from '../../store';
import FeedbackSection from '../../components/FeedbackSection';
import { QRCodeCanvas } from 'qrcode.react';

function getYoutubeId(urlOrId: string) {
    if (!urlOrId) return '';
    if (!urlOrId.includes('/') && urlOrId.length === 11) return urlOrId;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = urlOrId.match(regExp);
    return (match && match[2].length === 11) ? match[2] : urlOrId;
}

function classifyMedia(guides: Guide[] = [], supportVideos: Media[] = [], supportPDFs: Media[] = []) {
    const videos: any[] = [];
    const pdfs: any[] = [];

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

    supportPDFs.forEach((pdf) => {
        pdfs.push({
            id: pdf.id,
            title: pdf.title,
            url: pdf.fileUrl || pdf.url,
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

const SUPPORT_TABS = [
    { key: 'videos', label: 'Videos' },
    { key: 'pdfs', label: 'PDFs' },
    { key: 'steps', label: 'Steps' },
] as const;

type SupportTabKey = typeof SUPPORT_TABS[number]['key'];
type MainTabKey = 'overview' | 'components' | 'support';

export const ProductDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [product, setProduct] = useState<Product | null>(null);
    const [categoryPath, setCategoryPath] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const [mainTab, setMainTab] = useState<MainTabKey>('overview');
    const [supportTab, setSupportTab] = useState<SupportTabKey>('steps');
    
    const [selectedComponents, setSelectedComponents] = useState<any[]>([]);
    const [playingVideo, setPlayingVideo] = useState<any>(null);
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

    const { videos, pdfs } = useMemo(() => classifyMedia(product?.guides, product?.supportVideos, product?.supportPDFs), [product]);
    
    const supportTabCounts = useMemo(() => ({
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
            <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                    <Skeleton width={80} height={20} />
                    <Skeleton width={100} height={20} />
                    <Skeleton width={150} height={20} />
                </div>
                <Skeleton height={150} width="100%" className="mb-6" />
                <Skeleton height={50} width="100%" className="mb-6" />
                <Skeleton height={400} width="100%" />
            </div>
        );
    }

    if (!product) {
        return (
            <div style={{ padding: '4rem 1rem', maxWidth: '800px', margin: '0 auto' }}>
                <EmptyState
                    icon="search-outline"
                    title="Product not found"
                    description="The product you are looking for does not exist or has been removed."
                    action={<Button onClick={() => navigate('/products')}>Browse Products</Button>}
                />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', flexWrap: 'wrap', fontWeight: 500 }}>
                <Link to="/categories" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Categories</Link>
                {categoryPath.map((cat: any, index) => (
                    <React.Fragment key={cat.id}>
                        <IonIcon name="chevron-forward-outline" style={{ opacity: 0.5, fontSize: '0.8rem' }} />
                        {index === categoryPath.length - 1 ? (
                            <span style={{ color: 'var(--color-text-strong)' }}>{cat.name}</span>
                        ) : (
                            <Link to={`/categories?parent=${cat.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                                {cat.name}
                            </Link>
                        )}
                    </React.Fragment>
                ))}
                <IonIcon name="chevron-forward-outline" style={{ opacity: 0.5, fontSize: '0.8rem' }} />
                <span style={{ color: 'var(--color-text-strong)' }}>{formatProductName(product.name, product.manufacturer)}</span>
            </nav>

            <header style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'var(--color-text-strong)', lineHeight: 1.2 }}>
                            {formatProductName(product.name, product.manufacturer)}{product.modelNumber ? ` (${product.modelNumber})` : ''}
                        </h1>
                        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <IonIcon name="business-outline" />
                            {product.manufacturer ? `${product.manufacturer} • ${typeof product.category === 'object' ? product.category?.name : 'General Product'}` : (typeof product.category === 'object' ? product.category?.name : 'General Product')}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Badge tone={product.status === 'published' ? 'success' : 'warning'} size="lg">
                            {product.status || 'Draft'}
                        </Badge>
                        {canManage && (
                            <Button 
                                variant="outline" 
                                icon={<IonIcon name="create-outline" />}
                                onClick={() => navigate(`/admin/products/${id}/edit`)}
                            >
                                Edit Product
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', marginBottom: '2.5rem', overflowX: 'auto' }}>
                {[
                    { key: 'overview', label: 'Overview & Specs', icon: 'information-circle-outline' },
                    { key: 'components', label: `Components (${product.components?.length || 0})`, icon: 'hardware-chip-outline' },
                    { key: 'support', label: 'Support Content', icon: 'help-buoy-outline' }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setMainTab(tab.key as MainTabKey)}
                        style={{
                            padding: '1rem 1.5rem', border: 'none', background: 'none', cursor: 'pointer',
                            color: mainTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            borderBottom: `3px solid ${mainTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
                            fontWeight: mainTab === tab.key ? 700 : 500,
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            fontSize: '1.05rem', whiteSpace: 'nowrap', transition: 'all 0.2s'
                        }}
                    >
                        <IonIcon name={tab.icon} style={{ fontSize: '1.2rem' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div style={{ minHeight: '400px' }}>
                {mainTab === 'overview' && (
                    <div className="fade-in">
                        <section className="card" style={{ padding: '2.5rem', marginBottom: '2rem' }}>
                            <p style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--color-text)', margin: '0 0 2.5rem 0' }}>
                                {product.description || 'No description available for this product.'}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', background: 'var(--color-surface-raised)', padding: '2rem', borderRadius: 'var(--radius-lg)' }}>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>Manufacturer</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-strong)', fontSize: '1.2rem' }}>{product.manufacturer || (typeof product.company === 'object' ? product.company?.name : 'N/A')}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>Model Number</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-strong)', fontSize: '1.2rem' }}>{product.modelNumber || 'N/A'}</span>
                                </div>
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>Category</span>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-strong)', fontSize: '1.2rem' }}>{typeof product.category === 'object' ? product.category?.name : 'Uncategorized'}</span>
                                </div>
                                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '1.5rem', marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border)' }}>
                                    <div style={{ background: '#fff', padding: '10px', borderRadius: '12px', display: 'inline-block' }}>
                                        <QRCodeCanvas value={window.location.href} size={100} level="H" includeMargin={false} />
                                    </div>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.1rem' }}>Product QR Code</h4>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-muted)' }}>Scan this code to instantly open and share this product page on any mobile device.</p>
                                    </div>
                                </div>
                            </div>

                            {product.content && (
                                <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--color-border)' }}>
                                    <h4 style={{ fontSize: '1.2rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Detailed Information</h4>
                                    <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--color-text)' }}>
                                        {product.content}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {mainTab === 'components' && (
                    <div className="fade-in">
                        <section className="card" style={{ padding: '2.5rem' }}>
                            <div style={{ marginBottom: '2rem' }}>
                                <p style={{ color: 'var(--color-text-muted)', fontSize: '1rem', margin: 0 }}>
                                    Select components to find matching parts or related products.
                                </p>
                            </div>

                            {(!product.components || product.components.length === 0) ? (
                                <div style={{ padding: '4rem', textAlign: 'center', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)' }}>
                                    <IonIcon name="layers-outline" style={{ fontSize: '3rem', color: 'var(--color-text-muted)', opacity: 0.5, marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--color-text-muted)', margin: 0, fontWeight: 500, fontSize: '1.1rem' }}>No component breakdown available.</p>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {product.components.map((component, index) => {
                                        const selection = buildComponentSelection(component, index);
                                        const isSelected = selectedComponents.some((entry) => entry.selectionKey === selection.selectionKey);

                                        return (
                                            <button
                                                key={selection.selectionKey}
                                                type="button"
                                                onClick={() => toggleComponentSelection(component, index)}
                                                style={{
                                                    background: isSelected ? 'var(--color-primary-faint)' : 'var(--color-surface)',
                                                    border: `2px solid ${isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                                    borderRadius: 'var(--radius-lg)',
                                                    padding: '1.5rem',
                                                    textAlign: 'left',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '0.75rem',
                                                    boxShadow: isSelected ? '0 4px 12px rgba(99, 102, 241, 0.15)' : 'none',
                                                    transform: isSelected ? 'translateY(-2px)' : 'none'
                                                }}
                                                className={isSelected ? '' : 'hover-premium'}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: '1rem' }}>
                                                    <h5 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-strong)', lineHeight: 1.4 }}>
                                                        {component.name}
                                                    </h5>
                                                    {component.type && (
                                                        <span style={{ 
                                                            background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-raised)', 
                                                            color: isSelected ? '#fff' : 'var(--color-text-muted)', 
                                                            padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, flexShrink: 0 
                                                        }}>
                                                            {component.type}
                                                        </span>
                                                    )}
                                                </div>
                                                {component.manufacturer && (
                                                    <div style={{ fontSize: '0.95rem', color: isSelected ? 'var(--color-primary-dark)' : 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                                        <IonIcon name="business-outline" />
                                                        {component.manufacturer} {component.modelNumber}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </section>

                        {selectedComponents.length > 0 && (
                            <div style={{ marginTop: '2.5rem' }}>
                                <RecommendationSection
                                    mode="components"
                                    currentProductId={id}
                                    categoryId={typeof product.category === 'object' ? product.category?.id : (product.category as any)}
                                    selectedComponents={selectedComponents}
                                    onClearSelection={() => setSelectedComponents([])}
                                />
                            </div>
                        )}
                    </div>
                )}

                {mainTab === 'support' && (
                    <div className="fade-in">
                        <section className="card" style={{ overflow: 'hidden' }}>
                            <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-raised)' }}>
                                {SUPPORT_TABS.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setSupportTab(tab.key)}
                                        style={{
                                            flex: 1, padding: '1.25rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
                                            color: supportTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                            borderBottom: `3px solid ${supportTab === tab.key ? 'var(--color-primary)' : 'transparent'}`,
                                            fontWeight: supportTab === tab.key ? 700 : 500, fontSize: '1.05rem',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {tab.label}
                                        {supportTabCounts[tab.key] > 0 && (
                                            <span style={{ 
                                                background: supportTab === tab.key ? 'var(--color-primary)' : 'var(--color-border)', 
                                                color: supportTab === tab.key ? '#fff' : 'inherit',
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 
                                            }}>
                                                {supportTabCounts[tab.key]}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div style={{ padding: '2.5rem' }}>
                                {supportTab === 'videos' && (
                                    <div>
                                        {videos.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                                {videos.map((video: any, index: number) => (
                                                    <div 
                                                        key={video.id || index} 
                                                        className="hover-premium"
                                                        onClick={() => setPlayingVideo(video)}
                                                        style={{ 
                                                            cursor: 'pointer', display: 'flex', gap: '1.5rem', padding: '1.5rem', 
                                                            alignItems: 'center', background: 'var(--color-surface-raised)',
                                                            borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)'
                                                        }}
                                                    >
                                                        <div style={{ width: '120px', height: '75px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                                                            <IonIcon name="play" style={{ color: '#fff', fontSize: '2rem' }} />
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                                                            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-strong)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{video.title || 'Support Video'}</span>
                                                            <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{video._ctx.guideTitle}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState icon="videocam-outline" title="No Videos" description="No support videos available yet." />
                                        )}
                                    </div>
                                )}

                                {supportTab === 'pdfs' && (
                                    <div>
                                        {pdfs.length > 0 ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                                                {pdfs.map((pdf: any, index: number) => (
                                                    <div key={pdf.id || index} style={{ 
                                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                                                        padding: '1.5rem', background: 'var(--color-surface-raised)', 
                                                        borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' 
                                                    }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', overflow: 'hidden' }}>
                                                            <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--color-primary-faint)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <IonIcon name="document-text" style={{ fontSize: '1.5rem' }} />
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                                                                <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text-strong)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{pdf.title || 'Document'}</span>
                                                                <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{pdf._ctx.guideTitle}</span>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" onClick={() => window.open(pdf.url, '_blank')} icon={<IonIcon name="download-outline" />} />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState icon="document-text-outline" title="No PDFs" description="No documentation available yet." />
                                        )}
                                    </div>
                                )}

                                {supportTab === 'steps' && (
                                    <div>
                                        {product.guides && product.guides.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                {product.guides?.map((guide: any) => (
                                                    <div key={guide.id} style={{ background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)', padding: '2rem', border: '1px solid var(--color-border)' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                                            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem' }}>{guide.title}</h4>
                                                            <Badge tone={guide.difficulty === 'hard' ? 'danger' : 'success'} size="lg">{guide.difficulty}</Badge>
                                                        </div>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                                                            <div style={{ position: 'absolute', left: '19px', top: '24px', bottom: '24px', width: '2px', background: 'var(--color-border)' }} />
                                                            {guide.steps?.map((step: any, idx: number) => (
                                                                <div key={step.id} style={{ display: 'flex', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-surface)', border: '2px solid var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)', fontWeight: 800, flexShrink: 0, fontSize: '1.1rem' }}>
                                                                        {idx+1}
                                                                    </div>
                                                                    <div style={{ paddingTop: '0.25rem', paddingBottom: '1rem' }}>
                                                                        <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.1rem' }}>{step.title}</h5>
                                                                        <p style={{ margin: 0, fontSize: '1rem', color: 'var(--color-text)', lineHeight: 1.6 }}>{step.description}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState icon="list-outline" title="No Steps" description="No step-by-step guides available yet." />
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                )}
            </div>

            <div style={{ marginTop: '4rem', display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
                <RecommendationSection
                    mode="product"
                    currentProductId={id}
                    categoryId={typeof product.category === 'object' ? product.category?.id : (product.category as any)}
                    title="Related Products"
                />

                <div style={{ paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
                    <FeedbackSection 
                        companyId={typeof product.company === 'object' ? product.company.id : product.company} 
                        productId={product.id}
                    />
                </div>
            </div>

            {playingVideo && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setPlayingVideo(null)}>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '1000px', background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setPlayingVideo(null)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, transition: 'background 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        >
                            <IonIcon name="close" style={{ fontSize: '1.5rem' }} />
                        </button>
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe 
                                src={`https://www.youtube-nocookie.com/embed/${getYoutubeId(playingVideo.videoId || playingVideo.videoUrl || playingVideo.url || playingVideo.id)}?autoplay=1&rel=0`}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                allowFullScreen
                            />
                        </div>
                        <div style={{ padding: '1.5rem', background: 'var(--color-surface)' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 700, fontSize: '1.25rem' }}>{playingVideo.title || 'Support Video'}</h3>
                            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <IonIcon name="person-circle-outline" /> {playingVideo.author || playingVideo._ctx?.guideTitle || 'Support Team'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(5px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};
