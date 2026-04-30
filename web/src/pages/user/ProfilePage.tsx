import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, Button, PageWrapper, Section } from '../../components/index';
import { InputField } from '../../components/ui/InputField';
import { getInitials, formatDate } from '../../utils/helpers';
import { authService } from '../../services/authService';

export const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        username: user?.username || '',
        name: user?.name || '',
        phone: user?.phone || '',
        bio: (user as any)?.bio || '',
        avatar: user?.avatar || ''
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleSave = async () => {
        try {
            setLoading(true);
            await authService.updateProfile(formData);
            setMessage('Profile updated successfully. Refresh to see changes.');
            setIsEditing(false);
        } catch (err: any) {
            setMessage(err.message || 'Failed to update profile.');
        } finally {
            setLoading(false);
        }
    };

    const handleBecomeTechnician = async () => {
        try {
            setLoading(true);
            const roleName = (user.role && (user.role as any).name ? (user.role as any).name : '').toLowerCase();
      
            if (roleName === 'technician') {
                setMessage('You are already a technician');
                return;
            }

            if (roleName === 'administrator' || roleName === 'company_admin' || roleName === 'super_admin') {
                setMessage('Administrators cannot become technicians');
                return;
            }

            const response = await authService.requestTechnicianUpgrade();
            setMessage(response.message || 'Upgrade request submitted!');
            // Reload user data or update local state if needed
            window.location.reload(); // Simple way to refresh user status
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'Failed to request upgrade.');
        } finally {
            setLoading(false);
        }
    };

    const roleName = (typeof user?.role === 'object' ? (user?.role as any)?.name : user?.role)?.toLowerCase() || '';
    const isCustomer = roleName === 'customer' || roleName === 'user' || roleName === 'client';
    const isPending = user.status === 'pending';
    const isSpecializedRole = roleName === 'technician' || roleName === 'administrator' || roleName === 'company_admin' || roleName === 'super_admin';

    return (
        <PageWrapper maxWidth="800px">
            <PageHeader title="My Profile" subtitle="Manage your account settings and preferences" />

            <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{ 
                        width: '90px', height: '90px', borderRadius: 'var(--radius-full)', 
                        backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '32px', fontWeight: 600, overflow: 'hidden', border: '2px solid var(--color-primary-light)'
                    }}>
                        {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            getInitials(user.name || user.username)
                        )}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-text-strong)', marginBottom: '0.25rem' }}>
                            {user.name || user.username}
                        </h2>
                        <p style={{ color: 'var(--color-text)', marginBottom: '0.25rem' }}>{user.email}</p>
                        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
                            Joined {formatDate(user.createdAt)}
                            <span style={{ margin: '0 8px' }}>•</span>
                            <span style={{ textTransform: 'capitalize', fontWeight: 500, color: 'var(--color-primary)' }}>
                                {isPending ? 'Pending Approval' : (roleName?.replace('_', ' ') || 'Customer')}
                            </span>
                        </div>
                    </div>
                </div>

                {message && (
                    <div style={{ 
                        padding: '1rem', marginBottom: '1.5rem', 
                        backgroundColor: message.includes('failed') || message.includes('Failed') ? 'var(--color-error-light)' : 'var(--color-success-light)', 
                        color: message.includes('failed') || message.includes('Failed') ? 'var(--color-error)' : 'var(--color-success)', 
                        borderRadius: 'var(--radius-md)', fontWeight: 500 
                    }}>
                        {message}
                    </div>
                )}

                {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', animation: 'fadeIn 0.3s ease-in-out' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <InputField 
                                id="name"
                                label="Full Name" 
                                value={formData.name} 
                                onChange={(e) => setFormData({...formData, name: e.target.value})} 
                            />
                            <InputField 
                                id="username"
                                label="Username" 
                                value={formData.username} 
                                onChange={(e) => setFormData({...formData, username: e.target.value})} 
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                            <InputField 
                                id="phone"
                                label="Phone Number" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                            />
                            <InputField 
                                id="avatar"
                                label="Profile Photo URL" 
                                placeholder="https://example.com/avatar.jpg"
                                value={formData.avatar} 
                                onChange={(e) => setFormData({...formData, avatar: e.target.value})} 
                            />
                        </div>
                        <InputField 
                            id="bio"
                            label="Bio" 
                            textArea
                            value={formData.bio} 
                            onChange={(e) => setFormData({...formData, bio: e.target.value})} 
                        />
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                            <Button onClick={handleSave} loading={loading}>Save Changes</Button>
                            <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Name</div>
                                <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>{user.name || '-'}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Phone</div>
                                <div style={{ fontWeight: 500, color: 'var(--color-text-strong)' }}>{user.phone || '-'}</div>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '0.25rem' }}>Bio</div>
                            <p style={{ color: 'var(--color-text)', lineHeight: 1.6 }}>{(user as any)?.bio || 'No bio provided.'}</p>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                            <Button variant="outline" onClick={() => navigate('/service-request')}>Request Service</Button>
                            
                            {isCustomer && !isPending && !isSpecializedRole && (
                                <Button variant="secondary" onClick={handleBecomeTechnician} loading={loading}>Become a Technician</Button>
                            )}
                            
                            {isPending && (
                                <Button variant="secondary" disabled style={{ opacity: 0.7 }}>Upgrade Pending...</Button>
                            )}
                            
                            <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
                        </div>
                    </div>
                )}
            </div>


            <Section title="Account Settings">
                <div className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--color-text-strong)', marginBottom: '0.25rem' }}>Sign Out</h4>
                            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>Sign out of your account on this device.</p>
                        </div>
                        <Button variant="danger" onClick={handleLogout}>Sign Out</Button>
                    </div>
                </div>
            </Section>
        </PageWrapper>
    );
};
