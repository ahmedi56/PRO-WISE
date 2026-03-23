import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { Button, Card } from '../components/ui';

const PendingApprovalPage = () => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    return (
        <div className="auth-layout">
            <section className="auth-form-panel">
                <Card className="max-w-md w-full text-center">
                    <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>⏳</div>
                    <h2 className="mb-4">Account Pending Approval</h2>
                    <p className="mb-6" style={{ color: 'var(--color-text-muted)' }}>
                        Hello {user?.name}, your administrator account for <strong>{user?.company?.name || 'your company'}</strong> has been created successfully.
                    </p>
                    <div className="alert alert-warning mb-6">
                        Our Super Administrators are currently reviewing your request. You will be able to access the admin console once your account is validated.
                    </div>
                    <p className="mb-8">This usually takes less than 24 hours.</p>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <Button variant="secondary" onClick={() => dispatch(logout())}>
                            Sign Out
                        </Button>
                        <Link to="/">
                            <Button variant="ghost">Back to Home</Button>
                        </Link>
                    </div>
                </Card>
            </section>
        </div>
    );
};

export default PendingApprovalPage;
