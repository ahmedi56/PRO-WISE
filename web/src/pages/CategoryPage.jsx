import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../config';
import CategoryGrid from '../components/CategoryGrid';
import RecommendationSection from '../components/RecommendationSection';
import { PageHeader, Skeleton, EmptyState, Button } from '../components/ui';
import MainLayout from '../components/MainLayout';
import { CATEGORY_ICON_MAP } from '../constants/icons';

// icon map moved to constants/icons.js

const CategoryPage = () => {
    const [categories, setCategories] = useState([]);
    const [parentCategory, setParentCategory] = useState(null);
    const [categoryPath, setCategoryPath] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { token } = useSelector((state) => state.auth);

    const parentId = searchParams.get('parent');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const config = { headers: { Authorization: `Bearer ${token}` } };
                
                // Fetch category details (which now includes parent path)
                if (parentId) {
                    const catRes = await axios.get(`${API_URL}/categories/${parentId}`, config);
                    const catData = catRes.data;
                    setCategoryPath(catData.path || []);
                    setParentCategory(catData);
                    setCategories(catData.children || []);
                } else {
                    setCategoryPath([]);
                    setParentCategory(null);
                    // Fetch root categories
                    const response = await axios.get(`${API_URL}/categories`, {
                        ...config,
                        params: { level: 0 }
                    });
                    const data = response.data.map(cat => ({
                        ...cat,
                        icon: cat.icon || CATEGORY_ICON_MAP[cat.name?.toLowerCase()] || 'cube-outline'
                    }));
                    setCategories(data);
                }
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [parentId, token]);

    const handleCategoryClick = (category) => {
        // Decide whether to go to subcategories or products based on children count
        // Instead of a separate API call, we can check category.children if available,
        // but since we might be in the root list, we can just use a smarter navigation
        // If it's a leaf node (no children in the tree), go to products.
        // For now, keep it simple: always go to subcategories page, it will handle empty children.
        // OR better: if we have the data, use it.
        if (category.children && category.children.length === 0) {
            navigate(`/products?category=${category.id}`);
        } else {
            navigate(`/categories?parent=${category.id}`);
        }
    };

    const handleBack = () => {
        // Breadcrumb-based back navigation is more stable
        if (categoryPath.length > 1) {
            const prevCat = categoryPath[categoryPath.length - 2];
            navigate(`/categories?parent=${prevCat.id}`);
        } else {
            navigate('/categories');
        }
    };


    return (
        <MainLayout>
            <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                {categoryPath.length > 0 && (
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
                    </nav>
                )}
                <PageHeader
                    title={parentCategory ? parentCategory.name : "Explore Categories"}
                    subtitle={parentCategory ? parentCategory.summary : "Browse our platform to find repair guides, parts, and expert assistance for all your devices."}
                    actions={parentId && (
                        <Button variant="secondary" onClick={handleBack}>
                            <ion-icon name="arrow-back-outline" style={{ marginRight: '8px' }}></ion-icon>
                            Back
                        </Button>
                    )}
                />


                {loading ? (
                    <div className="category-grid">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="category-card-skeleton" style={{ background: 'var(--color-surface)', borderRadius: '12px', height: '140px' }}>
                                <Skeleton width="100%" height="100%" borderRadius={12} />
                            </div>
                        ))}
                    </div>
                ) : categories.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <EmptyState
                            title="No subcategories found"
                            text={parentId ? "This category has no subcategories. You can check the products directly." : "We couldn't find any categories."}
                            icon="folder-open-outline"
                        >
                            {parentId && (
                                <Button variant="primary" onClick={() => navigate(`/products?category=${parentId}`)}>
                                    View Products in {parentCategory?.name}
                                </Button>
                            )}
                        </EmptyState>
                    </div>
                ) : (
                    <>
                        <CategoryGrid
                            categories={categories}
                            onCategoryClick={handleCategoryClick}
                        />
                    </>
                )}

                {!loading && (
                    <RecommendationSection 
                        categoryId={parentId} 
                        title={parentId ? `Recommended in ${parentCategory?.name}` : "Popular Products"} 
                    />
                )}
            </div>
        </MainLayout>
    );
};

export default CategoryPage;
