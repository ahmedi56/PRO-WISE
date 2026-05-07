import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, Section, CategoryCard, ProductCard, Spinner, EmptyState, IonIcon } from '../../components/index';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { Category, Product } from '../../types/product';
import '../../styles/home-page.css';

const Typewriter = ({ text, delay = 0, speed = 30, onComplete }: any) => {
    const [displayed, setDisplayed] = useState("");
    const onCompleteRef = React.useRef(onComplete);
    
    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);
    
    useEffect(() => {
        let i = 0;
        let timer: any;
        let isMounted = true;
        const start = setTimeout(() => {
            timer = setInterval(() => {
                if (!isMounted) return;
                if (i <= text.length) {
                    setDisplayed(text.slice(0, i));
                    i++;
                } else {
                    clearInterval(timer);
                    if (onCompleteRef.current) onCompleteRef.current();
                }
            }, speed);
        }, delay);
        
        return () => {
            isMounted = false;
            clearTimeout(start);
            clearInterval(timer);
        };
    }, [text, speed, delay]);

    return <>{displayed}</>;
};

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);
    const [highlyRated, setHighlyRated] = useState<Product[]>([]);
    const [mostVisited, setMostVisited] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [title1Done, setTitle1Done] = useState(false);
    const [title2Done, setTitle2Done] = useState(false);

    useEffect(() => {
        const fetchHomeData = async () => {
            setLoading(true);
            try {
                // Fetch categories
                try {
                    const catData = await categoryService.getPopular();
                    setCategories(catData || []);
                } catch (catErr) {
                    console.error('Failed to load popular categories:', catErr);
                }

                // Fetch products
                try {
                    const productsData = await productService.getProducts({ limit: 20 });
                    const products = productsData.data || [];

                    setPopularProducts(products.slice(0, 4));
                    setHighlyRated([...products].sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0)).slice(0, 4));
                    setMostVisited([...products].sort((a, b) => (b.ratingCount || 0) - (a.ratingCount || 0)).slice(0, 4));
                } catch (prodErr) {
                    console.error('Failed to load products:', prodErr);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to connect to the server');
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) {
        return (
            <div className="pw-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Spinner size="lg" />
            </div>
        );
    }

    if (error) {
        return <EmptyState icon="alert-circle-outline" title="Error Loading Data" description={error} />;
    }

    return (
        <PageWrapper>
            <div className="home-container">
                <header className="home-hero">
                    <div className="hero-glow-circle glow-1" />
                    <div className="hero-glow-circle glow-2" />
                    
                    <div className="stagger-item stagger-1">
                        <div className="floating-element" style={{ marginBottom: '2rem', display: 'inline-block' }}>
                            <div className="lightning-wrapper" style={{ 
                                padding: '1.25rem', borderRadius: 'var(--radius-xl)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                position: 'relative'
                            }}>
                                <div className="bolt bolt-1"></div>
                                <div className="bolt bolt-2"></div>
                                <div className="bolt bolt-3"></div>
                                <div className="bolt bolt-4"></div>
                                <img src="/pro-wise.svg" alt="Core Insight" className="lightning-effect" style={{ height: '100px', width: 'auto', position: 'relative', zIndex: 2 }} />
                            </div>
                        </div>
                        <h1 className="hero-title" style={{ minHeight: '1.2em' }}>
                            <Typewriter text="The Future of " speed={40} onComplete={() => setTitle1Done(true)} />
                            {title1Done && (
                                <span className="text-gradient">
                                    <Typewriter text="Hardware Support" speed={40} onComplete={() => setTitle2Done(true)} />
                                </span>
                            )}
                        </h1>
                        <p className="hero-subtitle" style={{ minHeight: '3em' }}>
                            {title2Done ? (
                                <Typewriter text="Access premium repair guides, technical manuals, and community-driven support for every device in your catalog." speed={20} />
                            ) : null}
                        </p>
                    </div>

                    <div className="hero-search-wrapper stagger-item stagger-2">
                        <div className="hero-search-box">
                            <IonIcon name="search-outline" style={{ fontSize: '24px', color: 'var(--color-text-muted)', marginRight: '1.25rem' }} />
                            <input 
                                type="text" 
                                className="hero-search-input" 
                                placeholder="Search hardware, guides, or manuals..."
                                onKeyDown={(e) => e.key === 'Enter' && navigate(`/search?q=${(e.target as HTMLInputElement).value}`)}
                            />
                            <button className="hero-search-btn" onClick={() => navigate('/search')}>Search</button>
                        </div>
                    </div>

                    <div className="home-stats-bar stagger-item stagger-3">
                        <div className="stat-item">
                            <span className="stat-value">5.2k+</span>
                            <span className="stat-label">Manuals</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">120+</span>
                            <span className="stat-label">Brands</span>
                        </div>
                        <div className="stat-item" onClick={() => navigate('/technicians')} style={{ cursor: 'pointer' }}>
                            <span className="stat-value">25k+</span>
                            <span className="stat-label">Experts</span>
                        </div>
                    </div>
                </header>

                <main style={{ padding: '0 1rem' }}>
                    <section className="section-modern stagger-item stagger-2">
                        <div className="section-header-modern" style={{ position: 'relative' }}>
                            <div className="bolt bolt-1"></div>
                            <div className="bolt bolt-3" style={{ right: '0', left: 'auto' }}></div>
                            <div className="section-title-group">
                                <h2 className="modern-h2">Expert Network Map</h2>
                                <p className="modern-subtitle">Locate hardware specialists and specialized workshops near you</p>
                            </div>
                            <button className="view-all-link" onClick={() => navigate('/technicians')}>
                                View Full Map <IonIcon name="map-outline" />
                            </button>
                        </div>
                        
                        <div className="card glass" style={{ padding: '3rem', cursor: 'pointer', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }} onClick={() => navigate('/technicians')}>
                            <div className="icon-box" style={{ margin: '0 auto 1.5rem', background: 'rgba(139, 92, 246, 0.1)', color: 'var(--color-primary)' }}>
                                <IonIcon name="navigate-outline" style={{ fontSize: '1.5rem' }} />
                            </div>
                            <h3 className="modern-h3" style={{ color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>Interactive Discovery Engine</h3>
                            <p className="modern-subtitle" style={{ margin: '0' }}>Search over 25,000 verified technicians by location and expertise.</p>
                        </div>
                    </section>

                    <section className="section-modern stagger-item stagger-2">
                        <div className="section-header-modern" style={{ position: 'relative' }}>
                            <div className="bolt bolt-1"></div>
                            <div className="bolt bolt-3" style={{ right: '0', left: 'auto' }}></div>
                            <div className="section-title-group">
                                <h2 className="modern-h2">Premium Categories</h2>
                                <p className="modern-subtitle">Select a category to explore professional hardware guides</p>
                            </div>
                            <button className="view-all-link" onClick={() => navigate('/search')}>
                                Explore All <IonIcon name="arrow-forward-outline" />
                            </button>
                        </div>
                        
                        <div className="category-modern-grid">
                            {categories.map(cat => (
                                <CategoryCard key={cat.id} category={cat} onClick={(id) => navigate(`/home/category/${id}`)} />
                            ))}
                        </div>
                    </section>

                    <section className="section-modern stagger-item stagger-3">
                        <div className="section-header-modern" style={{ position: 'relative' }}>
                            <div className="bolt bolt-2"></div>
                            <div className="bolt bolt-4" style={{ right: '10%', left: 'auto' }}></div>
                            <div className="section-title-group">
                                <h2 className="modern-h2">Recommended for You</h2>
                                <p className="modern-subtitle">AI-curated selection based on technical specifications</p>
                            </div>
                        </div>
                        
                        <div className="product-modern-grid">
                            {popularProducts.map(prod => (
                                <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                            ))}
                        </div>
                    </section>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem' }}>
                        <section className="section-modern stagger-item stagger-4">
                            <div className="section-header-modern">
                                <div className="section-title-group">
                                    <h2 className="modern-h2">Highly Rated</h2>
                                    <p className="modern-subtitle">Top-tier documentation</p>
                                </div>
                            </div>
                            <div className="product-modern-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                {highlyRated.map(prod => (
                                    <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                                ))}
                            </div>
                        </section>

                        <section className="section-modern stagger-item stagger-4">
                            <div className="section-header-modern">
                                <div className="section-title-group">
                                    <h2 className="modern-h2">Global Knowledge</h2>
                                    <p className="modern-subtitle">Most visited community resources</p>
                                </div>
                            </div>
                            <div className="product-modern-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                                {mostVisited.map(prod => (
                                    <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                                ))}
                            </div>
                        </section>
                    </div>

                    <section className="stagger-item stagger-4" style={{ marginTop: '8rem', marginBottom: '6rem' }}>
                        <div className="card glass" style={{ padding: '5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="hero-glow-circle glow-1" style={{ width: '400px', height: '400px', opacity: 0.1, top: '-10%', left: '-10%' }} />
                            <div className="hero-glow-circle glow-2" style={{ width: '400px', height: '400px', opacity: 0.1, bottom: '-10%', right: '-10%' }} />
                            
                            <div style={{ position: 'relative', zIndex: 2 }}>
                                <div className="icon-box" style={{ margin: '0 auto 2rem', background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                                    <IonIcon name="hammer-outline" style={{ fontSize: '2rem' }} />
                                </div>
                                <h2 className="modern-h2" style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Are you a Repair Expert?</h2>
                                <p className="modern-subtitle" style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
                                    Join our global network of specialized technicians. Access professional diagnostic tools, 
                                    contribute to premium repair guides, and help the community master hardware maintenance.
                                </p>
                                <button 
                                    className="hero-search-btn" 
                                    style={{ 
                                        padding: '1.25rem 3.5rem', fontSize: '1.1rem', borderRadius: 'var(--radius-lg)',
                                        height: 'auto', width: 'auto'
                                    }}
                                    onClick={() => navigate('/technician/apply')}
                                >
                                    Apply as a Technician
                                </button>
                            </div>
                        </div>
                    </section>
                </main>
            </div>
        </PageWrapper>
    );
};
