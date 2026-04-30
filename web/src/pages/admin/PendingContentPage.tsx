import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner, EmptyState, Button, Badge, IonIcon } from '../../components/index';
import { supportService } from '../../services/supportService';

export const PendingContentPage: React.FC = () => {
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const fetchPending = async () => {
        setLoading(true);
        try {
            const data = await supportService.getPendingContent();
            setPendingItems(data || []);
        } catch (err) {
            console.error('Failed to fetch pending content', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const handleAction = async (type: string, id: string, action: 'approve' | 'reject') => {
        try {
            if (action === 'approve') {
                if (!window.confirm('Are you sure you want to approve this content?')) return;
                await supportService.approveContent(type, id);
            } else {
                const reason = window.prompt('Reason for rejection:');
                if (reason === null) return;
                if (!reason.trim()) {
                    alert('Rejection reason is required.');
                    return;
                }
                await supportService.rejectContent(type, id, reason);
            }
            fetchPending();
        } catch (err) {
            alert(`Failed to ${action} content`);
        }
    };

    if (loading) return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>;

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'guide': return 'book-outline';
            case 'video': return 'play-circle-outline';
            case 'product': return 'cube-outline';
            default: return 'document-text-outline';
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <PageHeader 
                title="Content Approval Queue" 
                subtitle="Review and approve support articles, guides, and product submissions" 
            />

            {pendingItems.length === 0 ? (
                <EmptyState 
                    icon="checkmark-done-outline" 
                    title="Queue is Empty" 
                    description="There is currently no content waiting for manual review." 
                />
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ 
                        padding: '0.75rem 1rem', background: 'var(--color-surface-alt)', 
                        borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', 
                        gap: '0.5rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)'
                    }}>
                        <IonIcon name="information-circle-outline" style={{ color: 'var(--color-primary)' }} />
                        <span>You have <strong>{pendingItems.length}</strong> items awaiting review.</span>
                    </div>

                    {pendingItems.map((item) => (
                        <div key={item.id} className="card pw-overflow-hidden" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                                <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start', flex: 1 }}>
                                    <div style={{ 
                                        width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', 
                                        backgroundColor: 'var(--color-surface-raised)', display: 'flex', 
                                        alignItems: 'center', justifyContent: 'center', color: 'var(--color-primary)',
                                        flexShrink: 0, border: '1px solid var(--color-border)'
                                    }}>
                                        <IonIcon name={getTypeIcon(item.type)} style={{ fontSize: '28px' }} />
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                                            <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 800, margin: 0, color: 'var(--color-text-strong)' }}>{item.title}</h3>
                                            <Badge tone="primary" style={{ textTransform: 'uppercase', fontSize: '10px' }}>{item.type}</Badge>
                                            {item.needsManualReview && <Badge tone="warning">Manual Review Required</Badge>}
                                        </div>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <IonIcon name="person-outline" />
                                                {item.author?.name || 'Unknown Author'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <IonIcon name="business-outline" />
                                                {item.company?.name || 'Global'}
                                            </span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                <IonIcon name="time-outline" />
                                                {new Date(item.submittedAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '0.75rem', flexShrink: 0 }}>
                                    <Button variant="ghost" onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}>
                                        {expandedId === item.id ? 'Hide Details' : 'View Details'}
                                    </Button>
                                    <Button variant="ghost" onClick={() => handleAction(item.type, item.id, 'reject')} style={{ color: 'var(--color-error)' }}>Reject</Button>
                                    <Button onClick={() => handleAction(item.type, item.id, 'approve')} icon={<IonIcon name="checkmark-outline" />}>Approve</Button>
                                </div>
                            </div>

                            {expandedId === item.id && (
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', borderTop: '1px solid var(--color-border)', background: 'var(--color-surface-alt)' }}>
                                    <div style={{ marginTop: '1.5rem' }}>
                                        <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>Content Description</h4>
                                        <div style={{ 
                                            padding: '1rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-md)', 
                                            border: '1px solid var(--color-border)', fontSize: 'var(--text-sm)', lineHeight: 1.6, whiteSpace: 'pre-wrap'
                                        }}>
                                            {item.description || 'No description provided.'}
                                        </div>
                                    </div>

                                    {item.type === 'guide' && item.steps?.length > 0 && (
                                        <div style={{ marginTop: '1.5rem' }}>
                                            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '1rem' }}>Repair Steps ({item.steps.length})</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                {item.steps.map((step: any, idx: number) => (
                                                    <div key={idx} style={{ 
                                                        padding: '1.25rem', background: 'var(--color-surface-raised)', borderRadius: 'var(--radius-lg)', 
                                                        border: '1px solid var(--color-border)', display: 'flex', gap: '1.5rem', alignItems: 'flex-start'
                                                    }}>
                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, flexShrink: 0, boxShadow: '0 2px 6px rgba(var(--color-primary-rgb), 0.2)' }}>
                                                            {idx + 1}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 700, fontSize: 'var(--text-base)', color: 'var(--color-text-strong)', marginBottom: '0.5rem' }}>{step.title}</div>
                                                            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: step.image ? '1rem' : 0 }}>{step.description}</div>
                                                            {step.image && (
                                                                <div style={{ width: '100%', maxWidth: '400px', height: '200px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                                                                    <img src={step.image} alt={step.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {item.autoReview && (
                                        <div style={{ 
                                            marginTop: '1.5rem', padding: '1rem', 
                                            background: 'rgba(var(--color-primary-rgb), 0.05)', borderRadius: 'var(--radius-md)',
                                            fontSize: 'var(--text-sm)', border: '1px solid var(--color-primary)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', color: 'var(--color-primary)' }}>
                                                <IonIcon name="sparkles-outline" />
                                                <span style={{ fontWeight: 700 }}>AI Quality Review</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '2rem', marginBottom: item.autoReview.issues?.length ? '0.75rem' : 0 }}>
                                                <span><strong style={{ color: 'var(--color-text-strong)' }}>System Score:</strong> {item.autoReview.score}%</span>
                                                <span><strong style={{ color: 'var(--color-text-strong)' }}>AI Recommendation:</strong> <span style={{ color: item.autoReview.decision === 'approve' ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>{item.autoReview.decision?.toUpperCase()}</span></span>
                                            </div>
                                            {item.autoReview.issues?.length > 0 && (
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                                                    <strong style={{ color: 'var(--color-error)', flexShrink: 0 }}>Flags:</strong>
                                                    <span style={{ color: 'var(--color-text-main)' }}>{item.autoReview.issues.join(', ')}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
