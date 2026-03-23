import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadUser, resetSuccess, updateUser, updateCompany } from '../store/slices/authSlice';
import { Alert, Badge, Button, Card, InputField, Skeleton } from '../components/ui';

const ProfilePage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user, loading, error, updateSuccess } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState('');
    const [formData, setFormData] = useState({ name: '', username: '', email: '', phone: '' });
    const [companyFormData, setCompanyFormData] = useState({ 
        name: '', 
        description: '', 
        logo: '', 
        contactInfo: '', 
        address: '', 
        website: '' 
    });
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' or 'company'

    useEffect(() => {
        dispatch(loadUser());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                username: user.username || '',
                email: user.email || '',
                phone: user.phone || '',
            });
            if (user.company) {
                setCompanyFormData({
                    name: user.company.name || '',
                    description: user.company.description || '',
                    logo: user.company.logo || '',
                    contactInfo: user.company.contactInfo || '',
                    address: user.company.address || '',
                    website: user.company.website || '',
                });
            }
        }
    }, [user]);

    useEffect(() => {
        if (updateSuccess) {
            setIsEditing(false);
            dispatch(resetSuccess());
            setToast('Profile updated successfully.');
            const timeoutId = setTimeout(() => setToast(''), 2400);
            return () => clearTimeout(timeoutId);
        }
        return undefined;
    }, [updateSuccess, dispatch]);

    useEffect(() => {
        if (!user && (error === 'No token found' || error === 'Session expired')) {
            navigate('/login');
        }
    }, [user, error, navigate]);

    if (loading && !user) {
        return (
            <div className="page-center">
                <Card className="max-w-md w-full">
                    <div className="profile-card">
                        <Skeleton width={84} height={84} borderRadius={999} className="mb-6" />
                        <Skeleton width="58%" height={18} className="mb-6" />
                        <Skeleton width="72%" height={14} />
                    </div>
                </Card>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="page-center">
                <Alert tone="info">User data is unavailable for this session.</Alert>
            </div>
        );
    }

    const role = user.role || user.Role;
    const roleName = role?.name || 'User';
    const displayName = user.name || user.username || 'User';
    const initial = displayName[0]?.toUpperCase() || 'U';

    const handleSubmit = (event) => {
        event.preventDefault();
        if (activeTab === 'profile') {
            dispatch(updateUser(formData));
        } else {
            dispatch(updateCompany({ id: user.company?.id || user.company, companyData: companyFormData }));
        }
    };

    const isCompanyAdmin = roleName.toLowerCase() === 'company_admin' || roleName.toLowerCase() === 'administrator';

    return (
        <div className="page-center">
            <Card className="max-w-md w-full">
                <div className="profile-card">
                    <div className="profile-avatar">{initial}</div>
                    <div className="profile-name">{displayName}</div>
                    <div className="profile-email">{user.email}</div>
                    <Badge tone="primary">{roleName}</Badge>
                </div>

                {error ? <Alert tone="error">{error}</Alert> : null}

                {isCompanyAdmin && (
                    <div className="tab-navigation" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--color-border)' }}>
                        <button 
                            className={`tab-item ${activeTab === 'profile' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('profile'); setIsEditing(false); }}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'profile' ? '2px solid var(--color-primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'profile' ? '600' : '400' }}
                        >
                            My Profile
                        </button>
                        <button 
                            className={`tab-item ${activeTab === 'company' ? 'active' : ''}`}
                            onClick={() => { setActiveTab('company'); setIsEditing(false); }}
                            style={{ padding: '0.5rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'company' ? '2px solid var(--color-primary)' : 'none', cursor: 'pointer', fontWeight: activeTab === 'company' ? '600' : '400' }}
                        >
                            Company Profile
                        </button>
                    </div>
                )}

                {isEditing ? (
                    <form onSubmit={handleSubmit}>
                        {activeTab === 'profile' ? (
                            <>
                                <InputField
                                    id="profile-name"
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            name: event.target.value,
                                        }))
                                    }
                                />
                                <InputField
                                    id="profile-username"
                                    label="Username"
                                    value={formData.username}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            username: event.target.value,
                                        }))
                                    }
                                />
                                <InputField
                                    id="profile-email"
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            email: event.target.value,
                                        }))
                                    }
                                />
                                <InputField
                                    id="profile-phone"
                                    label="Phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            phone: event.target.value,
                                        }))
                                    }
                                    placeholder="+1 (555) 000-0000"
                                />
                            </>
                        ) : (
                            <>
                                <InputField
                                    id="company-name"
                                    label="Company Name"
                                    value={companyFormData.name}
                                    disabled={roleName.toLowerCase() !== 'super_admin'}
                                    onChange={(event) =>
                                        setCompanyFormData((prev) => ({ ...prev, name: event.target.value }))
                                    }
                                />
                                <div className="input-group">
                                    <label className="label" htmlFor="company-description">Company Description</label>
                                    <textarea
                                        id="company-description"
                                        className="input"
                                        rows={3}
                                        value={companyFormData.description}
                                        onChange={(event) =>
                                            setCompanyFormData((prev) => ({ ...prev, description: event.target.value }))
                                        }
                                    />
                                </div>
                                <InputField
                                    id="company-logo"
                                    label="Logo URL"
                                    value={companyFormData.logo}
                                    onChange={(event) =>
                                        setCompanyFormData((prev) => ({ ...prev, logo: event.target.value }))
                                    }
                                />
                                <InputField
                                    id="company-contact"
                                    label="Contact Info"
                                    value={companyFormData.contactInfo}
                                    onChange={(event) =>
                                        setCompanyFormData((prev) => ({ ...prev, contactInfo: event.target.value }))
                                    }
                                />
                                <InputField
                                    id="company-address"
                                    label="Address"
                                    value={companyFormData.address}
                                    onChange={(event) =>
                                        setCompanyFormData((prev) => ({ ...prev, address: event.target.value }))
                                    }
                                />
                                <InputField
                                    id="company-website"
                                    label="Website"
                                    value={companyFormData.website}
                                    onChange={(event) =>
                                        setCompanyFormData((prev) => ({ ...prev, website: event.target.value }))
                                    }
                                />
                            </>
                        )}
                        <div className="page-header-actions" style={{ marginTop: '2rem' }}>
                            <Button type="submit" variant="primary" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={() => setIsEditing(false)}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                ) : (
                    <div className="text-center">
                        {activeTab === 'company' && (
                            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{user.company?.name || 'Your Company'}</div>
                                <p style={{ color: 'var(--color-text-muted)', marginBottom: '1rem' }}>{user.company?.description || 'No description provided.'}</p>
                                {user.company?.contactInfo && <div><strong>Contact:</strong> {user.company.contactInfo}</div>}
                                {user.company?.address && <div><strong>Address:</strong> {user.company.address}</div>}
                                {user.company?.website && <div><strong>Website:</strong> <a href={user.company.website} target="_blank" rel="noopener noreferrer">{user.company.website}</a></div>}
                            </div>
                        )}
                        <Button type="button" variant="primary" onClick={() => setIsEditing(true)}>
                            {activeTab === 'profile' ? 'Edit Profile' : 'Edit Company Profile'}
                        </Button>
                    </div>
                )}
            </Card>

            {toast ? <div className="toast toast-success">{toast}</div> : null}
        </div>
    );
};

export default ProfilePage;