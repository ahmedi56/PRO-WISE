import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { PageWrapper, PageHeader, ProductCard, CategoryCard, Spinner, EmptyState, IonIcon } from '../../components/index';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import { Product, Category } from '../../types/product';
import { CATEGORY_ICON_MAP } from '../../constants/icons';

export const CategoryProductsPage: React.FC = () => {
    const { categoryName } = useParams<{ categoryName: string }>();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch categories for the sidebar
                const cats = await categoryService.getCategories();
                setCategories(cats.data || []);

                // Fetch products for the main view
                if (categoryName) {
                    const response = await productService.getProducts({ category: categoryName });
                    setProducts(response.data || []);
                } else {
                    setProducts([]);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [categoryName]);

    if (loading) {
        return (
            <div className="pw-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    const displayTitle = products.length > 0 && typeof products[0].category === 'object' 
        ? (products[0].category as any).name 
        : (categoryName ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1) : 'Category');

    return (
        <PageWrapper maxWidth="100%">
            <nav className="breadcrumb pw-mb-6" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                <Link to="/home" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Home</Link>
                <span style={{ opacity: 0.5 }}>/</span>
                <Link to="/categories" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>Categories</Link>
                <span style={{ opacity: 0.5 }}>/</span>
                <span style={{ color: 'var(--color-text)' }}>{displayTitle}</span>
            </nav>

            <div className="pw-flex pw-flex-col lg:pw-flex-row pw-gap-8" style={{ marginLeft: '-2rem' }}>
                {/* Visual Sidebar */}
                <aside className="pw-w-full lg:pw-w-64 pw-flex-shrink-0">
                    <div style={{
                        background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.05))',
                        borderRight: '1px solid rgba(99, 102, 241, 0.2)',
                        borderTop: '1px solid rgba(99, 102, 241, 0.2)',
                        borderBottom: '1px solid rgba(99, 102, 241, 0.2)',
                        borderTopRightRadius: 'var(--radius-xl)',
                        borderBottomRightRadius: 'var(--radius-xl)',
                        padding: '0.75rem',
                        backdropFilter: 'blur(12px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
                        position: 'sticky',
                        top: '100px',
                        maxHeight: 'calc(100vh - 140px)',
                        overflowY: 'auto'
                    }}>
                        <h3 className="pw-text-strong pw-mb-4 pw-flex pw-items-center pw-gap-2" style={{ fontSize: '1.1rem', padding: '0 0.5rem' }}>
                            <IonIcon name="layers" style={{ color: 'var(--color-primary)' }} />
                            Directory
                        </h3>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <li>
                                <Link 
                                    to="/categories"
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem',
                                        padding: '0.75rem 1rem',
                                        borderRadius: 'var(--radius-md)',
                                        color: !categoryName ? 'var(--color-text-strong)' : 'var(--color-text-muted)',
                                        backgroundColor: !categoryName ? 'rgba(255,255,255,0.05)' : 'transparent',
                                        textDecoration: 'none',
                                        fontWeight: !categoryName ? 600 : 400,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <IonIcon name="folder-open-outline" style={{ fontSize: '18px', opacity: !categoryName ? 1 : 0.7 }} />
                                    All Categories
                                </Link>
                            </li>
                            {categories
                                .filter(cat => {
                                    // Only show top-level categories in the directory sidebar
                                    const parentId = typeof cat.parent === 'object' ? (cat.parent as any)?.id : cat.parent;
                                    return !parentId;
                                })
                                .map(cat => {
                                    // Match by slug or id
                                    const isActive = categoryName === cat.slug || categoryName === cat.id;
                                    return (
                                        <li key={cat.id}>
                                            <Link 
                                                to={`/home/category/${cat.slug || cat.id}`}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    borderRadius: 'var(--radius-md)',
                                                    color: isActive ? 'white' : 'var(--color-text)',
                                                    backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                                                    textDecoration: 'none',
                                                    fontWeight: isActive ? 600 : 400,
                                                    transition: 'all 0.2s',
                                                    boxShadow: isActive ? '0 4px 12px var(--color-primary-glow)' : 'none'
                                                }}
                                                className={!isActive ? "hover-bg-surface" : ""}
                                            >
                                                <IonIcon 
                                                    name={(CATEGORY_ICON_MAP as any)[cat.name?.toLowerCase()] || cat.icon || 'cube-outline'} 
                                                    style={{ fontSize: '18px', opacity: isActive ? 1 : 0.7 }}
                                                />
                                                {cat.name}
                                            </Link>
                                        </li>
                                    );
                                })}
                        </ul>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="pw-flex-1">
                    {(() => {
                        const currentCategory = categories.find(c => c.slug === categoryName || c.id === categoryName);
                        const subcategories = currentCategory 
                            ? categories.filter(c => {
                                const parentId = typeof c.parent === 'object' ? (c.parent as any)?.id : c.parent;
                                return parentId === currentCategory.id;
                            }) 
                            : [];

                        return (
                            <>
                                <PageHeader 
                                    title={displayTitle} 
                                    subtitle={products.length > 0 
                                        ? `Showing ${products.length} products in this category`
                                        : (subcategories.length > 0 ? `Showing ${subcategories.length} subcategories` : `No products or subcategories`)}
                                />
                                
                                {products.length === 0 && subcategories.length === 0 ? (
                                    <EmptyState 
                                        icon="cube-outline" 
                                        title="No Content Found" 
                                        description={`There are no products or subcategories in the ${displayTitle} directory yet.`} 
                                    />
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                                        {subcategories.length > 0 && (
                                            <div>
                                                <h3 className="pw-mb-4" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Subcategories</h3>
                                                <div className="category-grid">
                                                    {subcategories.map(cat => (
                                                        <CategoryCard key={cat.id} category={cat} onClick={(id) => navigate(`/home/category/${id}`)} />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {products.length > 0 && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                                {subcategories.length > 0 && <h3 className="pw-mb-2" style={{ fontSize: '1.25rem', fontWeight: 700 }}>Products by Brand</h3>}
                                                {(() => {
                                                    const productsByBrand = products.reduce((acc: Record<string, Product[]>, prod) => {
                                                        const brandName = prod.manufacturer || (prod.company && typeof prod.company === 'object' ? prod.company.name : null) || 'Other Brands';
                                                        if (!acc[brandName]) acc[brandName] = [];
                                                        acc[brandName].push(prod);
                                                        return acc;
                                                    }, {});

                                                    return Object.entries(productsByBrand).map(([brandName, brandProducts]) => (
                                                        <div key={brandName} className="brand-card glassmorphism" style={{ 
                                                            padding: '1.5rem', 
                                                            borderRadius: 'var(--radius-xl)',
                                                            border: '1px solid var(--color-border)',
                                                            background: 'linear-gradient(145deg, rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.1))'
                                                        }}>
                                                            <div className="pw-mb-6 pw-flex pw-items-center pw-gap-3" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
                                                                <div style={{ 
                                                                    width: '40px', height: '40px', 
                                                                    borderRadius: 'var(--radius-md)', 
                                                                    background: 'rgba(99, 102, 241, 0.1)',
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    color: 'var(--color-primary)'
                                                                }}>
                                                                    <IonIcon name="business" style={{ fontSize: '20px' }} />
                                                                </div>
                                                                <div>
                                                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>{brandName}</h3>
                                                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{brandProducts.length} Product{brandProducts.length !== 1 ? 's' : ''}</span>
                                                                </div>
                                                            </div>
                                                            <div className="product-grid">
                                                                {brandProducts.map(prod => (
                                                                    <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ));
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            </div>
            
            <style>{`
                .pw-flex { display: flex; }
                .pw-flex-col { flex-direction: column; }
                .pw-gap-8 { gap: 2rem; }
                .pw-flex-1 { flex: 1; }
                .pw-w-full { width: 100%; }
                .pw-flex-shrink-0 { flex-shrink: 0; }
                .pw-mb-6 { margin-bottom: 1.5rem; }
                .hover-bg-surface:hover {
                    background-color: rgba(255,255,255,0.03) !important;
                    color: var(--color-text-strong) !important;
                }
                @media (min-width: 1024px) {
                    .lg\\:pw-flex-row { flex-direction: row !important; }
                    .lg\\:pw-w-64 { width: 16rem !important; }
                }
            `}</style>
        </PageWrapper>
    );
};
