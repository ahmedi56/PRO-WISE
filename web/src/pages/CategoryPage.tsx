import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_URL } from '@/config';
import CategoryGrid from '@/components/CategoryGrid';
import RecommendationSection from '@/components/RecommendationSection';
import { PageHeader, Skeleton, EmptyState, Button } from '@/components/ui';
import MainLayout from '@/components/MainLayout';
import { CATEGORY_ICON_MAP } from '@/constants/icons';
import { Category } from '@/types/product';
import { RootState } from '@/store';

const CategoryPage: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [parentCategory, setParentCategory] = useState<Category | null>(null);
    const [categoryPath, setCategoryPath] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { token } = useSelector((state: RootState) => state.auth);

    const parentId = searchParams.get('parent');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch category details (which now includes parent path)
                if (parentId) {
                    const catRes = await axios.get(`${API_URL}/categories/${parentId}`);
                    const catData = catRes.data;
                    setCategoryPath(catData.path || []);
                    setParentCategory(catData);
                    setCategories(catData.children || []);
                } else {
                    setCategoryPath([]);
                    setParentCategory(null);
                    // Fetch root categories
                    const response = await axios.get(`${API_URL}/categories`, {
                        params: { level: 0 }
                    });
                    const data = response.data.map((cat: any) => ({
                        ...cat,
                        icon: cat.icon || (CATEGORY_ICON_MAP as any)[cat.name?.toLowerCase()] || 'cube-outline'
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

    const handleCategoryClick = (category: Category) => {
        const hasChildren = category.children && category.children.length > 0;
        if (!hasChildren) {
            navigate(`/products?category=${category.id}`);
        } else {
            navigate(`/categories?parent=${category.id}`);
        }
    };

    const handleBack = () => {
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
                {loading ? (
                    <>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                            <Skeleton width={80} height={20} />
                            <Skeleton width={120} height={20} />
                        </div>
                        
                        <div className="page-header" style={{ marginBottom: 'var(--space-8)' }}>
                            <div style={{ flex: 1 }}>
                                <Skeleton height={40} width="40%" className="mb-2" />
                                <Skeleton height={20} width="60%" />
                            </div>
                        </div>

                        <div className="category-grid">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="category-card-skeleton" style={{ background: 'var(--color-surface)', borderRadius: '12px', height: '140px' }}>
                                    <Skeleton width="100%" height="100%" borderRadius={12} />
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <>
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
                            actions={parentId ? (
                                <Button variant="secondary" onClick={handleBack}>
                                    <ion-icon name="arrow-back-outline" style={{ marginRight: '8px' }}></ion-icon>
                                    Back
                                </Button>
                            ) : undefined}
                        />

                        {categories.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                <EmptyState
                                    title="No subcategories found"
                                    text={parentId ? "This category has no subcategories. You can check the products directly." : "We couldn't find any categories."}
                                    icon="folder-open-outline"
                                    action={parentId ? (
                                        <Button variant="primary" onClick={() => navigate(`/products?category=${parentId}`)}>
                                            View Products in {parentCategory?.name}
                                        </Button>
                                    ) : undefined}
                                />
                            </div>
                        ) : (
                            <CategoryGrid
                                categories={categories}
                                onCategoryClick={handleCategoryClick}
                            />
                        )}

                        {!loading && (
                            <RecommendationSection 
                                categoryId={parentId} 
                                title={parentCategory ? `Popular in ${parentCategory.name}` : "Popular Categories"} 
                            />
                        )}
                    </>
                )}
            </div>
        </MainLayout>
    );
};

export default CategoryPage;
