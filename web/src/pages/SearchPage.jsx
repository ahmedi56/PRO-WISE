import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { PageHeader, EmptyState, Skeleton, Badge, Button } from '../components/ui';

const CATEGORY_ICON_MAP = {
    'electronics': 'hardware-chip-outline',
    'medical device': 'medkit-outline',
    'phone': 'phone-portrait-outline'
    // ... can be expanded
};

const parseRecommendationPayload = (payload) => {
    if (Array.isArray(payload)) {
        return { items: payload, meta: null };
    }

    if (payload && Array.isArray(payload.data)) {
        return { items: payload.data, meta: payload.meta || null };
    }

    return { items: [], meta: payload?.meta || null };
};

const SearchPage = () => {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [serviceWarning, setServiceWarning] = useState('');
    const { token } = useSelector((state) => state.auth);
    const navigate = useNavigate();

    useEffect(() => {
        if (query) {
            const fetchResults = async () => {
                setLoading(true);
                setServiceWarning('');
                try {
                    const response = await axios.get(`${API_URL}/products/search/semantic`, {
                        params: { q: query },
                        headers: { Authorization: `Bearer ${token}` }
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
        <div className="container py-8">
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
                        border: '1px solid rgba(var(--color-warning-rgb, 245, 158, 11), 0.35)',
                        background: 'rgba(var(--color-warning-rgb, 245, 158, 11), 0.12)',
                        color: 'var(--color-text)',
                        fontSize: '0.88rem',
                    }}
                >
                    {serviceWarning}
                </div>
            ) : null}

            {loading ? (
                <div className="product-grid">
                    {[1, 2, 3].map(i => <Skeleton key={i} height={200} />)}
                </div>
            ) : results.length > 0 ? (
                <div className="product-grid">
                    {results.map((product) => (
                        <div 
                            key={product.id} 
                            className="category-card hover-premium"
                            onClick={() => navigate(`/products/${product.id}`)}
                            style={{ cursor: 'pointer', position: 'relative' }}
                        >
                            <div className="category-card-icon">
                                <ion-icon 
                                    name={CATEGORY_ICON_MAP[product.category?.name?.toLowerCase()] || 'cube-outline'} 
                                    size="large" 
                                    style={{ color: 'var(--color-primary)' }}
                                ></ion-icon>
                            </div>
                            <div className="category-card-content">
                                <h3 className="category-card-title">{product.name}</h3>
                                {product.recommendationReason && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '0.5rem' }}>
                                        <ion-icon name="sparkles-outline" style={{ color: 'var(--color-primary)', fontSize: '0.9rem' }}></ion-icon>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--color-primary)', textTransform: 'uppercase' }}>
                                            {product.recommendationReason}
                                        </span>
                                    </div>
                                )}
                                <p className="category-card-desc" style={{ lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {product.description}
                                </p>
                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                   <Badge tone="success" size="sm">
                                        {Math.round(product.score * 100)}% Match
                                   </Badge>
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
    );
};

export default SearchPage;
