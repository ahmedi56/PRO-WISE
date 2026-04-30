import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, Section, CategoryCard, ProductCard, Spinner, EmptyState } from '../../components/index';
import { categoryService } from '../../services/categoryService';
import { productService } from '../../services/productService';
import { Category, Product } from '../../types/product';

export const HomePage: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);
    const [popularProducts, setPopularProducts] = useState<Product[]>([]);
    const [highlyRated, setHighlyRated] = useState<Product[]>([]);
    const [mostVisited, setMostVisited] = useState<Product[]>([]);
    const [error, setError] = useState<string | null>(null);

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
            <div className="hero-section" style={{ marginBottom: '4rem', paddingTop: '2rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--color-text-strong)', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
                    The Future of <span className="text-gradient">Hardware Support</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--color-text-muted)', maxWidth: '600px', lineHeight: '1.6' }}>
                    Access premium repair guides, technical manuals, and community-driven support for every device in your catalog.
                </p>
            </div>

            <Section title="Premium Categories" subtitle="Select a category to explore professional hardware guides">
                <div className="category-grid" style={{ marginBottom: '4rem' }}>
                    {categories.map(cat => (
                        <CategoryCard key={cat.id} category={cat} onClick={(id) => navigate(`/home/category/${id}`)} />
                    ))}
                    {categories.length === 0 && <p className="pw-text-muted">No categories available.</p>}
                </div>
            </Section>

            <Section title="Recommended for You" subtitle="AI-curated selection based on technical specifications">
                <div className="product-grid" style={{ marginBottom: '4rem' }}>
                    {popularProducts.map(prod => (
                        <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                    ))}
                    {popularProducts.length === 0 && <p className="pw-text-muted">No recommendations available.</p>}
                </div>
            </Section>

            <Section title="Highly Rated Hardware">
                <div className="product-grid" style={{ marginBottom: '4rem' }}>
                    {highlyRated.map(prod => (
                        <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                    ))}
                </div>
            </Section>

            <Section title="Global Knowledge Base" subtitle="The most visited documentation in the community">
                <div className="product-grid">
                    {mostVisited.map(prod => (
                        <ProductCard key={prod.id} product={prod} onClick={(id) => navigate(`/products/${id}`)} />
                    ))}
                </div>
            </Section>
        </PageWrapper>
    );
};
