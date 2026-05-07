import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, IonIcon } from './ui/index';
import { RootState, AppDispatch } from '../store';
import { fetchNotifications, markAsRead, markAllRead } from '../store/slices/notificationSlice';

export const NotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dispatch = useDispatch<AppDispatch>();
    const { items: notifications, unreadCount, loading } = useSelector((state: RootState) => state.notifications);

    useEffect(() => {
        dispatch(fetchNotifications());
        
        // Refresh every 30 seconds
        const interval = setInterval(() => {
            dispatch(fetchNotifications());
        }, 30000);
        
        return () => clearInterval(interval);
    }, [dispatch]);

    const handleMarkAsRead = (id: string) => {
        dispatch(markAsRead(id));
    };

    const handleMarkAllRead = () => {
        dispatch(markAllRead());
    };

    return (
        <div className="pw-relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="nav-icon-btn pw-relative"
                style={{ padding: 0 }}
            >
                <IonIcon name="notifications-outline" style={{ fontSize: '20px' }} />
                {unreadCount > 0 && (
                    <div className="pw-absolute" style={{ top: '4px', right: '4px' }}>
                        <Badge tone="error" className="pw-text-xs">
                            {unreadCount}
                        </Badge>
                    </div>
                )}
            </button>

            {isOpen && (
                <div 
                    className="pw-card pw-absolute pw-top-full pw-right-0 pw-z-100 pw-mt-2 pw-fade-in" 
                    style={{ 
                        width: '320px', 
                        maxWidth: 'calc(100vw - 40px)', 
                        boxShadow: 'var(--shadow-lg)',
                        right: 0
                    }}
                >
                    <div className="pw-p-4" style={{ borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 className="pw-text-base" style={{ fontWeight: 700 }}>Notifications</h4>
                        {unreadCount > 0 && (
                            <button 
                                onClick={handleMarkAllRead}
                                className="pw-text-xs pw-text-primary" 
                                style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                                Mark all read
                            </button>
                        )}
                    </div>
                    
                    <div className="pw-overflow-y-auto" style={{ maxHeight: '400px' }}>
                        {notifications.length === 0 ? (
                            <div className="pw-p-6 pw-flex pw-justify-center">
                                <p className="pw-text-muted pw-text-sm">No new notifications</p>
                            </div>
                        ) : (
                            <div className="pw-flex-col">
                                {notifications.map((n) => (
                                    <div 
                                        key={n.id} 
                                        className={`pw-p-4 hover:pw-bg-surface-alt ${!n.read ? 'pw-bg-surface-alt' : ''}`}
                                        style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer', position: 'relative' }}
                                        onClick={() => handleMarkAsRead(n.id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div className="pw-text-sm pw-text-strong pw-mb-1" style={{ fontWeight: !n.read ? 700 : 500 }}>{n.title}</div>
                                            {!n.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-primary)', marginTop: '4px' }} />}
                                        </div>
                                        <div className="pw-text-xs pw-text-muted" style={{ lineHeight: 1.4 }}>{n.message}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
