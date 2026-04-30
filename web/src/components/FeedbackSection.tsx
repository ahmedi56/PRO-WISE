import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_URL } from '../config';
import { 
    Button, 
    Card, 
    Skeleton, 
    Modal, 
    InputField, 
    Badge,
    IonIcon,
    Spinner
} from './ui';
import { RootState } from '../store';

interface Feedback {
    id: string;
    rating: number;
    comment: string;
    response?: string;
    isAnonymous: boolean;
    user: {
        name: string;
        avatar?: string;
    };
    createdAt: string;
}

interface Stats {
    averageRating: number;
    totalCount: number;
}

interface FeedbackSectionProps {
    companyId: string;
    productId?: string;
    summaryOnly?: boolean;
    hideTitle?: boolean;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ 
    companyId, 
    productId, 
    summaryOnly = false,
    hideTitle = false
}) => {
    const { token } = useSelector((state: RootState) => state.auth);
    const [stats, setStats] = useState<Stats>({ averageRating: 0, totalCount: 0 });
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            setStatsLoading(true);
            const response = await axios.get(`${API_URL}/feedback/stats/${companyId}`);
            setStats(response.data);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setStatsLoading(false);
        }
    }, [companyId]);

    const fetchFeedbacks = useCallback(async () => {
        try {
            setLoading(true);
            const params: any = { company: companyId };
            if (productId) params.product = productId;
            
            const response = await axios.get(`${API_URL}/feedback`, { params });
            setFeedbacks(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch feedbacks:', error);
        } finally {
            setLoading(false);
        }
    }, [companyId, productId]);

    useEffect(() => {
        fetchStats();
        if (!summaryOnly) fetchFeedbacks();
    }, [fetchStats, fetchFeedbacks, summaryOnly]);

    const handleSubmit = async () => {
        if (!comment.trim()) return;
        try {
            setSubmitting(true);
            await axios.post(`${API_URL}/feedback`, {
                company: companyId,
                product: productId,
                rating,
                comment,
                isAnonymous
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setModalVisible(false);
            setComment('');
            fetchStats();
            if (!summaryOnly) fetchFeedbacks();
        } catch (error) {
            alert('Failed to submit feedback. Please ensure you are logged in.');
        } finally {
            setSubmitting(false);
        }
    };

    const renderStars = (count: number, interactive = false) => {
        return (
            <div className="star-rating" style={{ display: 'flex', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <span 
                        key={star} 
                        style={{ 
                            fontSize: interactive ? '1.8rem' : '1.1rem',
                            color: star <= (interactive ? rating : count) ? 'var(--color-warning)' : 'rgba(255,255,255,0.1)',
                            cursor: interactive ? 'pointer' : 'default',
                            transition: 'color 0.2s ease',
                        }}
                        onClick={() => interactive && setRating(star)}
                    >
                        ★
                    </span>
                ))}
            </div>
        );
    };

    if (summaryOnly) {
        return (
            <div className="feedback-summary-compact" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {statsLoading ? (
                    <Skeleton width={120} height={24} />
                ) : (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {renderStars(Math.round(stats.averageRating))}
                            <span style={{ fontWeight: 'bold', color: 'var(--color-text-strong)', fontSize: '0.9rem' }}>
                                {stats.averageRating || '0.0'}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                                ({stats.totalCount})
                            </span>
                        </div>
                        <Button variant="primary" size="sm" onClick={() => setModalVisible(true)}>Rate Now</Button>
                    </>
                )}

                {modalVisible && (
                    <Modal 
                        title="Submit Rating" 
                        onClose={() => setModalVisible(false)}
                        actions={
                            <>
                                <Button variant="ghost" onClick={() => setModalVisible(false)} disabled={submitting}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit} disabled={submitting || !comment.trim()}>
                                    {submitting ? 'Submitting...' : 'Post Review'}
                                </Button>
                            </>
                        }
                    >
                        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                            <p style={{ marginBottom: '0.5rem' }}>How would you rate your experience?</p>
                            {renderStars(rating, true)}
                        </div>
                        <InputField 
                            id="comment"
                            label="Your Comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your thoughts..."
                            textArea
                        />
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <input type="checkbox" id="anonymous" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                            <label htmlFor="anonymous" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Post anonymously</label>
                        </div>
                    </Modal>
                )}
            </div>
        );
    }

    return (
        <div style={{ marginTop: '3rem' }}>
            {!hideTitle && <h3 style={{ marginBottom: '1.5rem' }}>Customer Reviews</h3>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <aside className="card" style={{ padding: '2rem', height: 'fit-content', textAlign: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.5rem' }}>{stats.averageRating || '0.0'}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>{renderStars(Math.round(stats.averageRating))}</div>
                    <div style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>Based on {stats.totalCount} reviews</div>
                    <Button variant="primary" fullWidth onClick={() => setModalVisible(true)}>Write a Review</Button>
                </aside>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? [1, 2].map(i => <Skeleton key={i} height={120} />) : feedbacks.length === 0 ? (
                        <div style={{ padding: '3rem', textAlign: 'center', border: '1px dashed var(--color-border)', borderRadius: '12px' }}>
                            <p style={{ color: 'var(--color-text-muted)' }}>No reviews yet.</p>
                        </div>
                    ) : feedbacks.map(fb => (
                        <Card key={fb.id} style={{ background: 'rgba(255,255,255,0.02)' }}>
                            <div style={{ padding: '1.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                            {fb.isAnonymous ? '?' : fb.user?.name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{fb.isAnonymous ? 'Anonymous' : fb.user?.name || 'User'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{new Date(fb.createdAt).toLocaleDateString()}</div>
                                        </div>
                                    </div>
                                    {renderStars(fb.rating)}
                                </div>
                                <p style={{ margin: 0, lineHeight: '1.6' }}>"{fb.comment}"</p>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {modalVisible && (
                <Modal 
                    title="Submit Rating" 
                    onClose={() => setModalVisible(false)}
                    actions={
                        <>
                            <Button variant="ghost" onClick={() => setModalVisible(false)} disabled={submitting}>Cancel</Button>
                            <Button variant="primary" onClick={handleSubmit} disabled={submitting || !comment.trim()}>Post Review</Button>
                        </>
                    }
                >
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                        <p style={{ marginBottom: '0.5rem' }}>How would you rate your experience?</p>
                        {renderStars(rating, true)}
                    </div>
                    <InputField id="comment-full" label="Your Comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your thoughts..." textArea />
                    <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" id="anonymous-full" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} />
                        <label htmlFor="anonymous-full" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Post anonymously</label>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default FeedbackSection;
