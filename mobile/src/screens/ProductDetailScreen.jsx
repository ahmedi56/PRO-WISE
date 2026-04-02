import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';
import RecommendationList from '../components/RecommendationList';
import { formatProductName } from '../utils/formatProduct';

const buildComponentSelection = (component, index) => ({
    name: component?.name || '',
    type: component?.type || '',
    manufacturer: component?.manufacturer || '',
    modelNumber: component?.modelNumber || '',
    specifications: component?.specifications || '',
    selectionKey: [
        index,
        component?.name || '',
        component?.type || '',
        component?.manufacturer || '',
        component?.modelNumber || '',
    ].join('|'),
});

const getComponentLabel = (component) => {
    const name = component?.name || component?.modelNumber || component?.type || 'Component';
    const brand = component?.manufacturer;
    return brand && !name.toLowerCase().startsWith(brand.toLowerCase())
        ? `${brand} ${name}`.trim()
        : name;
};

const collectGuideStats = (guides = []) => {
    const steps = guides.reduce((count, guide) => count + (guide.steps?.length || 0), 0);
    const media = guides.reduce(
        (count, guide) => count + (guide.steps || []).reduce((stepCount, step) => stepCount + (step.media?.length || 0), 0),
        0
    );
    return { steps, media };
};

const ProductDetailScreen = ({ route, navigation }) => {
    const { id, product } = route.params || {};
    const dispatch = useDispatch();
    const [data, setData] = useState(product || null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedComponents, setSelectedComponents] = useState([]);

    const handleUnauthorized = () => dispatch(logout());

    useEffect(() => {
        if (data?.name) {
            navigation.setOptions({ title: formatProductName(data.name, data.manufacturer) });
        }
    }, [data?.name, data?.manufacturer, navigation]);

    useEffect(() => {
        setSelectedComponents([]);
    }, [id]);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                setError('');
                const res = await apiFetch(`${API_URL}/products/${id}`, {}, handleUnauthorized);
                const json = await readJson(res);

                if (!res.ok) {
                    throw new Error(json?.message || 'Failed to load product');
                }

                setData(json);
            } catch (err) {
                setError(err.message || 'Failed to load product');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id]);

    const toggleComponentSelection = (component, index) => {
        const nextSelection = buildComponentSelection(component, index);
        setSelectedComponents((previous) => (
            previous.some((entry) => entry.selectionKey === nextSelection.selectionKey)
                ? previous.filter((entry) => entry.selectionKey !== nextSelection.selectionKey)
                : [...previous, nextSelection]
        ));
    };

    const guideStats = useMemo(() => collectGuideStats(data?.guides || []), [data?.guides]);

    if (loading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    if (!data) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Product not found</Text>
            </View>
        );
    }

    const guides = data.guides || [];
    const components = data.components || [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <Ionicons name="cube-outline" size={32} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{formatProductName(data.name, data.manufacturer)}</Text>
                    <Text style={styles.subtitle}>
                        {[data.manufacturer, data.modelNumber].filter(Boolean).join(' - ') || 'General product'}
                    </Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.body}>{data.description || 'No description available.'}</Text>
                {data.content ? <Text style={[styles.body, styles.detailBody]}>{data.content}</Text> : null}
            </View>

            <View style={styles.row}>
                <View style={[styles.card, styles.metaCard]}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{data.category?.name || 'N/A'}</Text>
                </View>
                <View style={[styles.card, styles.metaCard]}>
                    <Text style={styles.label}>Company</Text>
                    <Text style={styles.value}>{data.company?.name || 'N/A'}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Technical Components</Text>
                <Text style={styles.helperText}>
                    Tap one or more components to find finished products built with matching parts.
                </Text>

                {components.length > 0 ? (
                    <View style={styles.componentList}>
                        {components.map((component, index) => {
                            const selection = buildComponentSelection(component, index);
                            const isSelected = selectedComponents.some((entry) => entry.selectionKey === selection.selectionKey);

                            return (
                                <TouchableOpacity
                                    key={selection.selectionKey}
                                    style={[styles.componentCard, isSelected && styles.componentCardSelected]}
                                    onPress={() => toggleComponentSelection(component, index)}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.componentHeader}>
                                        <Text style={styles.componentName}>{component.name || 'Component'}</Text>
                                        {component.type ? (
                                            <View style={styles.componentBadge}>
                                                <Text style={styles.componentBadgeText}>{component.type}</Text>
                                            </View>
                                        ) : null}
                                    </View>
                                    {(component.manufacturer || component.modelNumber) ? (
                                        <Text style={styles.componentMeta}>
                                            {[component.manufacturer, component.modelNumber].filter(Boolean).join(' - ')}
                                        </Text>
                                    ) : null}
                                    {component.specifications ? (
                                        <Text style={styles.componentSpecs}>{component.specifications}</Text>
                                    ) : null}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ) : (
                    <Text style={styles.bodyTextMuted}>No component breakdown available yet.</Text>
                )}

                {selectedComponents.length > 0 ? (
                    <View style={styles.selectionRow}>
                        <View style={styles.selectionWrap}>
                            {selectedComponents.map((component) => (
                                <View key={component.selectionKey} style={styles.selectionChip}>
                                    <Text style={styles.selectionChipText}>{getComponentLabel(component)}</Text>
                                </View>
                            ))}
                        </View>
                        <TouchableOpacity onPress={() => setSelectedComponents([])} style={styles.clearButton}>
                            <Text style={styles.clearButtonText}>Clear</Text>
                        </TouchableOpacity>
                    </View>
                ) : null}
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Repair Guides and Resources</Text>
                {guides.length > 0 ? (
                    <>
                        <Text style={styles.helperText}>{guideStats.steps} steps across {guides.length} guides with {guideStats.media} media items.</Text>
                        {guides.map((guide) => (
                            <View key={guide.id} style={styles.guideItem}>
                                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.guideName}>{guide.title}</Text>
                                    <Text style={styles.guideMeta}>
                                        {[guide.difficulty, guide.estimatedTime, `${guide.steps?.length || 0} steps`].filter(Boolean).join(' - ')}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </>
                ) : (
                    <Text style={styles.bodyTextMuted}>No manuals or guides are attached to this product yet.</Text>
                )}
            </View>

            <RecommendationList
                productId={data.id}
                categoryId={data.category?.id || data.category}
                selectedComponents={selectedComponents}
                title={selectedComponents.length > 0 ? 'Products Matching Selected Components' : 'Recommended Similar Models'}
                onClearSelection={() => setSelectedComponents([])}
            />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.huge },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, backgroundColor: colors.bg },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xl },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: radius.lg,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.lg,
    },
    title: { fontSize: typography.h2.fontSize, fontWeight: '700', color: colors.textStrong },
    subtitle: { fontSize: typography.body.fontSize, color: colors.textMuted },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    metaCard: { flex: 1 },
    row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
    sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '600', color: colors.textStrong, marginBottom: spacing.sm },
    helperText: { fontSize: typography.sm.fontSize, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
    body: { fontSize: typography.body.fontSize, color: colors.text, lineHeight: 24 },
    detailBody: { marginTop: spacing.md, color: colors.textMuted },
    bodyTextMuted: { fontSize: typography.body.fontSize, color: colors.textMuted, fontStyle: 'italic' },
    label: { fontSize: typography.xs.fontSize, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
    value: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, fontWeight: '600' },
    componentList: { gap: spacing.sm },
    componentCard: {
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.md,
    },
    componentCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight,
    },
    componentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: spacing.sm },
    componentName: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, fontWeight: '700', flex: 1 },
    componentBadge: {
        backgroundColor: colors.surface,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    componentBadgeText: { fontSize: typography.xs.fontSize, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },
    componentMeta: { fontSize: typography.sm.fontSize, color: colors.text, marginBottom: 4 },
    componentSpecs: { fontSize: typography.sm.fontSize, color: colors.textMuted, lineHeight: 18 },
    selectionRow: { marginTop: spacing.md, gap: spacing.sm },
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
    clearButton: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6 },
    clearButtonText: { color: colors.primary, fontWeight: '700' },
    guideItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.sm,
    },
    guideName: { fontSize: typography.body.fontSize, color: colors.textStrong, fontWeight: '600' },
    guideMeta: { fontSize: typography.sm.fontSize, color: colors.textMuted, marginTop: 2 },
    errorText: { fontSize: typography.body.fontSize, color: colors.error, textAlign: 'center' },
});

export default ProductDetailScreen;
