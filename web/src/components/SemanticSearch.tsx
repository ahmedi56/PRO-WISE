import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonIcon } from './ui';
import { productService } from '../services/productService';

interface SemanticSearchProps {
    variant?: 'default' | 'large' | 'compact';
}

const SemanticSearch: React.FC<SemanticSearchProps> = ({ variant = 'default' }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Debounced search
    useEffect(() => {
        if (!query.trim() || query.trim().length < 2) {
            setResults([]);
            setMeta(null);
            setIsOpen(false);
            return;
        }

        const timer = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await productService.search(query.trim());
                if (response.success) {
                    setResults(response.data.products.slice(0, 5));
                    setMeta(response.meta);
                    setIsOpen(true);
                }
            } catch (err) {
                // Fail silently as per requirements
                console.debug('Search preview failed', err);
            } finally {
                setLoading(false);
            }
        }, 400); // Slightly faster debounce for better feel

        return () => clearTimeout(timer);
    }, [query]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setIsOpen(false);
        }
    };

    const handleProductClick = (id: string) => {
        navigate(`/products/${id}`);
        setIsOpen(false);
    };

    const isSemantic = meta?.searchType === 'semantic';

    return (
        <div className={`semantic-search-container ${variant}`} ref={dropdownRef} style={{ position: 'relative', width: '100%', maxWidth: variant === 'large' ? '800px' : '400px' }}>
            <div className="search-input-wrapper" style={{ 
                position: 'relative', 
                display: 'flex', 
                alignItems: 'center',
                backgroundColor: 'var(--color-bg-alt)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-border)',
                padding: '0 1rem',
                boxShadow: isOpen ? 'var(--shadow-lg)' : 'none',
                transition: 'all 0.2s ease',
                zIndex: 101
            }}>
                <IonIcon 
                    name={isSemantic ? "sparkles" : "search-outline"} 
                    style={{ fontSize: '1.2rem', color: isSemantic ? 'var(--color-primary)' : 'var(--color-text-muted)' }} 
                />
                <input
                    type="text"
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        padding: '0.85rem 1rem',
                        color: 'var(--color-text-strong)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        fontWeight: 500
                    }}
                    placeholder="Search hardware, models, or brands..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => query.trim().length >= 2 && results.length > 0 && setIsOpen(true)}
                />
                {loading && (
                    <div className="pw-animate-spin" style={{ color: 'var(--color-primary)' }}>
                        <IonIcon name="sync-outline" />
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="search-dropdown" style={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'var(--color-bg)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
                    padding: '0.5rem',
                    zIndex: 100,
                    maxHeight: '450px',
                    overflowY: 'auto'
                }}>
                    <div style={{ 
                        padding: '0.65rem 1rem', 
                        fontSize: '0.65rem', 
                        fontWeight: 800, 
                        color: 'var(--color-text-muted)', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.1em',
                        display: 'flex',
                        justifyContent: 'space-between'
                    }}>
                        <span>{isSemantic ? 'AI Matching Results' : 'Search Results'}</span>
                        {meta?.total && <span>{meta.total} Total</span>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {results.map((product) => (
                            <div 
                                key={product.id} 
                                onClick={() => handleProductClick(product.id)}
                                style={{
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.15rem',
                                    transition: 'all 0.2s'
                                }}
                                className="hover-bg-alt"
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-strong)', fontSize: '0.9rem' }}>{product.name}</span>
                                    {product.matchType && (
                                        <span style={{ 
                                            fontSize: '0.55rem', 
                                            padding: '2px 6px', 
                                            borderRadius: '4px', 
                                            backgroundColor: product.matchType.startsWith('exact') ? 'var(--color-primary)' : 'var(--color-bg-alt)', 
                                            color: product.matchType.startsWith('exact') ? 'white' : 'var(--color-text-muted)', 
                                            fontWeight: 800,
                                            textTransform: 'uppercase'
                                        }}>
                                            {product.matchType.replace('_', ' ')}
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ fontWeight: 700 }}>{product.manufacturer || (typeof product.company === 'object' ? product.company.name : 'Hardware')}</span>
                                    {product.modelNumber && <span>• {product.modelNumber}</span>}
                                </div>
                                {product.recommendationReason && (
                                    <div style={{ 
                                        fontSize: '0.7rem', 
                                        color: 'var(--color-primary)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        marginTop: '4px',
                                        fontWeight: 500
                                    }}>
                                        <IonIcon name="information-circle-outline" style={{ fontSize: '0.85rem' }} />
                                        {product.recommendationReason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div 
                        onClick={() => navigate(`/search?q=${encodeURIComponent(query)}`)}
                        style={{
                            padding: '0.85rem 1rem',
                            textAlign: 'center',
                            color: 'var(--color-primary)',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            borderTop: '1px solid var(--color-border)',
                            marginTop: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                        className="hover-bg-alt"
                    >
                        View All Results
                    </div>
                </div>
            )}
        </div>
    );
};

export default SemanticSearch;
