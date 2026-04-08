import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '@/config';
import { EmptyState, Skeleton, Button } from '@/components/ui';
import { formatProductName } from '@/utils/formatProduct';
import { RootState } from '@/store';
import { Product } from '@/types/product';

const COMPONENT_FIELDS = ['name', 'type', 'manufacturer', 'modelNumber', 'specifications'];

const toComponentPayload = (components: any[] = []) => components.map((component) => {
    const payload: any = {};
    COMPONENT_FIELDS.forEach((field) => {
        payload[field] = String(component?.[field] || '').trim();
    });
    return payload;
});

const getComponentLabel = (component: any) => {
    const name = component?.name || component?.modelNumber || component?.type || 'Component';
    const brand = component?.manufacturer;
    return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${name}`.trim()
        : name;
};

const parseRecommendationPayload = (payload: any) => {
    if (Array.isArray(payload)) {
        return { items: payload, meta: null };
    }

    if (payload && Array.isArray(payload.data)) {
        return { items: payload.data, meta: payload.meta || null };
    }

    return { items: [], meta: payload?.meta || null };
};

const getRecommendationWarning = (meta: any) => {
    const embeddingMeta = meta?.embedding;
    if (embeddingMeta?.requested && !embeddingMeta?.available) {
        return 'Semantic matching is temporarily limited because the embedding service is unavailable. Showing fallback matches.';
    }
    return '';
};

interface RecommendationSectionProps {
    categoryId?: string | null;
    currentProductId?: string;
    title?: string;
    selectedComponents?: any[];
    onClearSelection?: () => void;
    mode?: 'product' | 'components';
}

const RecommendationSection: React.FC<RecommendationSectionProps> = ({
    categoryId,
    currentProductId,
    title = 'Recommended for You',
    selectedComponents = [],
    onClearSelection,
    mode = 'product'
}) => {
    const [recommendations, setRecommendations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [serviceWarning, setServiceWarning] = useState('');
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);

    const isComponentMode = mode === 'components';
    const hasSelection = selectedComponents.length > 0;

    const effectiveTitle = isComponentMode
        ? (selectedComponents.length === 1 ? 'Products Built With This Component' : 'Products Matching Selected Components')
        : title;

    const selectedLabels = useMemo(
        () => selectedComponents.map((component) => getComponentLabel(component)),
        [selectedComponents]
    );

    const selectedComponentsKey = JSON.stringify(selectedComponents);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (isComponentMode && !hasSelection) {
                setRecommendations([]);
                setLoading(false);
                return;
            }

            setLoading(true);
            setServiceWarning('');
            try {
                if (isComponentMode) {
                    const response = await axios.post(
                        `${API_URL}/products/recommend/by-components`,
                        {
                            components: toComponentPayload(selectedComponents),
                            currentProductId,
                            categoryId,
                            limit: 4,
                        }
                    );

                    const { items, meta } = parseRecommendationPayload(response.data);
                    setRecommendations(items);
                    setServiceWarning(getRecommendationWarning(meta));
                } else {
                    let url = `${API_URL}/products`;
                    let params: any = { limit: 4 };

                    if (currentProductId) {
                        url = `${API_URL}/products/${currentProductId}/recommendations`;
                    } else if (categoryId) {
                        params.category = categoryId;
                    } else {
                        params.sort = 'totalScans DESC';
                    }

                    const response = await axios.get(url, { params });
                    const { items, meta } = parseRecommendationPayload(response.data);
                    setRecommendations(Array.isArray(items) ? items.slice(0, 4) : []);
                    setServiceWarning(getRecommendationWarning(meta));
                }
            } catch (error) {
                console.error(`Failed to fetch ${mode} recommendations:`, error);
                setRecommendations([]);
                setServiceWarning('');
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [categoryId, isComponentMode, hasSelection, currentProductId, selectedComponentsKey, token]);

    if (isComponentMode && !hasSelection) {
        return null;
    }

    const [discoveryFilter, setDiscoveryFilter] = useState<'brand' | 'exact'>('brand');

    const isPopularMode = !currentProductId && !categoryId && !isComponentMode;

    const splitMatches = useMemo(() => {
        if (!isComponentMode || recommendations.length === 0) return { exact: [], brand: [] };
        
        const exact: any[] = [];
        const brand: any[] = [];
        
        recommendations.forEach(p => {
            const hasExact = Array.isArray(p.matchedComponents) && p.matchedComponents.some((m: any) => m.score >= 180);
            if (hasExact) exact.push(p);
            else brand.push(p);
        });
        
        return { exact, brand };
    }, [isComponentMode, recommendations]);

    useEffect(() => {
        if (isComponentMode && recommendations.length > 0) {
            if (splitMatches.exact.length > 0 && splitMatches.brand.length === 0) {
                setDiscoveryFilter('exact');
            } else if (splitMatches.exact.length === 0 && splitMatches.brand.length > 0) {
                setDiscoveryFilter('brand');
            }
        }
    }, [isComponentMode, splitMatches.exact.length, splitMatches.brand.length]);

    const activeItems = useMemo(() => {
        if (!isComponentMode) return recommendations;
        return discoveryFilter === 'exact' ? splitMatches.exact : splitMatches.brand;
    }, [isComponentMode, recommendations, discoveryFilter, splitMatches]);

    const renderProductGrid = (items: any[]) => (
        <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {items.map((product) => (
                <div
                    key={product.id}
                    className="category-card hover-premium"
                    onClick={() => navigate(`/products/${product.id}`)}
                    style={{ cursor: 'pointer', padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ion-icon 
                                    name={isPopularMode ? "trending-up-outline" : "sparkles-outline"} 
                                    style={{ color: 'var(--color-primary)', fontSize: '1rem' }}
                                ></ion-icon>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                                    {isPopularMode ? 'Popular' : (product.recommendationReason || 'Suggested')}
                                </span>
                            </div>
                            {!isPopularMode && (
                                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                                    {Math.round((product.matchScore || product.score || 0) * 100)}% match
                                </span>
                            )}
                        </div>

                        <h3 className="category-card-title" style={{ fontSize: '1rem', marginBottom: '0.35rem' }}>
                            {formatProductName(product.name, product.manufacturer)}
                            {product.modelNumber ? <span style={{ opacity: 0.6, fontSize: '0.8em', fontWeight: 400 }}> ({product.modelNumber})</span> : null}
                        </h3>

                        <p style={{ margin: '0 0 0.65rem', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                            {product.manufacturer || product.company?.name || 'General product'}
                        </p>

                        <p className="category-card-desc" style={{ fontSize: '0.85rem', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '0.85rem' }}>
                            {product.description || 'View technical details'}
                        </p>

                        {Array.isArray(product.matchedComponents) && product.matchedComponents.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                                {product.matchedComponents.slice(0, 2).map((component: any) => (
                                    <span
                                        key={`${product.id}-${component.source}-${component.matched}`}
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            padding: '0.25rem 0.5rem',
                                            borderRadius: '999px',
                                            background: 'var(--color-surface)',
                                            border: '1px solid var(--color-border)',
                                            color: 'var(--color-text)',
                                            fontSize: '0.72rem',
                                            fontWeight: 500
                                        }}
                                    >
                                        {component.source}
                                    </span>
                                ))}
                            </div>
                        ) : null}
                    </div>

                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.82rem', fontWeight: '600' }}>
                        <span>Learn more</span>
                        <ion-icon name="arrow-forward-outline"></ion-icon>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <section 
            className={`recommendation-section ${isComponentMode ? 'component-matches' : 'related-products'}`}
            style={{ 
                marginTop: isComponentMode ? '2rem' : '4rem', 
                paddingTop: '2rem', 
                borderTop: '1px solid var(--color-border)',
                background: isComponentMode ? 'rgba(var(--color-primary-rgb), 0.02)' : 'transparent',
                borderRadius: isComponentMode ? '12px' : '0',
                padding: isComponentMode ? '2rem' : '2rem 0',
                minHeight: loading ? '400px' : 'auto'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--color-text-strong)', margin: 0 }}>{effectiveTitle}</h2>
                    {isComponentMode ? (
                        <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.92rem' }}>
                            Matching products using shared components first, with AI-driven discovery for the manufacturer.
                        </p>
                    ) : null}
                </div>
                {!isComponentMode && (
                    <span
                        style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }}
                        onClick={() => navigate('/products')}
                    >
                        View all
                    </span>
                )}
            </div>

            {serviceWarning ? (
                <div
                    style={{
                        marginBottom: '1rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        background: 'rgba(245, 158, 11, 0.12)',
                        color: 'var(--color-text)',
                        fontSize: '0.85rem',
                    }}
                >
                    {serviceWarning}
                </div>
            ) : null}

            {isComponentMode ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.25rem' }}>
                            {selectedLabels.map((label, index) => (
                                <span
                                    key={`${label}-${index}`}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        padding: '0.35rem 0.65rem',
                                        borderRadius: '999px',
                                        background: 'rgba(var(--color-primary-rgb), 0.1)',
                                        color: 'var(--color-primary)',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        border: '1px solid rgba(var(--color-primary-rgb), 0.15)',
                                    }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>

                        {recommendations.length > 0 && (
                            <div style={{ 
                                display: 'inline-flex', 
                                background: 'var(--color-surface-raised)', 
                                padding: '3px', 
                                borderRadius: '12px', 
                                border: '1px solid var(--color-border)',
                                marginBottom: '0.5rem'
                            }}>
                                <button
                                    onClick={() => setDiscoveryFilter('exact')}
                                    disabled={splitMatches.exact.length === 0}
                                    style={{
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: splitMatches.exact.length > 0 ? 'pointer' : 'not-allowed',
                                        background: discoveryFilter === 'exact' ? 'var(--color-primary)' : 'transparent',
                                        color: discoveryFilter === 'exact' ? 'white' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: splitMatches.exact.length > 0 ? 1 : 0.4
                                    }}
                                >
                                    <ion-icon name="shield-checkmark-outline"></ion-icon>
                                    Exact Model Match ({splitMatches.exact.length})
                                </button>
                                <button
                                    onClick={() => setDiscoveryFilter('brand')}
                                    disabled={splitMatches.brand.length === 0}
                                    style={{
                                        border: 'none',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        fontSize: '0.85rem',
                                        fontWeight: 600,
                                        cursor: splitMatches.brand.length > 0 ? 'pointer' : 'not-allowed',
                                        background: discoveryFilter === 'brand' ? 'var(--color-primary)' : 'transparent',
                                        color: discoveryFilter === 'brand' ? 'white' : 'var(--color-text-muted)',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        opacity: splitMatches.brand.length > 0 ? 1 : 0.4
                                    }}
                                >
                                    <ion-icon name="search-outline"></ion-icon>
                                    Other {selectedComponents[0]?.manufacturer || 'Same Brand'} Products ({splitMatches.brand.length})
                                </button>
                            </div>
                        )}
                    </div>
                    {onClearSelection ? (
                        <Button type="button" variant="secondary" size="sm" onClick={onClearSelection}>
                            Clear selection
                        </Button>
                    ) : null}
                </div>
            ) : null}

            {loading ? (
                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="product-card skeleton" style={{ minHeight: '180px' }}>
                            <Skeleton width="60%" height={24} className="mb-4" />
                            <Skeleton width="100%" height={16} className="mb-2" />
                            <Skeleton width="80%" height={16} className="mb-2" />
                            <Skeleton width="50%" height={14} />
                        </div>
                    ))}
                </div>
            ) : recommendations.length === 0 ? (
                <EmptyState
                    icon={isPopularMode ? '⭐' : (isComponentMode ? '🧩' : '📦')}
                    title={
                        isPopularMode 
                            ? "No trending products yet" 
                            : (isComponentMode ? "No component matches found" : "No related products yet")
                    }
                    text={
                        isPopularMode
                            ? "As you and others explore products, the most popular items will appear here automatically."
                            : (isComponentMode 
                                ? "No published products in the catalog share these exact components. Try selecting fewer or different parts."
                                : "There are no other products in this category that match your current selection yet.")
                    }
                    action={
                        isComponentMode && onClearSelection ? (
                            <Button variant="secondary" size="sm" onClick={onClearSelection}>
                                Clear selected components
                            </Button>
                        ) : (
                            !isPopularMode && <Button variant="secondary" size="sm" onClick={() => navigate('/categories')}>Browse all categories</Button>
                        )
                    }
                />
            ) : (
                <div style={{ animation: 'fadeIn 0.3s ease' }}>
                    {isComponentMode ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem' }}>
                            <div style={{ height: '4px', width: '24px', background: discoveryFilter === 'exact' ? 'var(--color-primary)' : 'var(--color-text-muted)', borderRadius: '2px', opacity: discoveryFilter === 'exact' ? 1 : 0.5 }}></div>
                            <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 700 }}>
                                {discoveryFilter === 'exact' ? 'Found Identical Technical Matches' : `Discover Related ${selectedComponents[0]?.manufacturer || 'Manufacturer'} Hardware`}
                            </h3>
                        </div>
                    ) : null}
                    {renderProductGrid(activeItems)}
                </div>
            )}
        </section>
    );
};

export default RecommendationSection;
