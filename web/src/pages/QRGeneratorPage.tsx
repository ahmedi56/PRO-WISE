import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Card, PageHeader, Button, Skeleton, Alert } from '@/components/ui';
import { RootState } from '@/store';
import { Product } from '@/types/product';
import QRCode from 'qrcode.react';

const QRGeneratorPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { token } = useSelector((state: RootState) => state.auth);
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`${API_URL}/products/${id}`);
                setProduct(response.data);
            } catch (err) {
                setError('Failed to load product details.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, token]);

    const downloadQR = () => {
        const canvas = document.getElementById('product-qr-canvas') as HTMLCanvasElement;
        if (canvas) {
            const pngUrl = canvas.toDataURL('image/png').replace('image/png', 'image/octet-stream');
            let downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = `QR_${product?.name || 'Product'}.png`;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    if (loading) return <div className="page"><Skeleton height={400} /></div>;

    const publicUrl = `https://pro-wise-app.vercel.app/products/${id}`; // Replace with actual production URL logic

    return (
        <div className="page">
            <PageHeader
                title="QR Identity Generator"
                subtitle="Generate a unique physical identifier for this hardware assembly."
                actions={
                    <Link to="/admin/products">
                        <Button variant="secondary">Back to List</Button>
                    </Link>
                }
            />

            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem' }}>
                <Card className="p-8 flex flex-col items-center justify-center text-center" raised>
                    <div style={{ padding: '2rem', background: '#fff', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
                        <QRCode 
                            id="product-qr-canvas"
                            value={publicUrl}
                            size={256}
                            level="H"
                            includeMargin={true}
                            imageSettings={product?.company?.logo ? {
                                src: product.company.logo,
                                x: undefined,
                                y: undefined,
                                height: 48,
                                width: 48,
                                excavate: true,
                            } : undefined}
                        />
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>{product?.name}</h3>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>{publicUrl}</p>
                    <Button variant="primary" size="lg" onClick={downloadQR}>
                        Download QR Asset (.png)
                    </Button>
                </Card>

                <Card className="p-6" raised>
                    <h4 className="mb-4">Hardware Metadata</h4>
                    <div className="space-y-4">
                        <div>
                            <div className="text-xs text-muted uppercase font-bold tracking-wider">Product ID</div>
                            <div className="font-mono text-sm">{id}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted uppercase font-bold tracking-wider">Manufacturer</div>
                            <div>{product?.company?.name || 'N/A'}</div>
                        </div>
                        <div>
                            <div className="text-xs text-muted uppercase font-bold tracking-wider">Status</div>
                            <div className={product?.isPublished ? 'text-success' : 'text-warning'}>
                                {product?.isPublished ? 'Published (Live)' : 'Draft (Admin Only)'}
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 border-t">
                        <p className="text-xs text-muted leading-relaxed">
                            Print this QR code and attach it to the physical equipment. Technicians can scan it with the PRO-WISE mobile app to instantly access repair manuals and components.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default QRGeneratorPage;
