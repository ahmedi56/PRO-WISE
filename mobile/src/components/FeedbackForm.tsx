
import React, { useState } from 'react';
import { 
    Modal, 
    View, 
    Text, 
    StyleSheet, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ActivityIndicator,
    Alert,
    Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';
import { readJson } from '../utils/apiSettings';
import StarRating from './StarRating';
import CustomButton from './CustomButton';

interface FeedbackFormProps {
    visible: boolean;
    onClose: () => void;
    onSubmitSuccess: () => void;
    companyId: string;
    productId?: string;
    token: string;
}

const FeedbackForm: React.FC<FeedbackFormProps> = ({ 
    visible, 
    onClose, 
    onSubmitSuccess,
    companyId,
    productId,
    token
}) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (rating === 0) {
            Alert.alert('Error', 'Please select a star rating.');
            return;
        }
        if (!comment.trim()) {
            Alert.alert('Error', 'Please write a comment.');
            return;
        }

        try {
            setLoading(true);
            const res = await apiFetch(`${API_URL}/feedback`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    company: companyId,
                    product: productId,
                    rating,
                    comment,
                    isAnonymous
                })
            });

            const data = await readJson(res);
            if (res.ok) {
                Alert.alert('Success', 'Thank you for your feedback!');
                setRating(0);
                setComment('');
                setIsAnonymous(false);
                onSubmitSuccess();
            } else {
                Alert.alert('Error', data?.message || 'Failed to submit feedback.');
            }
        } catch (err) {
            Alert.alert('Error', 'Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <View style={styles.overlay}>
                    <KeyboardAvoidingView 
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.modalContainer}
                    >
                        <View style={styles.content}>
                            <View style={styles.header}>
                                <Text style={styles.title}>Share Your Feedback</Text>
                                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={24} color={colors.textMuted} />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.label}>Your Rating</Text>
                            <StarRating 
                                rating={rating} 
                                onRatingPress={setRating} 
                                size={40} 
                                style={styles.ratingStars} 
                            />

                            <Text style={styles.label}>Your Experience</Text>
                            <TextInput
                                style={styles.textArea}
                                multiline
                                numberOfLines={4}
                                value={comment}
                                onChangeText={setComment}
                                placeholder="Write your comments here..."
                                placeholderTextColor={colors.textMuted}
                            />

                            <View style={styles.switchRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.switchLabel}>Submit Anonymously</Text>
                                    <Text style={styles.switchSub}>Your name will be hidden from others.</Text>
                                </View>
                                <Switch
                                    value={isAnonymous}
                                    onValueChange={setIsAnonymous}
                                    trackColor={{ false: colors.border, true: colors.primary }}
                                    thumbColor="#fff"
                                />
                            </View>

                            <CustomButton
                                title="Submit Feedback"
                                onPress={handleSubmit}
                                loading={loading}
                                disabled={loading || rating === 0}
                            />
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        width: '100%',
    },
    content: {
        backgroundColor: colors.bg,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: spacing.xl,
        ...shadows.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: typography.h3.fontSize,
        fontWeight: '700',
        color: colors.textStrong,
    },
    closeButton: {
        padding: 4,
    },
    label: {
        fontSize: typography.smBold.fontSize,
        fontWeight: '600',
        color: colors.textStrong,
        marginBottom: spacing.sm,
    },
    ratingStars: {
        marginBottom: spacing.xl,
        justifyContent: 'center',
    },
    textArea: {
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        padding: spacing.md,
        height: 120,
        textAlignVertical: 'top',
        fontSize: typography.body.fontSize,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.xl,
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.md,
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.md,
    },
    switchLabel: {
        fontSize: typography.bodyBold.fontSize,
        fontWeight: '600',
        color: colors.textStrong,
    },
    switchSub: {
        fontSize: typography.xs.fontSize,
        color: colors.textMuted,
    },
});

export { FeedbackForm };
export default FeedbackForm;
