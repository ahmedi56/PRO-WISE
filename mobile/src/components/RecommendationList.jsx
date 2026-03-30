import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../constants/config';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { apiFetch } from '../utils/api';
import { formatProductName } from '../utils/formatProduct';

const RecommendationList = ({ productId, title = "Recommended for You" }) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigation = useNavigation();

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            try {
                const res = await apiFetch(`${API_URL}/products/${productId}/recommendations`);
                if (!res.ok) {
                    throw new Error('Failed to fetch recommendations');
                }
                const json = await res.json();
                const data = json.data || json;
                setRecommendations(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Failed to fetch mobile recommendations:', error.message);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchRecommendations();
        }
    }, [productId]);

    if (!loading && recommendations.length === 0) return null;

    const renderItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
        >
            <View style={styles.reasonBadge}>
                <Ionicons name="sparkles" size={12} color={colors.primary} />
                <Text style={styles.reasonText}>{item.recommendationReason || 'Similar'}</Text>
            </View>
            <Text style={styles.productName} numberOfLines={1}>{formatProductName(item.name, item.manufacturer)}</Text>
            <Text style={styles.manufacturer}>{item.manufacturer || 'General'}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Shop')}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : (
                <FlatList
                    data={recommendations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: spacing.xl, marginBottom: spacing.lg },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: spacing.md, 
        paddingHorizontal: spacing.lg 
    },
    title: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.textStrong },
    seeAll: { fontSize: typography.body.fontSize, color: colors.primary, fontWeight: '600' },
    listContent: { paddingLeft: spacing.lg, paddingRight: spacing.sm },
    card: {
        width: 220,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    reasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
        marginBottom: spacing.sm,
    },
    reasonText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 4,
        textTransform: 'uppercase',
    },
    productName: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, marginBottom: 2 },
    manufacturer: { fontSize: typography.xs.fontSize, color: colors.textMuted },
});

export default RecommendationList;
