import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageWrapper, PageHeader, ProductCard, Spinner, EmptyState, IonIcon } from '../../components/index';
import { productService } from '../../services/productService';
import { Product } from '../../types/product';

export const SearchPage: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    
    const [products, setProducts] = useState<Product[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState(query);

    const handleSearch = async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) {
            setProducts([]);
            setCompanies([]);
            setMeta(null);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await productService.search(trimmed);
            if (response.success) {
                setProducts(response.data.products || []);
                setCompanies(response.data.companies || []);
                setMeta(response.meta);
            } else {
                setError(response.message || 'Search is temporarily unavailable. Please try again.');
            }
        } catch (err: any) {
            console.error('Search error:', err);
            setError('The search service encountered an error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    // Trigger search when query param changes
    useEffect(() => {
        if (query) {
            setSearchTerm(query);
            handleSearch(query);
        } else {
            setProducts([]);
            setCompanies([]);
            setMeta(null);
        }
    }, [query]);

    const onSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = searchTerm.trim();
        if (trimmed) {
            setSearchParams({ q: trimmed });
        }
    };

    const searchTypeLabel = meta?.searchType === 'fallback' ? 'Keyword' : 
                           meta?.searchType === 'semantic' ? 'AI Semantic' : 
                           meta?.searchType ? meta.searchType.charAt(0).toUpperCase() + meta.searchType.slice(1) : 'Standard';

    return (
        <PageWrapper>
            <div className="pw-py-12 pw-bg-alt/10">
                <div className="pw-container">
                    <div className="pw-max-w-4xl pw-mx-auto pw-text-center pw-mb-12">
                        <h1 className="pw-text-5xl pw-font-extrabold pw-mb-4 pw-text-strong pw-tracking-tighter">Search</h1>
                        <p className="pw-text-lg pw-text-muted pw-mb-10">
                            {query ? `Showing results for "${query}"` : "Discover hardware, documentation, and manufacturer specifications"}
                        </p>

                        <form 
                            onSubmit={onSearchSubmit} 
                            className="search-input-premium pw-flex pw-items-center pw-gap-3 pw-p-2.5 pw-bg-surface pw-rounded-2xl pw-border pw-shadow-lg"
                        >
                            <div className="pw-flex-1 pw-relative">
                                <div className="pw-absolute pw-left-5 pw-top-1/2 pw-translate-y-[-50%] pw-text-primary">
                                    <IonIcon name="search-outline" style={{ fontSize: '1.5rem' }} />
                                </div>
                                <input 
                                    className="search-input-field"
                                    value={searchTerm} 
                                    onChange={(e) => setSearchTerm(e.target.value)} 
                                    placeholder="Search products, models, brands, or components"
                                    autoFocus
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="pw-btn-primary search-submit-btn"
                            >
                                Search
                            </button>
                        </form>

                        {query && !loading && meta && (
                            <div className="pw-mt-8 pw-flex pw-flex-wrap pw-justify-center pw-items-center pw-gap-4">
                                <div className="pw-flex pw-items-center pw-gap-2 pw-bg-success/10 pw-text-success pw-px-4 pw-py-1.5 pw-rounded-full pw-border pw-border-success/20">
                                    <IonIcon name="checkmark-circle" />
                                    <span className="pw-text-xs pw-font-bold pw-uppercase pw-tracking-wider">{meta.total} Results Found</span>
                                </div>
                                <div className="pw-flex pw-items-center pw-gap-2 pw-bg-primary/10 pw-text-primary pw-px-4 pw-py-1.5 pw-rounded-full pw-border pw-border-primary/20">
                                    <IonIcon name={meta.searchType === 'semantic' ? 'sparkles' : 'flash'} />
                                    <span className="pw-text-xs pw-font-bold pw-uppercase pw-tracking-wider">{searchTypeLabel} Matching</span>
                                </div>
                                {meta.degraded && (
                                    <div className="pw-flex pw-items-center pw-gap-2 pw-bg-warning/10 pw-text-warning pw-px-4 pw-py-1.5 pw-rounded-full pw-border pw-border-warning/20">
                                        <IonIcon name="alert-circle" />
                                        <span className="pw-text-xs pw-font-bold pw-uppercase pw-tracking-wider">Offline Engine</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pw-container pw-py-12">
                {loading ? (
                    <div className="pw-grid pw-grid-cols-1 pw-grid-md-2 pw-grid-lg-4 pw-gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="pw-card pw-animate-pulse pw-bg-alt/20" style={{ height: '380px', borderRadius: 'var(--radius-xl)' }}></div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="pw-card pw-p-12 pw-text-center pw-max-w-2xl pw-mx-auto pw-border-primary/20">
                        <div className="pw-text-error pw-mb-6">
                            <IonIcon name="alert-circle-outline" style={{ fontSize: '5rem' }} />
                        </div>
                        <h2 className="pw-text-3xl pw-font-extrabold pw-mb-4">Search Error</h2>
                        <p className="pw-text-lg pw-text-muted pw-mb-10">{error}</p>
                        <button 
                            onClick={() => handleSearch(query)} 
                            className="pw-btn-primary pw-px-10 pw-py-4"
                        >
                            Try Again
                        </button>
                    </div>
                ) : query && products.length === 0 && companies.length === 0 ? (
                    <EmptyState 
                        icon="search-outline" 
                        title="No Precision Matches Found" 
                        description={`Our search engine couldn't find any direct matches for "${query}". Try refining your search with a model number or manufacturer name.`} 
                    />
                ) : (
                    <div className="pw-space-y-24">
                        {/* Companies Section */}
                        {companies.length > 0 && (
                            <section>
                                <div className="pw-flex pw-items-center pw-gap-4 pw-mb-10">
                                    <div className="pw-w-12 pw-h-12 pw-bg-primary pw-text-white pw-rounded-xl pw-flex pw-items-center pw-justify-center pw-shadow-glow">
                                        <IonIcon name="business" style={{ fontSize: '1.5rem' }} />
                                    </div>
                                    <div>
                                        <h2 className="pw-text-3xl pw-font-bold pw-m-0 pw-tracking-tight">Manufacturers</h2>
                                        <p className="pw-text-muted pw-m-0">Verified hardware providers matching your query</p>
                                    </div>
                                </div>
                                <div className="pw-grid pw-grid-cols-1 pw-grid-md-2 pw-grid-lg-3 pw-gap-8">
                                    {companies.map(company => (
                                        <div 
                                            key={company.id} 
                                            className="pw-card search-result-card pw-p-8 pw-flex pw-items-center pw-gap-6 pw-cursor-pointer group"
                                        >
                                            <div className="pw-w-16 pw-h-16 pw-bg-alt pw-rounded-2xl pw-flex pw-items-center pw-justify-center pw-text-primary group-hover:pw-bg-primary group-hover:pw-text-white pw-transition-all pw-duration-300">
                                                <IonIcon name="cube" style={{ fontSize: '2.2rem' }} />
                                            </div>
                                            <div className="pw-flex-1">
                                                <h4 className="pw-text-xl pw-font-bold pw-mb-1">{company.name}</h4>
                                                <div className="pw-flex pw-items-center pw-gap-2">
                                                    <span className="pw-text-xs pw-font-extrabold pw-text-primary pw-uppercase pw-tracking-widest">{company.industry || 'Hardware'}</span>
                                                    <span className="pw-text-muted pw-opacity-50">•</span>
                                                    <span className="pw-text-xs pw-font-semibold pw-text-muted">Verified</span>
                                                </div>
                                            </div>
                                            <IonIcon name="chevron-forward" className="pw-text-muted group-hover:pw-text-primary pw-translate-x-0 group-hover:pw-translate-x-2 pw-transition-all" />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Products Section */}
                        {products.length > 0 && (
                            <section>
                                <div className="pw-flex pw-items-center pw-gap-4 pw-mb-10">
                                    <div className="pw-w-12 pw-h-12 pw-bg-primary pw-text-white pw-rounded-xl pw-flex pw-items-center pw-justify-center pw-shadow-glow">
                                        <IonIcon name="layers" style={{ fontSize: '1.5rem' }} />
                                    </div>
                                    <div>
                                        <h2 className="pw-text-3xl pw-font-bold pw-m-0 pw-tracking-tight">Products & Components</h2>
                                        <p className="pw-text-muted pw-m-0">Technical documentation and specifications</p>
                                    </div>
                                </div>
                                <div className="pw-grid pw-grid-cols-1 pw-grid-md-2 pw-grid-lg-4 pw-gap-10">
                                    {products.map(product => (
                                        <ProductCard key={product.id} product={product} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                )}
            </div>
        </PageWrapper>
    );
};
