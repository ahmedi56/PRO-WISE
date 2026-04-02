import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import API_URL from '../constants/config';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { apiFetch } from '../utils/api';
import { formatProductName } from '../utils/formatProduct';

const COMPONENT_FIELDS = ['name', 'type', 'manufacturer', 'modelNumber', 'specifications'];

const toComponentPayload = (components = []) => components.map((component) => {
    const payload = {};
    COMPONENT_FIELDS.forEach((field) => {
        payload[field] = String(component?.[field] || '').trim();
    });
    return payload;
});

const getComponentLabel = (component) => {
    const name = component?.name || component?.modelNumber || component?.type || 'Component';
    const brand = component?.manufacturer;
    return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${name}`.trim()
        : name;
};

const parseRecommendationPayload = (payload) => {
    if (Array.isArray(payload)) {
        return { items: payload, meta: null };
    }

    if (payload && Array.isArray(payload.data)) {
        return { items: payload.data, meta: payload.meta || null };
    }

    return { items: [], meta: payload?.meta || null };
};

const getRecommendationWarning = (meta) => {
    const embeddingMeta = meta?.embedding;
    if (embeddingMeta?.requested && !embeddingMeta?.available) {
        return 'Semantic matching is temporarily limited. Showing fallback matches.';
    }
    return '';
};

const RecommendationList = ({
    productId,
    categoryId,
    selectedComponents = [],
    title = 'Recommended for You',
    onClearSelection,
}) => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [serviceWarning, setServiceWarning] = useState('');
    const navigation = useNavigation();

    const componentMode = selectedComponents.length > 0;
    const selectedLabels = useMemo(
        () => selectedComponents.map((component) => getComponentLabel(component)),
        [selectedComponents]
    );

    useEffect(() => {
        const fetchRecommendations = async () => {
            setLoading(true);
            setServiceWarning('');
            try {
                if (componentMode) {
                    const res = await apiFetch(`${API_URL}/products/recommend/by-components`, {
                        method: 'POST',
                        body: JSON.stringify({
                            components: toComponentPayload(selectedComponents),
                            currentProductId: productId,
                            categoryId,
                            limit: 6,
                        }),
                    });

                    if (!res.ok) {
                        throw new Error('Failed to fetch component matches');
                    }

                    const json = await res.json();
                    const { items, meta } = parseRecommendationPayload(json);
                    setRecommendations(items);
                    setServiceWarning(getRecommendationWarning(meta));
                    return;
                }

                const res = await apiFetch(`${API_URL}/products/${productId}/recommendations`);
                if (!res.ok) {
                    throw new Error('Failed to fetch recommendations');
                }
                const json = await res.json();
                const { items, meta } = parseRecommendationPayload(json);
                setRecommendations(Array.isArray(items) ? items : []);
                setServiceWarning(getRecommendationWarning(meta));
            } catch (error) {
                console.error('Failed to fetch mobile recommendations:', error.message);
                setRecommendations([]);
                setServiceWarning('');
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            fetchRecommendations();
        }
    }, [categoryId, componentMode, productId, selectedComponents]);

    if (!loading && recommendations.length === 0 && !componentMode) {
        return null;
    }

    const splitMatches = useMemo(() => {
        if (!componentMode || recommendations.length === 0) return { exact: [], brand: [] };
        
        const exact = [];
        const brand = [];
        
        recommendations.forEach(p => {
            const hasExact = Array.isArray(p.matchedComponents) && p.matchedComponents.some(m => m.score >= 180);
            if (hasExact) exact.push(p);
            else brand.push(p);
        });
        
        return { exact, brand };
    }, [componentMode, recommendations]);

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id })}
            activeOpacity={0.85}
        >
            <View style={styles.reasonRow}>
                <View style={styles.reasonBadge}>
                    <Ionicons name="sparkles" size={12} color={colors.primary} />
                    <Text style={styles.reasonText}>{item.recommendationReason || 'Similar'}</Text>
                </View>
                {item.matchScore || item.score ? (
                    <Text style={styles.scoreText}>{Math.round((item.matchScore || item.score) * 100)}%</Text>
                ) : null}
            </View>
            <Text style={styles.productName} numberOfLines={2}>
                {formatProductName(item.name, item.manufacturer)}
            </Text>
            <Text style={styles.manufacturer} numberOfLines={1}>
                {[item.manufacturer, item.modelNumber].filter(Boolean).join(' - ') || 'General product'}
            </Text>
            <Text style={styles.description} numberOfLines={3}>
                {item.description || 'View technical details'}
            </Text>
        </TouchableOpacity>
    );

    const renderSection = (items, sectionTitle, isMuted = false) => (
        <View style={{ marginBottom: spacing.lg }}>
            <View style={[styles.sectionHeader, isMuted && { borderLeftColor: colors.textMuted }]}>
                <Text style={[styles.sectionHeaderText, isMuted && { color: colors.textMuted }]}>{sectionTitle}</Text>
            </View>
            <FlatList
                data={items}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Main', { screen: 'Shop' })}>
                    <Text style={styles.seeAll}>See All</Text>
                </TouchableOpacity>
            </View>

            {serviceWarning ? (
                <View style={styles.warningBanner}>
                    <Text style={styles.warningText}>{serviceWarning}</Text>
                </View>
            ) : null}

            {componentMode ? (
                <View style={styles.selectionArea}>
                    <View style={styles.selectionWrap}>
                        {selectedLabels.map((label, index) => (
                            <View key={`${label}-${index}`} style={styles.selectionChip}>
                                <Text style={styles.selectionChipText}>{label}</Text>
                            </View>
                        ))}
                    </View>
                    {onClearSelection ? (
                        <TouchableOpacity onPress={onClearSelection} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ) : null}

            {loading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: spacing.md }} />
            ) : recommendations.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                        {componentMode ? "No component matches found" : "No recommendations yet"}
                    </Text>
                    <Text style={styles.emptyText}>
                        {componentMode 
                            ? "No published products in the catalog share these exact components. Try selecting fewer or different parts."
                            : "As you explore more products, we'll suggest alternatives here."}
                    </Text>
                </View>
            ) : componentMode ? (
                <>
                    {splitMatches.exact.length > 0 && 
                        renderSection(splitMatches.exact, 'Exact Model Matches')
                    }
                    {splitMatches.brand.length > 0 && 
                        renderSection(
                            splitMatches.brand, 
                            `Other ${selectedComponents[0]?.manufacturer || 'Same Brand'} Products`,
                            true
                        )
                    }
                </>
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
        paddingHorizontal: spacing.lg,
    },
    title: { fontSize: typography.h3.fontSize, fontWeight: '700', color: colors.textStrong, flex: 1, paddingRight: spacing.md },
    seeAll: { fontSize: typography.body.fontSize, color: colors.primary, fontWeight: '600' },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        paddingLeft: spacing.md - 4,
    },
    sectionHeaderText: {
        fontSize: typography.sm.fontSize,
        fontWeight: '700',
        color: colors.textStrong,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    selectionArea: { paddingHorizontal: spacing.lg, marginBottom: spacing.md, gap: spacing.sm },
    selectionWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    selectionChip: {
        backgroundColor: colors.primaryLight,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: colors.primary,
        paddingHorizontal: 10,
        paddingVertical: 6,
    },
    selectionChipText: { color: colors.primary, fontSize: typography.xs.fontSize, fontWeight: '700' },
    clearButton: { alignSelf: 'flex-start' },
    clearButtonText: { color: colors.primary, fontWeight: '700' },
    listContent: { paddingLeft: spacing.lg, paddingRight: spacing.sm },
    card: {
        width: 240,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    reasonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    reasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: radius.sm,
        alignSelf: 'flex-start',
    },
    reasonText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 4,
        textTransform: 'uppercase',
        flexShrink: 1,
    },
    scoreText: { fontSize: typography.xs.fontSize, color: colors.textMuted, fontWeight: '700' },
    productName: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, marginBottom: 4 },
    manufacturer: { fontSize: typography.xs.fontSize, color: colors.textMuted, marginBottom: spacing.sm },
    description: { fontSize: typography.sm.fontSize, color: colors.text, lineHeight: 18 },
    emptyState: {
        marginHorizontal: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    emptyTitle: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, fontWeight: '700', marginBottom: 4 },
    emptyText: { fontSize: typography.sm.fontSize, color: colors.textMuted, lineHeight: 18 },
    warningBanner: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: '#F59E0B',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    warningText: {
        fontSize: typography.sm.fontSize,
        color: '#92400E',
        lineHeight: 18,
    },
});

export default RecommendationList;
