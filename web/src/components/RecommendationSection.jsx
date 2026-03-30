import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { Skeleton } from './ui';

const RecommendationSection = ({ categoryId, currentProductId, title = "Recommended for You" }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                let url = `${API_URL}/products`;
                let params = { limit: 4, status: 'published' };

                if (currentProductId) {
                    url = `${API_URL}/products/${currentProductId}/recommendations`;
                } else if (categoryId) {
                    // Standard product list filtered by category, avoiding fake semantic AI
                    params.category = categoryId;
                    params.limit = 4;
                } else {
                    // General front-page discoverability
                    params.limit = 4;
                }

                const config = token ? { params, headers: { Authorization: `Bearer ${token}` } } : { params };
                const response = await axios.get(url, config);
                const data = response.data.data || response.data;
                setRecommendations(Array.isArray(data) ? data.slice(0, 4) : []);
            } catch (error) {
                console.error('Failed to fetch recommendations:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecommendations();
    }, [categoryId, currentProductId]);

    if (!loading && recommendations.length === 0) return null;

    return (
        <section className="recommendation-section" style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--color-text-strong)' }}>{title}</h2>
                <span style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: '600', cursor: 'pointer' }} onClick={() => navigate('/products')}>View all</span>
            </div>

            <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
                {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="product-card skeleton" style={{ minHeight: '160px' }}>
                            <Skeleton width="60%" height={24} className="mb-4" />
                            <Skeleton width="100%" height={16} className="mb-2" />
                            <Skeleton width="80%" height={16} />
                        </div>
                    ))
                ) : (
                    recommendations.map((product) => (
                        <div 
                            key={product.id} 
                            className="category-card hover-premium" 
                            onClick={() => navigate(`/products/${product.id}`)}
                            style={{ cursor: 'pointer', padding: '1.25rem', height: '100%', display: 'flex', flexDirection: 'column' }}
                        >
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                                    <ion-icon name="sparkles-outline" style={{ color: 'var(--color-primary)', fontSize: '1rem' }}></ion-icon>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-primary)', letterSpacing: '0.05em' }}>
                                        {product.recommendationReason || 'Suggested'}
                                    </span>
                                </div>
                                <h3 className="category-card-title" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                                    {product.manufacturer && <span style={{ opacity: 0.7, fontSize: '0.85em', fontWeight: 400 }}>{product.manufacturer} </span>}
                                    {product.name}
                                    {product.modelNumber && <span style={{ opacity: 0.6, fontSize: '0.8em', fontWeight: 400 }}> ({product.modelNumber})</span>}
                                </h3>
                                <p className="category-card-desc" style={{ fontSize: '0.85rem', lineClamp: 2, WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {product.description || 'View technical details'}
                                </p>
                            </div>
                            <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.85rem', fontWeight: '600' }}>
                                <span>Learn more</span>
                                <ion-icon name="arrow-forward-outline"></ion-icon>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

export default RecommendationSection;
