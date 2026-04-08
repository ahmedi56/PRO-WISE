import React from 'react';
import { Card, Button, PageHeader } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '@/store/slices/authSlice';
import { AppDispatch } from '@/store';

const PendingApprovalPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch<AppDispatch>();

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    return (
        <div className="page-center">
            <Card className="max-w-md w-full text-center p-12" raised>
                <div style={{ fontSize: '4rem', marginBottom: '2rem' }}>⏳</div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1rem' }}>Account Pending Approval</h1>
                <p style={{ color: 'var(--color-text-muted)', marginBottom: '2.5rem', lineHeight: '1.6' }}>
                    Your administrative account has been created successfully. 
                    A platform Super Admin needs to verify and approve your registration before you can access the management governance tools.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Button variant="primary" onClick={() => window.location.reload()} fullWidth>
                        Check Status
                    </Button>
                    <Button variant="secondary" onClick={handleLogout} fullWidth>
                        Logout & Exit
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default PendingApprovalPage;
