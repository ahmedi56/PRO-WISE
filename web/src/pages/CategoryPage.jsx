import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';

import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '../config';
import CategoryGrid from '../components/CategoryGrid';
import { PageHeader, Skeleton, EmptyState, Button } from '../components/ui';

const CATEGORY_ICON_MAP = {
    'electronics': 'hardware-chip-outline',
    'medical device': 'medkit-outline',
    'camera': 'camera-outline',
    'repair skills': 'build-outline',
    'gaming console': 'game-controller-outline',
    'in the home': 'home-outline',
    'appliances': 'tv-outline',
    'mac': 'desktop-outline',
    'computer hardware': 'server-outline',
    'computer': 'laptop-outline',
    'tools': 'hammer-outline',
    'tablet': 'tablet-landscape-outline',
    'phone': 'phone-portrait-outline',
    'samsung': 'logo-samsung',
    'apple': 'logo-apple',
    'google': 'logo-google',
    'sony': 'logo-playstation',
    'nintendo': 'game-controller-outline',
    'microsoft': 'logo-microsoft',
    'vehicle': 'car-outline',
    'apparel & accessories': 'shirt-outline',
    'car and truck': 'car-sport-outline'
};

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
                
                // Fetch current parent if drilling down
                if (parentId) {
                    const path = [];
                    let currentCatId = parentId;
                    while (currentCatId) {
                        const catRes = await axios.get(`${API_URL}/categories/${currentCatId}`, config);
                        path.unshift(catRes.data);
                        currentCatId = typeof catRes.data.parent === 'object' ? catRes.data.parent?.id : catRes.data.parent;
                    }
                    setCategoryPath(path);
                    setParentCategory(path[path.length - 1]);
                } else {
                    setCategoryPath([]);
                    setParentCategory(null);
                }

                // Fetch child categories
                const params = parentId ? { parent: parentId } : { level: 0 };
                const response = await axios.get(`${API_URL}/categories`, {
                    ...config,
                    params
                });

                const data = response.data.map(cat => ({
                    ...cat,
                    icon: cat.icon || CATEGORY_ICON_MAP[cat.name?.toLowerCase()] || 'cube-outline'
                }));

                setCategories(data);
            } catch (error) {
                console.error('Failed to fetch categories:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [parentId, token]);

    const handleCategoryClick = async (category) => {
        // Check if category has children to decide whether to drill down or go to products
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${API_URL}/categories`, {
                ...config,
                params: { parent: category.id, limit: 1 }
            });
            
            if (response.data && response.data.length > 0) {
                navigate(`/categories?parent=${category.id}`);
            } else {
                navigate(`/products?category=${category.id}`);
            }
        } catch (error) {
            navigate(`/products?category=${category.id}`);
        }
    };

    const handleBack = () => {
        if (parentCategory?.parent) {
            const pid = typeof parentCategory.parent === 'object' ? parentCategory.parent.id : parentCategory.parent;
            navigate(`/categories?parent=${pid}`);
        } else {
            navigate('/categories');
        }
    };


    return (
        <div className="page">
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
                        <div key={i} className="category-card-skeleton">
                            <Skeleton width={120} height={120} borderRadius={12} />
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <EmptyState
                    title="No categories found"
                    text={parentId ? "This category has no subcategories." : "We couldn't find any categories. Please make sure the database is seeded and you have the correct permissions."}
                    icon="search-outline"
                />
            ) : (
                <CategoryGrid
                    categories={categories}
                    onCategoryClick={handleCategoryClick}
                />
            )}
        </div>
    );
};

export default CategoryPage;
