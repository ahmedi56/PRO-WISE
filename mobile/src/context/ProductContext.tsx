import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Product } from '../types/product';
import { apiFetch } from '../utils/api';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';

interface ProductContextType {
    product: Product | null;
    loading: boolean;
    error: string | null;
    fetchProduct: (id: string) => Promise<void>;
    clearProduct: () => void;
    activeDomain: string;
    setActiveDomain: (domain: string) => void;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode; initialData?: Product | null }> = ({ children, initialData }) => {
    const [product, setProduct] = useState<Product | null>(initialData || null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeDomain, setActiveDomain] = useState('Overview');

    const fetchProduct = useCallback(async (id: string) => {
        if (product?.id === id && product.components) return; // Already fully loaded (checking components as proxy for detail load)

        setLoading(true);
        setError(null);
        try {
            const res = await apiFetch(`${API_URL}/products/${id}`, {}, undefined);
            const data = await readJson(res);
            
            if (res.ok) {
                setProduct(data.data || data);
            } else {
                throw new Error(data?.message || 'Failed to initialize product data.');
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [product]);

    const clearProduct = useCallback(() => {
        setProduct(null);
        setError(null);
        setActiveDomain('Overview');
    }, []);

    return (
        <ProductContext.Provider value={{ 
            product, 
            loading, 
            error, 
            fetchProduct, 
            clearProduct,
            activeDomain,
            setActiveDomain
        }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProduct = () => {
    const context = useContext(ProductContext);
    if (context === undefined) {
        throw new Error('useProduct must be used within a ProductProvider');
    }
    return context;
};
