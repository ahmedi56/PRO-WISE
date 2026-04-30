import React, { useEffect, useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity,
    Alert,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';
import { readJson } from '../utils/apiSettings';
import StarRating from './StarRating';
import { FeedbackForm } from './FeedbackForm';
import CustomButton from './CustomButton';
import { ProWiseLogoSvg } from './ProWiseLogoSvg';

interface FeedbackSectionProps {
    companyId: string;
    productId?: string;
    token: string;
    summaryOnly?: boolean;
    hideTitle?: boolean;
}

interface FeedbackEntry {
    id: string;
    rating: number;
    comment: string;
    response?: string;
    isAnonymous: boolean;
    user: {
        name: string;
        avatar?: string;
    };
    createdAt: string;
}

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ 
    companyId, 
    productId, 
    token,
    summaryOnly = false,
    hideTitle = false
}) => {
    const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
    const [stats, setStats] = useState({ averageRating: 0, totalCount: 0 });
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const query = productId ? `product=${productId}` : `company=${companyId}`;
            const res = await apiFetch(`${API_URL}/feedback?${query}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await readJson(res);
            if (res.ok) {
                setFeedbacks(data.data || []);
            }

            const statsRes = await apiFetch(`${API_URL}/feedback/stats/${companyId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const statsData = await readJson(statsRes);
            if (statsRes.ok) {
                setStats(statsData);
            }
        } catch (err: any) {
            console.error('Failed to fetch feedback:', err);
            Alert.alert('Feedback Error', 'Could not load customer reviews. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [companyId, productId, token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const renderItem = ({ item }: { item: FeedbackEntry }) => (
        <View style={styles.entryCard}>
            <View style={styles.entryHeader}>
                <View style={styles.userInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{item.user.name.charAt(0)}</Text>
                    </View>
                    <View>
                        <Text style={styles.userName}>{item.user.name}</Text>
                        <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                    </View>
                </View>
                <StarRating rating={item.rating} size={14} disabled />
            </View>
            <Text style={styles.comment}>"{item.comment}"</Text>
            
            {item.response ? (
                <View style={styles.adminResponse}>
                    <View style={styles.responseHeader}>
                        <Ionicons name="return-down-forward" size={14} color={colors.primary} />
                        <Text style={styles.responseTitle}>Admin Response</Text>
                    </View>
                    <Text style={styles.responseText}>{item.response}</Text>
                </View>
            ) : null}
        </View>
    );



    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View>
                    {!hideTitle && <Text style={styles.title}>{productId ? 'Product Reviews' : 'Customer Feedback'}</Text>}
                    <View style={styles.statsRow}>
                        <StarRating rating={stats.averageRating} size={16} disabled />
                        {loading && stats.totalCount === 0 ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={styles.statsText}>
                                {stats.averageRating} ({stats.totalCount} {stats.totalCount === 1 ? 'review' : 'reviews'})
                            </Text>
                        )}
                    </View>
                </View>
                <CustomButton 
                    title="Rate Now"
                    size="small"
                    icon={<Ionicons name="create-outline" size={18} color="white" />}
                    onPress={() => setModalVisible(true)}
                    style={{ paddingHorizontal: 16 }}
                />
            </View>

            {!summaryOnly && (
                loading && feedbacks.length === 0 ? (
                    <ActivityIndicator style={{ margin: spacing.xl }} color={colors.primary} />
                ) : (
                    <View style={styles.listContainer}>
                        <Text style={styles.listTitle}>Reviews & Comments</Text>
                        <FlatList
                            data={feedbacks}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id}
                            scrollEnabled={false}
                            ListEmptyComponent={
                                <View style={styles.empty}>
                                    <View style={styles.emptyLogo}>
                                        <ProWiseLogoSvg width={40} height={40} />
                                    </View>
                                    <Text style={styles.emptyText}>No feedback yet. Be the first to rate!</Text>
                                </View>
                            }
                        />
                    </View>
                )
            )}

            <FeedbackForm
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmitSuccess={() => {
                    setModalVisible(false);
                    fetchData();
                }}
                companyId={companyId}
                productId={productId}
                token={token}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: spacing.md,
    },
    listContainer: {
        marginTop: spacing.xl,
        paddingTop: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    listTitle: {
        fontSize: typography.bodyBold.fontSize,
        fontWeight: '700',
        color: colors.textStrong,
        marginBottom: spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: typography.h4.fontSize,
        fontWeight: '700',
        color: colors.textStrong,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: 4,
    },
    statsText: {
        fontSize: typography.sm.fontSize,
        color: colors.textMuted,
        fontWeight: '600',
    },
    entryCard: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    entryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 12,
    },
    userName: {
        fontSize: typography.xs.fontSize,
        fontWeight: '700',
        color: colors.textStrong,
    },
    date: {
        fontSize: 10,
        color: colors.textMuted,
    },
    comment: {
        fontSize: typography.sm.fontSize,
        color: colors.text,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    adminResponse: {
        marginTop: spacing.md,
        padding: spacing.sm,
        backgroundColor: colors.bg,
        borderRadius: radius.sm,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
    },
    responseHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    responseTitle: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.primary,
        textTransform: 'uppercase',
    },
    responseText: {
        fontSize: typography.xs.fontSize,
        color: colors.text,
        lineHeight: 16,
    },
    empty: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyLogo: {
        marginBottom: spacing.md,
        opacity: 0.3,
    },
    emptyText: {
        color: colors.textMuted,
        fontStyle: 'italic',
        fontSize: typography.sm.fontSize,
    },
});

export default FeedbackSection;
