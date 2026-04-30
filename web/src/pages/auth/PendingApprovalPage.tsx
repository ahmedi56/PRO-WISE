import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../../store/slices/authSlice';
import { AppDispatch } from '../../store';
import { Button, IonIcon } from '../../components/index';

export const PendingApprovalPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1.5rem', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ 
                width: '80px', 
                height: '80px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(var(--color-warning-rgb), 0.1)', 
                color: 'var(--color-warning)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2.5rem',
                marginBottom: '0.5rem',
                border: '2px dashed var(--color-warning-light)'
            }}>
                <IonIcon name="time-outline" />
            </div>
            
            <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text-strong)', marginBottom: '0.75rem' }}>Approval Pending</h2>
                <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                    Your administrative request has been submitted successfully. 
                    A platform Super Admin will verify your company details and approve your account shortly.
                </p>
            </div>

            <div style={{ 
                width: '100%',
                padding: '1rem', 
                backgroundColor: 'var(--color-bg)', 
                borderRadius: '12px', 
                border: '1px solid var(--color-border)',
                fontSize: '0.8125rem',
                color: 'var(--color-text-muted)',
                textAlign: 'left',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start'
            }}>
                <IonIcon name="information-circle-outline" style={{ fontSize: '1.25rem', color: 'var(--color-primary)', marginTop: '2px' }} />
                <span>You will receive an email notification once your account is activated. Please check back later.</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
                <Button onClick={() => window.location.reload()} fullWidth style={{ height: '48px', fontWeight: 600 }}>
                    <IonIcon name="refresh-outline" style={{ marginRight: '8px' }} />
                    Check Status
                </Button>
                <Button variant="ghost" onClick={handleLogout} fullWidth style={{ color: 'var(--color-error)' }}>
                    <IonIcon name="log-out-outline" style={{ marginRight: '8px' }} />
                    Sign Out
                </Button>
            </div>
        </div>
    );
};

