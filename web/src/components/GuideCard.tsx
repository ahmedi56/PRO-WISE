import React from 'react';
import { Guide } from '../types/common';
import { Badge, IonIcon } from './ui';

interface GuideCardProps {
    guide: Guide;
    onClick?: (id: string) => void;
}

export const GuideCard: React.FC<GuideCardProps> = ({ guide, onClick }) => {
    const getDifficultyColor = (diff?: string) => {
        const d = diff?.toLowerCase();
        if (d === 'easy') return 'success';
        if (d === 'hard') return 'error';
        return 'warning';
    };

    return (
        <div 
            className="pw-card pw-card-interactive pw-p-4 pw-flex-col" 
            onClick={() => onClick && onClick(guide.id)}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            <div className="pw-flex pw-justify-between pw-items-start pw-mb-2">
                <h4 className="pw-text-lg">{guide.title}</h4>
                <Badge tone={getDifficultyColor(guide.difficulty) as any}>
                    {guide.difficulty || 'Medium'}
                </Badge>
            </div>
            
            <p className="pw-text-sm pw-text-muted pw-mb-4" style={{ flex: 1 }}>
                {guide.description || 'No description provided.'}
            </p>
            
            <div className="pw-flex pw-items-center pw-gap-4 pw-text-sm pw-text-muted" style={{ borderTop: '1px solid var(--pw-border)', paddingTop: 'var(--sp-3)' }}>
                <div className="pw-flex pw-items-center pw-gap-1">
                    <IonIcon name="time-outline" style={{ fontSize: '16px' }} />
                    <span>{guide.estimatedTime || guide.estimated_time || 'N/A'}</span>
                </div>
                <div className="pw-flex pw-items-center pw-gap-1">
                    <IonIcon name="list-outline" style={{ fontSize: '16px' }} />
                    <span>{guide.steps?.length || 0} Steps</span>
                </div>
            </div>
        </div>
    );
};
