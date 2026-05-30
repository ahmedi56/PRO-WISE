import React from 'react';
import { IonIcon, Button, EmptyState } from '../../../components/ui';

interface MediaAsset {
    id: string;
    title: string;
    url?: string;
    videoId?: string;
    videoUrl?: string;
    author?: string;
    source?: string;
}

interface MediaGalleryProps {
    type: 'videos' | 'documents';
    assets: MediaAsset[];
    onPlayVideo?: (video: MediaAsset) => void;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({ type, assets, onPlayVideo }) => {
    if (!assets || assets.length === 0) {
        return (
            <EmptyState 
                icon={type === 'videos' ? "videocam-outline" : "document-text-outline"} 
                title={type === 'videos' ? "No Videos" : "No PDFs"} 
                description={type === 'videos' ? "No support videos available yet." : "No documentation available yet."} 
            />
        );
    }

    if (type === 'videos') {
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
                {assets.map((video, index) => (
                    <div 
                        key={video.id || index} 
                        className="hover-premium"
                        onClick={() => onPlayVideo?.(video)}
                        style={{ 
                            cursor: 'pointer', display: 'flex', gap: '1.25rem', padding: '1.25rem', 
                            alignItems: 'center', background: 'var(--color-surface-raised)',
                            borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)'
                        }}
                    >
                        <div style={{ 
                            width: '100px', height: '64px', borderRadius: '8px', 
                            background: 'linear-gradient(135deg, var(--color-primary-dark), var(--color-primary))', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)' 
                        }}>
                            <IonIcon name="play" style={{ color: '#fff', fontSize: '1.8rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-strong)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {video.title}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <IonIcon name="person-outline" />
                                {video.author}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {assets.map((doc, index) => (
                <div key={doc.id || index} style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    padding: '1.25rem', background: 'var(--color-surface-raised)', 
                    borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', overflow: 'hidden' }}>
                        <div style={{ 
                            width: '44px', height: '44px', borderRadius: '50%', 
                            background: 'var(--color-primary-faint)', color: 'var(--color-primary)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
                        }}>
                            <IonIcon name="document-text" style={{ fontSize: '1.4rem' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', overflow: 'hidden' }}>
                            <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--color-text-strong)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                {doc.title}
                            </span>
                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                                {doc.author}
                            </span>
                        </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={() => window.open(doc.url, '_blank')} 
                        icon={<IonIcon name="download-outline" />} 
                    />
                </div>
            ))}
        </div>
    );
};
