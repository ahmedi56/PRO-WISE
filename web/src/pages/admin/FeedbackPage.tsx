import React, { useEffect, useState } from 'react';
import { PageHeader, Spinner, EmptyState, FeedbackCard } from '../../components/index';
import { feedbackService } from '../../services/feedbackService';
import { useAuth } from '../../hooks/useAuth';
import { swalPrompt, swalError } from '../../utils/swal';

export const FeedbackPage: React.FC = () => {
    const { user } = useAuth();
    const [feedbackList, setFeedbackList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFeedback = async () => {
            try {
                const res = await feedbackService.getAllFeedback(); 
                const rawList = res.data || res || [];
                const uniqueList = rawList.filter(
                    (item: any, index: number, self: any[]) =>
                        self.findIndex((t) => t.id === item.id) === index
                );
                setFeedbackList(uniqueList);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchFeedback();
    }, [user]);

    const handleRespond = async (id: string) => {
        const result = await swalPrompt('Respond to Feedback', 'Enter your response to this feedback:');
        if (result.isConfirmed && result.value) {
            const responseText = result.value;
            feedbackService.respond(id, { response: responseText }).then(() => {
                setFeedbackList(feedbackList.map(f => f.id === id ? { ...f, response: responseText } : f));
            }).catch(err => {
                console.error(err);
                swalError('Error', 'Failed to submit response');
            });
        }
    };

    if (loading) return <div style={{ height: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spinner size="lg" /></div>;

    return (
        <div>
            <PageHeader title="Customer Feedback" subtitle="View and respond to feedback on your products" />

            {feedbackList.length === 0 ? (
                <EmptyState 
                    icon="chatbubbles-outline" 
                    title="No Feedback" 
                    description="You haven't received any feedback on your products yet." 
                />
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {feedbackList.map(fb => (
                        <FeedbackCard 
                            key={fb.id} 
                            feedback={fb} 
                            isAdmin={true} 
                            onRespond={handleRespond} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};
