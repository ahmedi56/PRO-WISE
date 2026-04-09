import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import RecommendationSection from '@/components/RecommendationSection';
import MainLayout from '@/components/MainLayout';
import { CATEGORY_ICON_MAP } from '@/constants/icons';
import { formatProductName } from '@/utils/formatProduct';
import { RootState, AppDispatch } from '@/store';

const IonIcon = 'ion-icon' as any;
import { Product, Category } from '@/types/product';

const ProductListPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all');
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useSelector((state: RootState) => state.auth);

    const categoryId = searchParams.get('category');
    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role)?.toLowerCase() || '';
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];
    const isAdmin = permissions.includes('products.manage');
    
    let userCompanyId = user?.company;
    if (typeof userCompanyId === 'object' && userCompanyId !== null) {
        userCompanyId = userCompanyId.id;
    }

    const canManageProduct = (product: Product) => {
        if (!isAdmin) return false;
        if (roleName === 'super_admin') return true;
        
        let prodCompanyId = product.company;
        if (typeof prodCompanyId === 'object' && prodCompanyId !== null) {
            prodCompanyId = prodCompanyId.id;
        }
        return String(prodCompanyId) === String(userCompanyId);
    };

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const params: any = {};
                if (categoryId) params.category = categoryId;

                const [categoryResponse, productResponse] = await Promise.all([
                    axios.get(`${API_URL}/categories?tree=true`),
                    axios.get(`${API_URL}/products`, { params }),
                ]);
                if (mounted) {
                    setCategories(categoryResponse.data);
                    const data = productResponse.data.data || productResponse.data;
                    setProducts(data);
                }
            } catch (error) {
                if (mounted) {
                    setCategories([]);
                    setProducts([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchData();
        return () => {
            mounted = false;
        };
    }, [categoryId]);

    const { title, breadcrumbPath, currentCategoryInfo } = useMemo(() => {
        if (!categoryId) {
            return { title: 'All Products', breadcrumbPath: [], currentCategoryInfo: null };
        }
        
        const findPath = (cats: any[], id: string, currentPath: any[] = []): { path: any[], node: any } | null => {
            for (const cat of cats) {
                const path = [...currentPath, cat];
                if (cat.id === id) return { path, node: cat };
                if (cat.children && cat.children.length > 0) {
                    const foundPath = findPath(cat.children, id, path);
                    if (foundPath) return foundPath;
                }
            }
            return null;
        };
        
        const found = findPath(categories, categoryId);
        if (found) {
            return { title: found.path[found.path.length - 1].name, breadcrumbPath: found.path, currentCategoryInfo: found.node };
        }
        return { title: 'Products', breadcrumbPath: [], currentCategoryInfo: null };
    }, [categoryId, categories]);

    const childCategories = currentCategoryInfo?.children || [];

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this product?')) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            setProducts((previous) => previous.filter((product) => product.id !== id));
        } catch (error) {
            window.alert('Failed to delete product.');
        }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await axios.put(`${API_URL}/products/${id}/${newStatus}`, {});
            setProducts((prev) => prev.map(p => p.id === id ? { ...p, status: (newStatus === 'unpublish' ? 'draft' : newStatus) as any } : p));
        } catch (error) {
            window.alert('Failed to update product status.');
        }
    };

    const displayedProducts = products.filter(p => statusFilter === 'all' ? true : p.status === statusFilter);

    return (
        <MainLayout>
            <div className="page" style={{ padding: 0, maxWidth: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        {breadcrumbPath.length > 0 && (
                            <nav className="breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                                <Link to="/categories" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Categories</Link>
                                {breadcrumbPath.map((cat, index) => (
                                    <React.Fragment key={cat.id}>
                                        <span className="separator" style={{ opacity: 0.5 }}>/</span>
                                        {index === breadcrumbPath.length - 1 ? (
                                            <span className="current" style={{ color: 'var(--color-text)' }}>{cat.name}</span>
                                        ) : (
                                            <Link to={`/categories?parent=${cat.id}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{cat.name}</Link>
                                        )}
                                    </React.Fragment>
                                ))}
                            </nav>
                        )}
                        <PageHeader
                    title={title}
                    subtitle="Premium industrial-grade products with attached support guides."
                    actions={
                        isAdmin ? (
                            <>
                                {roleName !== 'super_admin' && (
                                    <Button variant="secondary" onClick={() => navigate('/admin')}>
                                        Admin
                                    </Button>
                                )}
                                <Button variant="primary" onClick={() => navigate('/admin/products/new')}>
                                    Add Product
                                </Button>
                            </>
                        ) : null
                    }
                />

                {roleName === 'super_admin' ? (
                    <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, marginRight: '1rem' }}>Admin View:</span>
                        {(['all', 'draft', 'published', 'archived'] as const).map(status => (
                            <Button
                                key={status}
                                variant={statusFilter === status ? 'primary' : 'secondary'}
                                size="sm"
                                onClick={() => setStatusFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </Button>
                        ))}
                    </div>
                ) : null}

                {loading ? (
                    <div className="product-grid">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={`product-skeleton-${index}`} style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', border: '1px solid var(--color-border)', height: '160px', display: 'flex', gap: '1rem' }}>
                                <Skeleton width={48} height={48} borderRadius={12} />
                                <div style={{ flex: 1 }}>
                                    <Skeleton width="60%" height={24} className="mb-4" />
                                    <Skeleton width="100%" height={16} className="mb-2" />
                                    <Skeleton width="80%" height={16} />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (childCategories.length === 0 && displayedProducts.length === 0) ? (
                    <EmptyState
                        icon="cube-outline"
                        title="No items found"
                        text={
                            categoryId
                                ? 'This category does not have matching products or subcategories.'
                                : 'Start by creating your first product from admin.'
                        }
                    />
                ) : (
                    <div className="product-grid">
                        {childCategories.map((childCat: any) => (
                            <div 
                                className="category-card hover-premium" 
                                key={`cat-${childCat.id}`}
                                onClick={() => setSearchParams({ category: childCat.id })}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="category-card-icon">
                                    <ion-icon 
                                        name={(CATEGORY_ICON_MAP as any)[(childCat.name || '').toLowerCase()] || (childCat.icon as any) || 'folder-outline'} 
                                        size="large" 
                                        style={{ color: 'var(--color-primary)' }}
                                    ></ion-icon>
                                </div>
                                <div className="category-card-content">
                                    <h3 className="category-card-title">{childCat.name}</h3>
                                    <p className="category-card-desc">{childCat.summary || 'Browse subcategories'}</p>
                                </div>
                            </div>
                        ))}
                        {displayedProducts.map((product) => (
                            <div 
                                className="category-card hover-premium" 
                                key={product.id}
                                onClick={() => navigate(`/products/${product.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="category-card-icon">
                                    <IonIcon 
                                        name={(CATEGORY_ICON_MAP as any)[(typeof product.category === 'object' ? product.category?.name : '').toLowerCase()] || (typeof product.category === 'object' ? product.category?.icon : '') || 'cube-outline'} 
                                        size="large" 
                                        style={{ color: 'var(--color-primary)' } as any}
                                    ></IonIcon>
                                </div>
                                <div className="category-card-content">
                                    <h3 className="category-card-title">
                                        {product.manufacturer && <span style={{ opacity: 0.7, fontSize: '0.85em', fontWeight: 400 }}>{product.manufacturer} </span>}
                                        {formatProductName(product.name, product.manufacturer)}
                                        {product.modelNumber && <span style={{ opacity: 0.6, fontSize: '0.8em', fontWeight: 400 }}> ({product.modelNumber})</span>}
                                    </h3>
                                    <p className="category-card-desc">{product.description || 'No description.'}</p>
                                    {canManageProduct(product) && (
                                        <Badge tone={product.status === 'published' ? 'success' : product.status === 'archived' ? 'neutral' : 'warning'}>
                                            {product.status || 'draft'}
                                        </Badge>
                                    )}
                                </div>
                                
                                {canManageProduct(product) && (
                                    <div className="product-card-actions" style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%', padding: '0 1rem 1rem' }} onClick={(e) => e.stopPropagation()}>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => navigate(`/admin/products/${product.id}/edit`)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="danger"
                                            size="sm"
                                            onClick={() => handleDelete(product.id!)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {!loading && (
                    <RecommendationSection 
                        categoryId={categoryId} 
                        title={categoryId ? `Related to ${title}` : "Discover Products"} 
                    />
                )}

                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default ProductListPage;
