import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../../config';
import { Card, PageHeader, Button, Skeleton, Alert, Badge, InputField, EmptyState } from '../../components/ui';
import { RootState } from '../../store';
import { Product } from '../../types/product';
import { QRCodeCanvas } from 'qrcode.react';

export const QRGeneratorPage: React.FC = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('id');
    const navigate = useNavigate();
    const { user, token } = useSelector((state: RootState) => state.auth);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isCompanyAdmin = ['company_admin', 'administrator', 'super_admin'].includes(roleName);

    useEffect(() => {
        const fetchAllProducts = async () => {
            setListLoading(true);
            try {
                const response = await axios.get(`${API_URL}/products`, {
                    params: { manage: true, limit: 100 },
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = response.data.data || response.data;
                setProducts(data);
            } catch (err) {
                console.error('Failed to load products');
            } finally {
                setListLoading(false);
            }
        };

        if (token && isCompanyAdmin) {
            fetchAllProducts();
        }
    }, [token, isCompanyAdmin]);

    useEffect(() => {
        const fetchProduct = async (productId: string) => {
            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`${API_URL}/products/${productId}`);
                setSelectedProduct(response.data);
            } catch (err) {
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct(id);
        } else {
            setSelectedProduct(null);
            setLoading(false);
        }
    }, [id]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerTerm = searchTerm.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerTerm) || 
            (p.modelNumber && p.modelNumber.toLowerCase().includes(lowerTerm))
        );
    }, [products, searchTerm]);

    const downloadQR = () => {
        const canvas = document.getElementById('product-qr-canvas') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            let downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${selectedProduct?.name || 'Product'}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const publicUrl = selectedProduct ? `${window.location.origin}/products/${selectedProduct.id}` : '';

    return (
        <div className="page" style={{ maxWidth: '1400px' }}>
            <PageHeader
                title="Identity Hub"
                subtitle="Centralized management for physical hardware identifiers and QR markers."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', minHeight: '600px' }}>
                <Card raised style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--color-border)', background: 'rgba(255,255,255,0.02)' }}>
                        <InputField
                            id="qr-product-search"
                            placeholder="Find hardware assembly..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem' }}>
                        {listLoading ? (
                            <div style={{ padding: '1rem' }}>
                                <Skeleton height={60} style={{ marginBottom: '0.5rem' }} />
                                <Skeleton height={60} />
                            </div>
                        ) : (
                            filteredProducts.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => navigate(`/admin/qr-generate?id=${p.id}`)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        marginBottom: '0.5rem',
                                        background: id === p.id ? 'rgba(var(--color-primary-rgb), 0.1)' : 'transparent',
                                        border: id === p.id ? '1px solid var(--color-primary)' : '1px solid transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                        {p.name}
                                        <Badge tone={p.status === 'published' ? 'success' : 'warning'}>{p.status || 'draft'}</Badge>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{p.modelNumber}</div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {loading ? (
                        <Card raised style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Skeleton height={300} width={300} borderRadius={24} />
                        </Card>
                    ) : selectedProduct ? (
                        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '2rem' }}>
                            <Card raised style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ padding: '2rem', background: '#fff', borderRadius: '24px', marginBottom: '2rem' }}>
                                    <QRCodeCanvas 
                                        id="product-qr-canvas"
                                        value={publicUrl}
                                        size={250}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedProduct.name}</h3>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem', fontFamily: 'monospace' }}>{publicUrl}</p>
                                <Button variant="primary" size="lg" onClick={downloadQR}>Download Marker</Button>
                            </Card>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <Card raised style={{ padding: '1.5rem' }}>
                                    <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Assembly Metadata</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
                                        <div><span style={{ opacity: 0.5 }}>Model</span><div>{selectedProduct.modelNumber}</div></div>
                                        <div><span style={{ opacity: 0.5 }}>Manufacturer</span><div>{selectedProduct.manufacturer}</div></div>
                                    </div>
                                </Card>
                                <Card raised style={{ padding: '1.5rem', background: 'var(--color-primary)', color: 'white' }}>
                                    <h4 style={{ marginBottom: '1rem', fontWeight: 700 }}>Deployment</h4>
                                    <ul style={{ padding: 0, listStyle: 'none', fontSize: '0.85rem', opacity: 0.9 }}>
                                        <li>1. Download high-res PNG</li>
                                        <li>2. Print at 30mm x 30mm</li>
                                        <li>3. Attach to hardware panel</li>
                                    </ul>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card raised style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <EmptyState icon="qr-code-outline" title="Select a product" description="Choose a product from the sidebar to generate its QR marker." />
                        </Card>
                    )}
                </div>
            </div>
            {error && <Alert tone="error" className="mt-6">{error}</Alert>}
        </div>
    );
};
