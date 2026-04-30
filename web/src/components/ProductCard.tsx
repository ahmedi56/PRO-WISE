import React from 'react';
import { useNavigate } from 'react-router-dom'; 
import { Product } from '../types/product';
import { CATEGORY_ICON_MAP } from '../constants/icons';
import { IonIcon } from './ui';

interface ProductCardProps {
    product: Product;
    onClick?: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick }) => {
    const navigate = useNavigate();
    const categoryName = (typeof product.category === 'object' ? (product.category as any)?.name : '').toLowerCase();
    
    return (
        <div 
            className="pw-card search-result-card pw-flex pw-flex-col" 
            onClick={() => onClick ? onClick(product.id) : navigate(`/products/${product.id}`)}
            style={{ 
                cursor: 'pointer',
                height: '100%',
                border: '1px solid var(--color-border)'
            }}
        >
            {/* Header / Category Icon */}
            <div className="pw-p-5 pw-flex pw-justify-between pw-items-start pw-bg-alt/30 pw-relative">
                <div className="pw-w-12 pw-h-12 pw-bg-surface pw-rounded-xl pw-shadow-sm pw-flex pw-items-center pw-justify-center pw-text-primary pw-border">
                    <IonIcon 
                        name={(CATEGORY_ICON_MAP as any)[categoryName] || 'cube-outline'} 
                        style={{ fontSize: '1.75rem' }} 
                    />
                </div>
                <div className="pw-flex pw-flex-col pw-items-end pw-gap-2">
                    {product.confidence && (
                        <span className={`badge badge-${
                            product.confidence === 'high' ? 'success' : 
                            product.confidence === 'medium' ? 'warning' : 
                            'neutral'
                        }`} style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {product.confidence} Match
                        </span>
                    )}
                </div>
            </div>

            <div className="pw-p-6 pw-flex pw-flex-col pw-flex-1">
                {/* Brand & Model */}
                <div className="pw-flex pw-items-center pw-gap-2 pw-mb-2">
                    <span className="pw-text-xs pw-font-extrabold pw-text-primary pw-uppercase pw-tracking-widest">
                        {typeof product.company === 'object' ? product.company.name : (product.manufacturer || 'Hardware')}
                    </span>
                    {product.modelNumber && (
                        <>
                            <span className="pw-text-muted pw-opacity-50">•</span>
                            <span className="pw-text-xs pw-font-semibold pw-text-muted">{product.modelNumber}</span>
                        </>
                    )}
                </div>

                <h3 className="pw-text-xl pw-font-bold pw-mb-3 pw-text-strong pw-tracking-tight pw-line-clamp-1">
                    {product.name}
                </h3>

                {/* Match Type Badge */}
                {product.matchType && (
                    <div className="pw-mb-4">
                        <span className={`pw-text-[10px] pw-font-extrabold pw-px-2.5 pw-py-1 pw-rounded-md pw-uppercase pw-tracking-tighter ${
                            product.matchType.startsWith('exact') 
                                ? 'pw-bg-primary pw-text-white' 
                                : 'pw-bg-primary-light pw-text-primary pw-border pw-border-primary/20'
                        }`}>
                            {product.matchType.replace('_', ' ')}
                        </span>
                    </div>
                )}

                <p className="pw-text-sm pw-text-muted pw-line-clamp-2 pw-mb-6 pw-leading-relaxed pw-font-medium">
                    {product.description}
                </p>

                {/* Why this result? */}
                {product.recommendationReason && (
                    <div className="pw-mt-auto pw-pt-5 pw-border-t pw-border-border/50">
                        <div className="pw-flex pw-items-start pw-gap-3">
                            <div className="pw-p-1.5 pw-bg-primary-light pw-rounded-lg pw-text-primary">
                                <IonIcon name="sparkles" style={{ fontSize: '0.85rem' }} />
                            </div>
                            <div>
                                <p className="pw-text-[10px] pw-font-bold pw-text-muted pw-uppercase pw-m-0 pw-tracking-wider">AI Insight</p>
                                <p className="pw-text-xs pw-font-bold pw-text-strong pw-m-0 pw-leading-tight">{product.recommendationReason}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
