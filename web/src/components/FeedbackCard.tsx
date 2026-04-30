import React, { useState } from 'react';
import { Button, Badge, IonIcon } from './ui/index';
import { formatDate } from '../utils/helpers';

interface FeedbackCardProps {
    feedback: any;
    isAdmin?: boolean;
    onRespond?: (id: string) => void;
}

export const FeedbackCard: React.FC<FeedbackCardProps> = ({ feedback, isAdmin, onRespond }) => {
    const [showResponseForm, setShowResponseForm] = useState(false);

    return (
        <div className="pw-card pw-p-6 pw-flex-col pw-gap-4">
            <div className="pw-flex pw-justify-between pw-items-start">
                <div className="pw-flex pw-gap-3 pw-items-center">
                    <div style={{ 
                        width: '40px', height: '40px', borderRadius: 'var(--radius-full)', 
                        backgroundColor: 'var(--pw-primary-light)', color: 'var(--pw-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                    }}>
                        {feedback.user?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                        <div className="pw-text-strong">{feedback.user?.name || 'Anonymous'}</div>
                        <div className="pw-text-xs pw-text-muted">{formatDate(feedback.createdAt)}</div>
                    </div>
                </div>
                <div className="pw-flex pw-items-center pw-gap-1" style={{ color: 'var(--pw-warning)' }}>
                    <IonIcon name="star" style={{ fontSize: '18px' }} />
                    <span className="pw-text-strong">{feedback.rating}</span>
                </div>
            </div>

            <p className="pw-text-base">{feedback.comment}</p>

            {feedback.response && (
                <div className="pw-p-4" style={{ 
                    backgroundColor: 'var(--pw-surface-alt)', 
                    borderRadius: 'var(--radius-md)',
                    borderLeft: '4px solid var(--pw-primary)'
                }}>
                    <div className="pw-text-xs pw-text-primary pw-mb-1" style={{ fontWeight: 600 }}>OFFICIAL RESPONSE</div>
                    <p className="pw-text-sm">{feedback.response}</p>
                </div>
            )}

            {isAdmin && !feedback.response && (
                <div className="pw-flex pw-justify-end">
                    <Button variant="ghost" size="sm" onClick={() => onRespond?.(feedback.id)}>
                        Respond
                    </Button>
                </div>
            )}
        </div>
    );
};
