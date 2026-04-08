import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '@/config';
import { Button, Skeleton, Badge } from '@/components/ui';
import MainLayout from '@/components/MainLayout';
import { RootState } from '@/store';
import { Product } from '@/types/product';

const VideoPlayerPage: React.FC = () => {
    const { id, videoId } = useParams<{ id: string; videoId: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product | null>(null);
    const [currentVideo, setCurrentVideo] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { token } = useSelector((state: RootState) => state.auth);

    useEffect(() => {
        window.scrollTo(0, 0);
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`${API_URL}/products/${id}`);
                const fetchedProduct = response.data;
                setProduct(fetchedProduct);

                // Find the specific video in either supportVideos or legacy guides
                let foundVideo = (fetchedProduct.supportVideos || []).find((v: any) => v.id === videoId || v.videoId === videoId);
                
                if (!foundVideo) {
                    // Check legacy guides
                    (fetchedProduct.guides || []).forEach((guide: any) => {
                        (guide.steps || []).forEach((step: any) => {
                            (step.media || []).forEach((media: any) => {
                                if (media.id === videoId || media.url === videoId) {
                                    foundVideo = {
                                        ...media,
                                        author: 'Legacy Support',
                                        _ctx: { guideTitle: guide.title, stepTitle: step.title }
                                    };
                                }
                            });
                        });
                    });
                }
                
                setCurrentVideo(foundVideo);
            } catch (error) {
                console.error('Failed to fetch video data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, videoId, token]);

    if (loading) {
        return (
            <MainLayout>
                <div className="page" style={{ padding: '2rem 0' }}>
                    <Skeleton height={400} width="100%" borderRadius={16} />
                    <Skeleton height={40} width="60%" style={{ marginTop: '2rem' }} />
                    <Skeleton height={20} width="30%" style={{ marginTop: '1rem' }} />
                </div>
            </MainLayout>
        );
    }

    if (!currentVideo) {
        return (
            <MainLayout>
                <div className="page" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                    <ion-icon name="videocam-off-outline" style={{ fontSize: '4rem', color: 'var(--color-text-muted)' }}></ion-icon>
                    <h2 style={{ marginTop: '1.5rem' }}>Video not found</h2>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '2rem' }}>The video you are looking for is missing or inaccessible.</p>
                    <Button onClick={() => navigate(`/products/${id}`)}>Back to Product</Button>
                </div>
            </MainLayout>
        );
    }

    const { videoId: ytId, videoUrl, url: legacyUrl, title, author, _ctx } = currentVideo;
    const finalLocalUrl = videoUrl || legacyUrl;

    return (
        <MainLayout>
            <div className="page" style={{ padding: '2rem 0' }}>
                <div className="video-player-container glassmorphism" style={{ borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', background: '#000', position: 'relative' }}>
                    {ytId ? (
                        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                            <iframe
                                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                title={title}
                            ></iframe>
                        </div>
                    ) : (
                        <video 
                            controls 
                            autoPlay 
                            className="video-player"
                            style={{ width: '100%', maxHeight: '80vh', background: '#000' }}
                        >
                            <source src={finalLocalUrl} type="video/mp4" />
                            Your browser does not support the video tag.
                        </video>
                    )}
                </div>

                <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '300px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                            <Badge tone="primary" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>
                                {ytId ? 'Online Source' : 'Local Archive'}
                            </Badge>
                            {_ctx && (
                                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                                    {_ctx.guideTitle} • {_ctx.stepTitle}
                                </span>
                            )}
                        </div>
                        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: '0 0 1rem', color: 'var(--color-text-strong)' }}>{title}</h1>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '1.1rem', maxWidth: '800px', lineHeight: '1.6' }}>
                            Author: <span style={{ color: 'var(--color-primary)', fontWeight: 600 }}>{author || 'Internal Support'}</span>
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Button variant="secondary" onClick={() => navigate(`/products/${id}`)}>
                            Exit Theater
                        </Button>
                        <Button variant="primary" onClick={() => window.print()}>
                            Print Details
                        </Button>
                    </div>
                </div>

                <div style={{ marginTop: '4rem', paddingTop: '3rem', borderTop: '1px solid var(--color-border)' }}>
                    <h3 style={{ marginBottom: '2rem' }}>Next from {product?.name}</h3>
                    <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                        {(product?.supportVideos || []).filter((v: any) => v.id !== videoId && v.videoId !== videoId).map((video: any) => (
                            <div 
                                key={video.id} 
                                className="category-card hover-premium"
                                onClick={() => navigate(`/products/${id}/videos/${video.id || video.videoId}`)}
                                style={{ padding: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                            >
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(var(--color-primary-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ion-icon name="play-circle-outline" style={{ color: 'var(--color-primary)', fontSize: '1.5rem' }}></ion-icon>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '1rem' }}>{video.title}</h4>
                                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Next in queue</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

export default VideoPlayerPage;
