import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { EmptyState, Skeleton, Button, IonIcon } from './ui';
import { formatProductName } from '../utils/formatProduct';
import { RootState } from '../store';

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
    const navigate = useNavigate();
    const { token } = useSelector((state: RootState) => state.auth);

    const isComponentMode = mode === 'components';
    const hasSelection = selectedComponents.length > 0;

    const effectiveTitle = isComponentMode
        ? (selectedComponents.length === 1 ? 'Products Built With This' : 'Matching Components')
        : title;

    const selectedComponentsKey = JSON.stringify(selectedComponents);

    useEffect(() => {
        const fetchRecommendations = async () => {
            if (isComponentMode && !hasSelection) {
                setRecommendations([]);
                setLoading(false);
                return;
            }

            setLoading(true);
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
                    const { items } = parseRecommendationPayload(response.data);
                    setRecommendations(items);
                } else {
                    let url = `${API_URL}/products`;
                    let params: any = { limit: 4 };

                    if (currentProductId) {
                        url = `${API_URL}/products/${currentProductId}/recommendations`;
                    } else if (categoryId) {
                        params.category = categoryId;
                    }

                    const response = await axios.get(url, { params });
                    const { items } = parseRecommendationPayload(response.data);
                    setRecommendations(Array.isArray(items) ? items.slice(0, 4) : []);
                }
            } catch (error) {
                console.error(`Failed to fetch recommendations:`, error);
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [categoryId, isComponentMode, hasSelection, currentProductId, selectedComponentsKey, token]);

    if (isComponentMode && !hasSelection) return null;

    return (
        <section style={{ marginTop: '4rem', padding: '2rem 0', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{effectiveTitle}</h2>
                {!isComponentMode && <span style={{ color: 'var(--color-primary)', cursor: 'pointer' }} onClick={() => navigate('/categories')}>View all</span>}
            </div>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {[...Array(4)].map((_, i) => <Skeleton key={i} height={180} />)}
                </div>
            ) : recommendations.length === 0 ? (
                <EmptyState title="No recommendations" text="We couldn't find any matching products." />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                    {recommendations.map(product => (
                        <div key={product.id} className="card hover-premium" onClick={() => navigate(`/products/${product.id}`)} style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '0.5rem' }}>
                                    {product.matchType && (
                                        <span className={`badge badge-${
                                            product.matchType.startsWith('exact') ? 'primary' : 
                                            product.matchType === 'same_brand' || product.matchType === 'same_category' ? 'info' : 
                                            'neutral'
                                        }`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                            {product.matchType.replace('_', ' ').toUpperCase()}
                                        </span>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.5rem' }}>{formatProductName(product.name, product.manufacturer)}</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{product.manufacturer}</p>
                            </div>
                            {product.recommendationReason && (
                                <div style={{ 
                                    marginTop: '1rem', 
                                    paddingTop: '0.75rem', 
                                    borderTop: '1px solid var(--color-border)', 
                                    fontSize: '0.7rem', 
                                    color: 'var(--color-primary)', 
                                    fontWeight: 700, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '0.5rem', 
                                    lineHeight: 1.4 
                                }}>
                                    <IonIcon name="information-circle-outline" style={{ fontSize: '1rem', flexShrink: 0 }} />
                                    <span>{product.recommendationReason}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
};

export default RecommendationSection;
