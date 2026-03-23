import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { Card, PageHeader, Button, Alert, Spinner } from '../components/ui';

const QRGeneratorPage = () => {
    const { token } = useSelector((state) => state.auth);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [qrResult, setQrResult] = useState(null);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data } = await axios.get(`${API_URL}/products`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setProducts(data.data || data);
            } catch (err) {
                setError('Failed to load products list.');
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [token]);

    const handleGenerate = async () => {
        if (!selectedProduct) return;
        setGenerating(true);
        setError('');
        try {
            const { data } = await axios.post(`${API_URL}/qr/generate`, { productId: selectedProduct }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setQrResult(data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to generate QR code.';
            setError(errorMsg);
        } finally {
            setGenerating(false);
        }
    };

    const downloadQR = () => {
        if (!qrResult?.qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrResult.qrDataUrl;
        link.download = `qr-${qrResult.product.id}.png`;
        link.click();
    };

    return (
        <div className="page">
            <PageHeader
                title="QR Code Generator"
                subtitle="Generate and download product QR codes for instant guide access."
            />

            {error && <Alert tone="error" className="mb-6">{error}</Alert>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <Card raised className="p-6">
                    <h3 className="mb-4">Select Product</h3>
                    <div className="input-group">
                        <label className="label">Product</label>
                        <select
                            className="input"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                            disabled={loading}
                        >
                            <option value="">Select a product...</option>
                            {products.map(p => (
                                <option key={p.id} value={p.id}>{p.name} ({p.modelNumber || 'No Model'})</option>
                            ))}
                        </select>
                    </div>

                    <Button
                        variant="primary"
                        fullWidth
                        onClick={handleGenerate}
                        disabled={!selectedProduct || generating}
                        style={{ marginTop: '1rem' }}
                    >
                        {generating ? 'Generating...' : 'Generate QR Code'}
                    </Button>
                </Card>

                <Card raised className="p-6 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                    {generating ? (
                        <Spinner />
                    ) : qrResult ? (
                        <>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <img src={qrResult.qrDataUrl} alt="Generated QR" style={{ maxWidth: '200px', borderRadius: '8px', border: '1px solid var(--color-border)' }} />
                            </div>
                            <div className="mb-4">
                                <strong style={{ display: 'block' }}>{qrResult.product.name}</strong>
                                <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Ready for printing</span>
                            </div>
                            <Button variant="secondary" onClick={downloadQR}>Download PNG</Button>
                        </>
                    ) : (
                        <div style={{ color: 'var(--color-text-muted)' }}>
                            Selected a product to see the QR preview.
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default QRGeneratorPage;
