import React from 'react';

const EmptyState = ({ icon = '[]', title, text, action }) => (
    <div className="empty-state">
        <div className="empty-state-icon">{icon}</div>
        <div className="empty-state-title">{title}</div>
        {text ? <div className="empty-state-text">{text}</div> : null}
        {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
);

export default EmptyState;