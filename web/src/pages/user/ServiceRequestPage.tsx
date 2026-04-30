import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageWrapper, PageHeader, Input, Button } from '../../components/index';
import { maintenanceService } from '../../services/maintenanceService';

export const ServiceRequestPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        productName: '',
        issueDescription: '',
        urgency: 'low'
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await maintenanceService.createRequest(formData);
            alert('Service request submitted successfully!');
            navigate('/profile');
        } catch (err) {
            console.error(err);
            alert('Failed to submit service request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <PageHeader title="Request Maintenance" subtitle="Need help with your product? Request a repair or maintenance service." />
                
                <form onSubmit={handleSubmit} className="pw-card pw-p-6 pw-flex-col pw-gap-4">
                    <Input 
                        label="Product Name" 
                        value={formData.productName} 
                        onChange={(e) => setFormData({...formData, productName: e.target.value})} 
                        required 
                    />
                    
                    <div className="pw-flex-col pw-mb-4">
                        <label className="pw-label">Urgency</label>
                        <select 
                            className="pw-input"
                            value={formData.urgency}
                            onChange={(e) => setFormData({...formData, urgency: e.target.value})}
                        >
                            <option value="low">Low - Routine maintenance</option>
                            <option value="medium">Medium - Functional issues</option>
                            <option value="high">High - Critical failure</option>
                        </select>
                    </div>

                    <Input 
                        label="Describe the issue" 
                        multiline 
                        rows={5} 
                        value={formData.issueDescription} 
                        onChange={(e) => setFormData({...formData, issueDescription: e.target.value})} 
                        required 
                    />

                    <div className="pw-flex pw-justify-end pw-gap-3 pw-mt-4">
                        <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
                        <Button type="submit" loading={loading}>Submit Request</Button>
                    </div>
                </form>
            </div>
        </PageWrapper>
    );
};
