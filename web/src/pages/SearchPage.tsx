import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { PageHeader, EmptyState, Skeleton, Badge } from '@/components/ui';
import { CATEGORY_ICON_MAP } from '@/constants/icons';
import { RootState } from '@/store';
import MainLayout from '@/components/MainLayout';

const parseRecommendationPayload = (payload: any) => {
    if (Array.isArray(payload)) {
        return { items: payload, meta: null };
    }

    if (payload && Array.isArray(payload.data)) {
        return { items: payload.data, meta: payload.meta || null };
    }

    return { items: [], meta: payload?.meta || null };
};

const SearchPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [serviceWarning, setServiceWarning] = useState('');
    const { token } = useSelector((state: RootState) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (query) {
            const fetchResults = async () => {
                setLoading(true);
                setServiceWarning('');
                try {
                    const response = await axios.get(`${API_URL}/products/search/semantic`, {
                        params: { q: query },
                    });
                    const { items, meta } = parseRecommendationPayload(response.data);
                    setResults(items);
                    if (meta?.embedding?.requested && !meta?.embedding?.available) {
                        setServiceWarning('Semantic service is currently unavailable. Showing fallback results.');
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    setResults([]);
                    setServiceWarning('');
                } finally {
                    setLoading(false);
                }
            };
            fetchResults();
        }
    }, [query, token]);

    return (
        <MainLayout>
            <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                <PageHeader 
                    title={query ? `Results for "${query}"` : 'Semantic Search'} 
                    subtitle="Artificial intelligence finding exactly what you need based on meaning."
                />

                {serviceWarning ? (
                    <div
                        style={{
                            marginBottom: '1rem',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: 'var(--color-text)',
                            fontSize: '0.88rem',
                        }}
                    >
                        {serviceWarning}
                    </div>
                ) : null}

                {loading ? (
                    <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="card p-6 border border-border">
                                <Skeleton height={24} width="60%" className="mb-4" />
                                <Skeleton height={60} width="100%" className="mb-4" />
                                <Skeleton height={20} width="40%" />
                            </div>
                        ))}
                    </div>
                ) : results.length > 0 ? (
                    <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {results.map((product) => (
                            <div 
                                key={product.id} 
                                className="category-card hover-premium"
                                onClick={() => navigate(`/products/${product.id}`)}
                                style={{ cursor: 'pointer', position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}
                            >
                                <div className="category-card-icon">
                                    <ion-icon 
                                        name={(CATEGORY_ICON_MAP as any)[product.category?.name?.toLowerCase()] || 'cube-outline'} 
                                        size="large" 
                                        style={{ color: 'var(--color-primary)' }}
                                    ></ion-icon>
                                </div>
                                <div className="category-card-content" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                    <h3 className="category-card-title">{product.name}</h3>
                                    {product.recommendationReason && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                                            <ion-icon name="sparkles-outline" style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}></ion-icon>
                                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                                {product.recommendationReason}
                                            </span>
                                        </div>
                                    )}
                                    <p className="category-card-desc" style={{ lineClamp: 3, WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '1rem' }}>
                                        {product.description}
                                    </p>
                                    <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Badge tone="success" size="sm">
                                            {Math.round((product.score || 0) * 100)}% Match
                                    </Badge>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: '600' }}>View Details</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <EmptyState 
                        icon="search-outline"
                        title={query ? "No relevant products found" : "Enter a search term"}
                        text={query ? "Try using different keywords or describing the problem you're having." : "Search by product name, description, or common issues."}
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default SearchPage;
