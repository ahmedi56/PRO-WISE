import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/slices/authSlice';
import { useAuth } from '../../hooks/useAuth';
import { PageHeader, Button, PageWrapper, Section, IonIcon } from '../../components/index';
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


    const role = user?.role || (user as any)?.Role;
    const roleName = (typeof role === 'object' && role !== null ? (role as any).name : String(role || '')).toLowerCase();
    const isPending = user.status === 'pending';
    const isSpecializedRole = ['technician', 'administrator', 'company_admin', 'super_admin'].includes(roleName);
    const canApply = (user.technicianStatus === 'none' || !user.technicianStatus) && !isSpecializedRole;

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
                                {user.technicianStatus === 'approved' ? 'Approved Technician' : 
                                 user.technicianStatus === 'pending' ? 'Technician Application Pending' : 
                                 user.technicianStatus === 'rejected' ? 'Technician Application Rejected' : 
                                 (isPending ? 'Account Pending Approval' : (roleName?.replace('_', ' ') || 'User'))}
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

                        {user.technicianStatus === 'approved' && user.technicianProfile && (
                            <div style={{ 
                                marginTop: '1rem', padding: '1.5rem', 
                                background: 'var(--color-surface-variant)', 
                                borderRadius: 'var(--radius-lg)',
                                border: '1px solid var(--color-border)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                                    <div className="icon-box" style={{ width: '40px', height: '40px', fontSize: '18px' }}>
                                        <IonIcon name="ribbon-outline" />
                                    </div>
                                    <div>
                                        <h4 style={{ color: 'var(--color-text-strong)', fontWeight: 700 }}>{user.technicianProfile.headline || 'Hardware Expert'}</h4>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 500 }}>
                                            {user.technicianProfile.experienceYears || 0} Years Professional Experience • {user.technicianProfile.city}, {user.technicianProfile.governorate}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Technical Skills</div>
                                    <div className="chip-selection" style={{ gap: '0.5rem' }}>
                                        {user.technicianProfile.skills?.map((skill: string) => (
                                            <span key={skill} className="chip active" style={{ cursor: 'default' }}>{skill}</span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>Service Categories</div>
                                    <div className="chip-selection" style={{ gap: '0.5rem' }}>
                                        {user.technicianProfile.serviceCategories?.map((cat: string) => (
                                            <span key={cat} className="chip active-secondary" style={{ cursor: 'default' }}>{cat}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                            <Button variant="outline" onClick={() => navigate('/service-request')}>Request Service</Button>
                            
                            {canApply && (
                                <Button variant="secondary" onClick={() => navigate('/technician/apply')}>Become a Technician</Button>
                            )}
                            
                            {user.technicianStatus === 'pending' && (
                                <Button variant="secondary" disabled style={{ opacity: 0.7 }}>Application Pending Review...</Button>
                            )}

                            {user.technicianStatus === 'rejected' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                                    <div style={{ padding: '0.75rem', backgroundColor: 'var(--color-error-light)', borderRadius: '8px', color: 'var(--color-error)', fontSize: '0.875rem' }}>
                                        <strong>Rejection Reason:</strong> {user.technicianProfile?.rejectionReason || 'No reason provided'}
                                    </div>
                                    <Button variant="secondary" onClick={() => navigate('/technician/apply')}>Resubmit Application</Button>
                                </div>
                            )}

                            {user.technicianStatus === 'approved' && (
                                <>
                                    <Button variant="secondary" onClick={() => navigate('/technician-portal')}>Technician Portal</Button>
                                    <Button variant="outline" onClick={() => navigate('/technician/profile')}>Edit Technician Profile</Button>
                                </>
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
