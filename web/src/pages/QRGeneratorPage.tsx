import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Card, PageHeader, Button, Skeleton, Alert, Badge, InputField, EmptyState } from '@/components/ui';
import { RootState } from '@/store';
import { Product } from '@/types/product';
import { QRCodeCanvas } from 'qrcode.react';

const QRGeneratorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, token } = useSelector((state: RootState) => state.auth);
    
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Role check to determine if we should fetch all products (Company Admin hub)
    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' ? role?.name : role || '').toLowerCase();
    const isCompanyAdmin = ['company_admin', 'administrator'].includes(roleName);

    // Fetch all company products if admin
    useEffect(() => {
        const fetchAllProducts = async () => {
            setListLoading(true);
            try {
                // Use manage=true to get company-specific products via backend tenant isolation
                const response = await axios.get(`${API_URL}/products`, {
                    params: { manage: true, limit: 100 }
                });
                const data = response.data.data || response.data;
                setProducts(data);
            } catch (err) {
                console.error('Failed to load company products');
            } finally {
                setListLoading(false);
            }
        };

        if (token && isCompanyAdmin) {
            fetchAllProducts();
        }
    }, [token, isCompanyAdmin]);

    // Fetch specific product details if ID is in URL or selected
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
        } else if (!id) {
            setSelectedProduct(null);
            setLoading(false);
        }
    }, [id, token]);

    const filteredProducts = useMemo(() => {
        if (!searchTerm) return products;
        const lowerTerm = searchTerm.toLowerCase();
        return products.filter(p => 
            p.name.toLowerCase().includes(lowerTerm) || 
            (p.modelNumber && p.modelNumber.toLowerCase().includes(lowerTerm)) ||
            (p.manufacturer && p.manufacturer.toLowerCase().includes(lowerTerm))
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

    const handleSelectProduct = (productId: string) => {
        navigate(`/admin/qr-generate/${productId}`);
    };

    const publicUrl = selectedProduct ? `https://pro-wise-app.vercel.app/products/${selectedProduct.id}` : '';

    return (
        <div className="page" style={{ maxWidth: '1400px' }}>
            <PageHeader
                title="Identity Hub"
                subtitle="Centralized management for physical hardware identifiers and QR markers."
            />

            <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem', height: 'calc(100vh - 200px)', minHeight: '600px' }}>
                {/* Product List Sidebar */}
                <Card className="flex flex-col overflow-hidden" raised style={{ border: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                    <div className="p-5 border-b" style={{ background: 'var(--color-background-soft)' }}>
                        <InputField
                            id="qr-product-search"
                            placeholder="Find hardware assembly..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            icon="search-outline"
                        />
                    </div>
                    
                    <div className="flex-1 overflow-y-auto" style={{ padding: '0.5rem' }}>
                        {listLoading ? (
                            <div className="space-y-2 p-4">
                                <Skeleton height={60} />
                                <Skeleton height={60} />
                                <Skeleton height={60} />
                            </div>
                        ) : filteredProducts.length === 0 ? (
                            <div className="p-8 text-center text-muted">
                                {searchTerm ? 'No matching products.' : 'No products available.'}
                            </div>
                        ) : (
                            filteredProducts.map(p => (
                                <div 
                                    key={p.id}
                                    onClick={() => handleSelectProduct(p.id!)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: 'var(--radius-md)',
                                        cursor: 'pointer',
                                        marginBottom: '0.5rem',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        background: id === p.id ? 'var(--color-primary-soft)' : 'transparent',
                                        border: id === p.id ? '1px solid var(--color-primary)' : '1px solid transparent',
                                        boxShadow: id === p.id ? '0 4px 12px rgba(0, 0, 0, 0.05)' : 'none'
                                    }}
                                    className={id === p.id ? '' : 'hover-premium-light'}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: id === p.id ? 'var(--color-primary)' : 'inherit' }}>{p.name}</span>
                                        <Badge tone={p.status === 'published' ? 'success' : 'warning'} size="xs">
                                            {p.status || 'draft'}
                                        </Badge>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', opacity: 0.6, display: 'flex', gap: '0.5rem' }}>
                                        <span>{p.manufacturer || 'General'}</span>
                                        {p.modelNumber && <span>• {p.modelNumber}</span>}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* QR Focus Area */}
                <div className="flex flex-col">
                    {loading ? (
                        <Card className="flex-1 p-8 flex items-center justify-center" raised>
                            <Skeleton height={300} width={300} borderRadius={24} />
                        </Card>
                    ) : selectedProduct ? (
                        <div style={{ display: 'grid', gridTemplateRows: 'auto 1fr', gap: '2rem', height: '100%' }}>
                            <Card className="p-8 flex flex-col items-center justify-center text-center relative overflow-hidden" raised>
                                {/* Background Accent */}
                                <div style={{ 
                                    position: 'absolute', 
                                    top: '-10%', 
                                    right: '-5%', 
                                    width: '300px', 
                                    height: '300px', 
                                    background: 'var(--color-primary)', 
                                    filter: 'blur(150px)', 
                                    opacity: 0.05,
                                    zIndex: 0
                                }} />

                                <div style={{ 
                                    padding: '2.5rem', 
                                    background: '#fff', 
                                    borderRadius: '32px', 
                                    boxShadow: '0 30px 60px rgba(0,0,0,0.12)', 
                                    marginBottom: '2.5rem',
                                    zIndex: 1,
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <QRCodeCanvas 
                                        id="product-qr-canvas"
                                        value={publicUrl}
                                        size={280}
                                        level="H"
                                        includeMargin={true}
                                        imageSettings={selectedProduct.company?.logo ? {
                                            src: selectedProduct.company.logo,
                                            x: undefined,
                                            y: undefined,
                                            height: 54,
                                            width: 54,
                                            excavate: true,
                                        } : undefined}
                                    />
                                </div>

                                <div style={{ zIndex: 1 }}>
                                    <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>{selectedProduct.name}</h3>
                                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', fontMono: true, fontSize: '0.9rem' }}>{publicUrl}</p>
                                    
                                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                        <Button variant="primary" size="lg" onClick={downloadQR} icon="download-outline">
                                            Download Identity Marker
                                        </Button>
                                    </div>
                                </div>
                            </Card>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                                <Card className="p-6" raised>
                                    <h4 className="mb-6 font-bold flex items-center gap-2">
                                        <ion-icon name="hardware-chip-outline" style={{ color: 'var(--color-primary)' }}></ion-icon>
                                        Assembly Metadata
                                    </h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Identifier</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{selectedProduct.id}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Model</div>
                                            <div>{selectedProduct.modelNumber || 'Standard'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Manufacturer</div>
                                            <div>{selectedProduct.manufacturer || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.75rem', opacity: 0.5, fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>Company</div>
                                            <div>{(typeof selectedProduct.company === 'object' ? selectedProduct.company?.name : '') || 'Global'}</div>
                                        </div>
                                    </div>
                                </Card>

                                <Card className="p-6" raised style={{ background: 'var(--color-primary)', color: 'white' }}>
                                    <h4 className="mb-4 font-bold" style={{ color: 'white' }}>Deployment Guide</h4>
                                    <ul className="space-y-3" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                                        <li style={{ display: 'flex', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 800 }}>1.</span>
                                            <span>Download the High-Res marker (.png)</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 800 }}>2.</span>
                                            <span>Print at 30mm x 30mm minimum size.</span>
                                        </li>
                                        <li style={{ display: 'flex', gap: '0.75rem' }}>
                                            <span style={{ fontWeight: 800 }}>3.</span>
                                            <span>Attach to a visible access panel on the hardware.</span>
                                        </li>
                                    </ul>
                                </Card>
                            </div>
                        </div>
                    ) : (
                        <Card className="flex-1 flex items-center justify-center text-center p-12" raised>
                            <EmptyState
                                icon="qr-code-outline"
                                title="Select a product to begin"
                                text="Choose a hardware assembly from the list to generate its unique identity marker."
                            />
                        </Card>
                    )}
                </div>
            </div>

            {error && <Alert tone="error" className="mt-6">{error}</Alert>}
        </div>
    );
};

export default QRGeneratorPage;
