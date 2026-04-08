import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Alert, Badge, Button, Card, EmptyState, InputField, Skeleton } from '@/components/ui';
import { RootState } from '@/store';
import { Product } from '@/types/product';

const AdminProductTable: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const { user, token } = useSelector((state: RootState) => state.auth);

    const config = { headers: { Authorization: `Bearer ${token}` } };

    const fetchProducts = async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await axios.get(`${API_URL}/products?manage=true`);
            setProducts(data.data || data);
        } catch (requestError) {
            setError('Failed to load products.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [token]);

    const filteredProducts = useMemo(() => {
        if (!search.trim()) {
            return products;
        }
        const query = search.trim().toLowerCase();
        return products.filter(
            (product) =>
                product.name?.toLowerCase().includes(query) ||
                product.manufacturer?.toLowerCase().includes(query) ||
                product.modelNumber?.toLowerCase().includes(query)
        );
    }, [products, search]);

    const handleDelete = async (id: string) => {
        if (!window.confirm('Delete this product?')) {
            return;
        }
        try {
            await axios.delete(`${API_URL}/products/${id}`);
            setProducts((previous) => previous.filter((product) => product.id !== id));
        } catch (requestError) {
            setError('Failed to delete product.');
        }
    };

    const role = user?.role || (user as any)?.Role;
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];

    return (
        <Card raised className="w-full">
            <div className="page-header page-header-stacked-mobile">
                <div className="page-header-copy">
                    <h3>Product Inventory</h3>
                    <p className="page-subtitle">Create, update, and manage products.</p>
                </div>
                <div className="page-header-actions" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <InputField
                        id="product-search"
                        label=""
                        placeholder="Search items..."
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                    <Link to="/admin/products/new">
                        <Button variant="primary">Add Product</Button>
                    </Link>
                </div>
            </div>

            {error ? <Alert tone="error">{error}</Alert> : null}

            <div className="table-container">
                <table className="table">
                    <thead>
                        <tr className="table-head-row">
                            <th>Name</th>
                            <th>Manufacturer</th>
                            <th>Model</th>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading
                            ? Array.from({ length: 6 }).map((_, index) => (
                                <tr key={`loading-product-${index}`}>
                                    <td><Skeleton width="70%" /></td>
                                    <td><Skeleton width="60%" /></td>
                                    <td><Skeleton width="56%" /></td>
                                    <td><Skeleton width={80} /></td>
                                    <td><Skeleton width={120} style={{ float: 'right' }} /></td>
                                </tr>
                            ))
                            : null}
                        {!loading && filteredProducts.length === 0 ? (
                            <tr>
                                <td colSpan={5}>
                                    <EmptyState
                                        icon="folder-open-outline"
                                        title="No products found"
                                        text="Adjust search or create a new product."
                                    />
                                </td>
                            </tr>
                        ) : null}
                        {!loading
                            ? filteredProducts.map((product) => {
                                return (
                                    <tr key={product.id}>
                                        <td style={{ fontWeight: 600 }}>{product.name}</td>
                                        <td>{product.manufacturer || '-'}</td>
                                        <td>{product.modelNumber || '-'}</td>
                                        <td>
                                            <Badge tone="primary">
                                                {product.category?.name || 'Uncategorized'}
                                            </Badge>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                {permissions.includes('products.update') && (
                                                    <Link to={`/admin/products/${product.id}/edit`}>
                                                        <Button variant="secondary" size="sm">
                                                            Edit
                                                        </Button>
                                                    </Link>
                                                )}
                                                {permissions.includes('products.manage') && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        onClick={() => handleDelete(product.id)}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                            : null}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default AdminProductTable;
