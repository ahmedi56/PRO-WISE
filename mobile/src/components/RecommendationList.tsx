import React, { useEffect, useMemo, useState } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator,
    Platform
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import API_URL from '../constants/config';
import { colors, spacing, radius, typography } from '../theme';
import { apiFetch } from '../utils/api';
import { formatProductName } from '../utils/formatProduct';
import { Product, Component } from '../types/product';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

const COMPONENT_FIELDS: (keyof Component)[] = ['name', 'type', 'manufacturer', 'modelNumber', 'specifications'];

const toComponentPayload = (components: any[] = []) => components.map((component) => {
    const payload: any = {};
    COMPONENT_FIELDS.forEach((field) => {
        payload[field] = String(component?.[field] || '').trim();
    });
    return payload;
});

const getComponentLabel = (component: any) => {
    const name = component?.name || component?.modelNumber || component?.type || 'Component';
    const brand = component?.manufacturer;
    return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${name}`.trim()
        : name;
};

const parseRecommendationPayload = (payload: any) => {
    if (Array.isArray(payload)) return { items: payload, meta: null };
    if (payload && Array.isArray(payload.data)) return { items: payload.data, meta: payload.meta || null };
    return { items: [], meta: payload?.meta || null };
};

const getRecommendationWarning = (meta: any) => {
    const embeddingMeta = meta?.embedding;
    if (embeddingMeta?.requested && !embeddingMeta?.available) {
        return 'Semantic index offline. Using secondary matching protocol.';
    }
    return '';
};

interface RecommendationListProps {
    productId: string;
    categoryId?: string;
    selectedComponents?: any[];
    title?: string;
    onClearSelection?: () => void;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

const RecommendationList: React.FC<RecommendationListProps> = ({
    productId,
    categoryId,
    selectedComponents = [],
    title = 'Cross-Referenced Assets',
    onClearSelection,
}) => {
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [serviceWarning, setServiceWarning] = useState('');
    const navigation = useNavigation<NavigationProp>();

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

                    if (!res.ok) throw new Error('Failed to fetch component matches');

                    const json = await res.json();
                    const { items, meta } = parseRecommendationPayload(json);
                    setRecommendations(items);
                    setServiceWarning(getRecommendationWarning(meta));
                    return;
                }

                const res = await apiFetch(`${API_URL}/products/${productId}/recommendations`);
                if (!res.ok) throw new Error('Failed to fetch recommendations');
                const json = await res.json();
                const { items, meta } = parseRecommendationPayload(json);
                setRecommendations(Array.isArray(items) ? items : []);
                setServiceWarning(getRecommendationWarning(meta));
            } catch (error: any) {
                console.error('Failed to fetch mobile recommendations:', error.message);
                setRecommendations([]);
            } finally {
                setLoading(false);
            }
        };

        if (productId) fetchRecommendations();
    }, [categoryId, componentMode, productId, selectedComponents]);

    const splitMatches = useMemo(() => {
        if (recommendations.length === 0) return { exact: [], related: [] };
        const exact: Product[] = [];
        const related: Product[] = [];
        recommendations.forEach(p => {
            const isExact = (p as any).matchType === 'exact_model' || (p as any).matchType === 'exact_component';
            if (isExact) exact.push(p);
            else related.push(p);
        });
        return { exact, related };
    }, [recommendations]);

    if (!loading && recommendations.length === 0 && !componentMode) return null;

    const renderItem = ({ item }: { item: Product }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProductDetail', { id: item.id, product: item })}
            activeOpacity={0.8}
        >
            {Platform.OS === 'ios' && (
                <BlurView tint="dark" intensity={15} style={StyleSheet.absoluteFill} />
            )}
            
            <View style={styles.cardInner}>
                <View style={styles.cardHeader}>
                    <View style={[
                        styles.reasonBadge, 
                        (item as any).matchType?.startsWith('exact') ? { backgroundColor: 'rgba(79, 70, 229, 0.2)' } : null
                    ]}>
                        <Ionicons 
                            name={(item as any).matchType?.startsWith('exact') ? "checkmark-circle" : "flash"} 
                            size={10} 
                            color={(item as any).matchType?.startsWith('exact') ? "#818cf8" : colors.primary} 
                        />
                        <Text style={[
                            styles.reasonText,
                            (item as any).matchType?.startsWith('exact') ? { color: "#818cf8" } : null
                        ]}>
                            {((item as any).matchType || 'similar').replace('_', ' ').toUpperCase()}
                        </Text>
                    </View>
                    {(item as any).confidence ? (
                        <View style={[
                            styles.matchScoreWell,
                            (item as any).confidence === 'high' ? { borderColor: colors.success + '40', borderWidth: 1 } : null
                        ]}>
                            <Text style={[
                                styles.matchScoreText,
                                (item as any).confidence === 'high' ? { color: colors.success } : null
                            ]}>
                                {(item as any).confidence.toUpperCase()}
                            </Text>
                        </View>
                    ) : null}
                </View>

                <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>
                        {formatProductName(item.name, item.manufacturer)}
                    </Text>
                    <Text style={styles.manufacturer} numberOfLines={1}>
                        {item.manufacturer || 'GEN-UNIT'}
                    </Text>
                    {item.recommendationReason && (
                        <Text style={[styles.manufacturer, { color: colors.primary, marginTop: 4, textTransform: 'none' }]} numberOfLines={1}>
                             {item.recommendationReason}
                        </Text>
                    )}
                </View>

                {Array.isArray((item as any).matchedComponents) && (item as any).matchedComponents.length > 0 && (
                    <View style={styles.tagGrid}>
                        {(item as any).matchedComponents.slice(0, 2).map((comp: any, i: number) => (
                            <View key={i} style={styles.miniTag}>
                                <Text style={styles.miniTagText} numberOfLines={1}>{comp.source || comp.matched}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    const renderSection = (items: Product[], sectionTitle: string) => (
        <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionIndicator} />
                <Text style={styles.sectionTitle}>{sectionTitle}</Text>
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
            <View style={styles.mainHeader}>
                <Text style={styles.mainTitle}>{title}</Text>
            </View>

            {serviceWarning ? (
                <View style={styles.alertBanner}>
                    <Ionicons name="shield-outline" size={14} color={colors.warning} />
                    <Text style={styles.alertText}>{serviceWarning}</Text>
                </View>
            ) : null}

            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="small" color={colors.primary} />
                </View>
            ) : componentMode ? (
                <>
                    {splitMatches.exact.length > 0 && renderSection(splitMatches.exact, 'High-Confidence Matches')}
                    {splitMatches.related.length > 0 && renderSection(splitMatches.related, 'Related Discoveries')}
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
    container: {
        marginTop: spacing.xl,
        marginBottom: spacing.lg,
    },
    mainHeader: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    mainTitle: {
        ...typography.h3,
        color: colors.textStrong,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    sectionContainer: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.sm,
    },
    sectionIndicator: {
        width: 3,
        height: 12,
        backgroundColor: colors.primary,
        borderRadius: 2,
        marginRight: 8,
    },
    sectionTitle: {
        ...typography.smBold,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        fontSize: 11,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.md,
        padding: spacing.sm,
        backgroundColor: 'rgba(245, 158, 11, 0.05)',
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: 'rgba(245, 158, 11, 0.15)',
        gap: 8,
    },
    alertText: {
        ...typography.xs,
        color: colors.warning,
        fontWeight: '600',
    },
    listContent: {
        paddingLeft: spacing.lg,
        paddingRight: spacing.sm,
    },
    card: {
        width: 200,
        height: 160,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: radius.lg,
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    cardInner: {
        padding: spacing.md,
        flex: 1,
        justifyContent: 'space-between',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    reasonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(165, 200, 255, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        gap: 4,
    },
    reasonText: {
        fontSize: 9,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 0.5,
    },
    matchScoreWell: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    matchScoreText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
    },
    productInfo: {
        marginTop: spacing.sm,
    },
    productName: {
        ...typography.bodyBold,
        color: colors.textStrong,
        fontSize: 14,
        marginBottom: 2,
    },
    manufacturer: {
        ...typography.xs,
        color: colors.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        fontSize: 9,
    },
    tagGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginTop: 8,
    },
    miniTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)',
    },
    miniTagText: {
        fontSize: 9,
        fontWeight: '600',
        color: colors.textMuted,
    },
    loaderContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
});

export default RecommendationList;
