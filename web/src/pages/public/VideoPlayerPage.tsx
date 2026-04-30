import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageWrapper, Button, IonIcon } from '../../components/index';

export const VideoPlayerPage: React.FC = () => {
    const { videoId } = useParams<{ videoId: string }>();
    const navigate = useNavigate();

    // In a real scenario, fetch video details by ID.
    // For now, it's a simple embed wrapper based on the previous implementation.

    return (
        <PageWrapper maxWidth="900px">
            <div className="pw-mb-6">
                <Button variant="ghost" onClick={() => navigate(-1)} icon={<IonIcon name="arrow-back-outline" />}>
                    Back
                </Button>
            </div>

            <div className="pw-card pw-p-4 pw-mb-6">
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
                    <iframe
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        title="Video Player"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
            
            <div className="pw-card pw-p-6">
                <h2>Video Title</h2>
                <p className="pw-text-muted pw-mt-2">Description of the video would go here, fetched from the backend alongside the video URL.</p>
            </div>
        </PageWrapper>
    );
};
