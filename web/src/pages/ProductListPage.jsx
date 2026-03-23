import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Badge, Button, EmptyState, PageHeader, Skeleton } from '../components/ui';

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

const CategoryItem = ({ category, depth = 0, currentCategoryId, setSearchParams }) => {
    const selected = currentCategoryId === category.id;
    const hasChildren = category.children && category.children.length > 0;
    
    // Auto-expand if a child is selected
    const isChildSelected = useMemo(() => {
        if (!hasChildren) return false;
        const checkChildren = (children) => {
            return children.some(child => 
                child.id === currentCategoryId || (child.children && checkChildren(child.children))
            );
        };
        return checkChildren(category.children);
    }, [category.children, currentCategoryId, hasChildren]);

    const [isExpanded, setIsExpanded] = useState(isChildSelected);

    // Sync expansion when child is selected externally (e.g. browser back/forward or direct link)
    useEffect(() => {
        if (isChildSelected) {
            setIsExpanded(true);
        }
    }, [isChildSelected]);

    const handleCategoryClick = (e) => {
        e.preventDefault();
        setSearchParams({ category: category.id });
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        }
    };

    const handleChevronClick = (e) => {
        e.stopPropagation();
        if (hasChildren) {
            setIsExpanded(!isExpanded);
        }
    };

    return (
        <div className="category-branch" key={category.id}>
            <button
                type="button"
                className={`sidebar-item ${selected ? 'active' : ''}`}
                style={{ paddingLeft: `${16 + depth * 16}px` }}
                onClick={handleCategoryClick}
            >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    {hasChildren ? (
                        <span 
                            onClick={handleChevronClick}
                            style={{ 
                                fontSize: '1rem', 
                                marginRight: '6px', 
                                opacity: 0.5, 
                                display: 'flex',
                                cursor: 'pointer',
                                transition: 'transform 0.2s ease',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
                            }}
                        >
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </span>
                    ) : (
                        depth > 0 && <span style={{ width: '1rem', marginRight: '6px' }}></span>
                    )}
                    <span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}>
                        <ion-icon name={CATEGORY_ICON_MAP[category.name?.toLowerCase()] || 'cube-outline'} style={{ fontSize: '1.2rem' }}></ion-icon>
                    </span>
                    <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {category.name}
                    </span>
                </div>
            </button>
            {hasChildren && (
                <div className={`category-children-wrapper ${isExpanded ? 'expanded' : ''}`}>
                    <div className="category-children-inner">
                        {category.children.map((child) => (
                            <CategoryItem 
                                key={child.id} 
                                category={child} 
                                depth={depth + 1} 
                                currentCategoryId={currentCategoryId}
                                setSearchParams={setSearchParams}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user, token } = useSelector((state) => state.auth);

    const categoryId = searchParams.get('category');
    const role = user?.role || user?.Role;
    const roleName = (role?.name || '').toLowerCase();
    const permissions = (role?.permissions || []);
    const isAdmin = permissions.includes('products.manage');
    
    let userCompanyId = user?.company;
    if (typeof userCompanyId === 'object' && userCompanyId !== null) {
        userCompanyId = userCompanyId.id;
    }

    const canManageProduct = (product) => {
        if (!isAdmin) return false;
        if (roleName === 'super_admin') return true;
        let prodCompanyId = product.company;
        if (typeof prodCompanyId === 'object' && prodCompanyId !== null) {
            prodCompanyId = prodCompanyId.id;
        }
        return String(prodCompanyId) === String(userCompanyId);
    };

    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                const params = {};
                if (categoryId) params.category = categoryId;

                const [categoryResponse, productResponse] = await Promise.all([
                    axios.get(`${API_URL}/categories?tree=true`, config),
                    axios.get(`${API_URL}/products`, { ...config, params }),
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
    }, [categoryId, token]);

    const { title, breadcrumbPath, currentCategoryInfo } = useMemo(() => {
        if (!categoryId) {
            return { title: 'All Products', breadcrumbPath: [], currentCategoryInfo: null };
        }
        
        const findPath = (cats, id, currentPath = []) => {
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

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/products/${id}`, config);
            setProducts((previous) => previous.filter((product) => product.id !== id));
        } catch (error) {
            window.alert('Failed to delete product.');
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await axios.put(`${API_URL}/products/${id}/${newStatus}`, {}, config);
            setProducts((prev) => prev.map(p => p.id === id ? { ...p, status: newStatus === 'unpublish' ? 'draft' : newStatus } : p));
        } catch (error) {
            window.alert('Failed to update product status.');
        }
    };

    const displayedProducts = products.filter(p => statusFilter === 'all' ? true : p.status === statusFilter);

    return (
        <div className="layout-sidebar">
            <aside className={`sidebar ${!isSidebarOpen ? 'collapsed' : ''}`}>

                <div className="sidebar-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Browse Categories</span>
                    <button 
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', fontSize: '1.2rem', padding: '0.2rem', borderRadius: '4px' }}
                        className="hover-premium"
                        title="Hide Categories"
                    >
                        <ion-icon name="chevron-back-outline"></ion-icon>
                    </button>
                </div>
                <button
                    type="button"
                    className={`sidebar-item ${!categoryId ? 'active' : ''}`}
                    onClick={() => setSearchParams({})}
                >
                    All Products
                </button>
                {categories.map((category) => (
                    <CategoryItem 
                        key={category.id} 
                        category={category} 
                        currentCategoryId={categoryId}
                        setSearchParams={setSearchParams}
                    />
                ))}

            </aside>

            <main className="layout-main">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', width: '100%' }}>
                    {!isSidebarOpen && (
                        <button
                            type="button"
                            onClick={() => setIsSidebarOpen(true)}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-muted)',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '0.5rem',
                                borderRadius: 'var(--radius-md)',
                                marginTop: '0.2rem'
                            }}
                            className="hover-premium"
                            title="Show Categories"
                        >
                            <ion-icon name="menu-outline" style={{ fontSize: '1.4rem' }}></ion-icon>
                        </button>
                    )}
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
                                <Button variant="secondary" onClick={() => navigate('/admin')}>
                                    Admin
                                </Button>
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
                        {['all', 'draft', 'published', 'archived'].map(status => (
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
                            <div className="product-card" key={`product-skeleton-${index}`}>
                                <Skeleton width="68%" height={20} className="mb-6" />
                                <Skeleton width="100%" className="mb-6" />
                                <Skeleton width="82%" className="mb-6" />
                                <Skeleton width={112} height={22} borderRadius={999} />
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
                        {childCategories.map((childCat) => (
                            <div 
                                className="category-card hover-premium" 
                                key={`cat-${childCat.id}`}
                                onClick={() => setSearchParams({ category: childCat.id })}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="category-card-icon">
                                    <ion-icon 
                                        name={CATEGORY_ICON_MAP[childCat.name?.toLowerCase()] || 'folder-outline'} 
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
                                    <ion-icon 
                                        name={CATEGORY_ICON_MAP[product.category?.name?.toLowerCase()] || 'cube-outline'} 
                                        size="large" 
                                        style={{ color: 'var(--color-primary)' }}
                                    ></ion-icon>
                                </div>
                                <div className="category-card-content">
                                    <h3 className="category-card-title">{product.name}</h3>
                                    <p className="category-card-desc">{product.description || 'No description.'}</p>
                                    {canManageProduct(product) && (
                                        <Badge tone={product.status === 'published' ? 'success' : product.status === 'archived' ? 'neutral' : 'warning'} style={{ marginTop: '0.5rem' }}>
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
                                            onClick={() => handleDelete(product.id)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProductListPage;