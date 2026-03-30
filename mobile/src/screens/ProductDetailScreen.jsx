import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { logout } from '../store/slices/authSlice';
import API_URL from '../constants/config';
import { readJson } from '../utils/apiSettings';
import { apiFetch } from '../utils/api';
import { colors, spacing, radius, typography, shadows } from '../theme';
import RecommendationList from '../components/RecommendationList';
import { formatProductName } from '../utils/formatProduct';



const ProductDetailScreen = ({ route, navigation }) => {
    const { id, product } = route.params || {};
    const { token } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const [data, setData] = useState(product || null);
    const [loading, setLoading] = useState(!product);
    const [error, setError] = useState('');

    useEffect(() => {
        if (data?.name) {
            navigation.setOptions({ title: formatProductName(data.name, data.manufacturer) });
        }
    }, [data?.name, data?.manufacturer, navigation]);

    useEffect(() => {
        fetchProduct();
    }, [id, token]);

    const handleUnauthorized = () => dispatch(logout());

    const fetchProduct = async () => {
        try {
            if (!token) {
                setLoading(false);
                return;
            }

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
                    <Ionicons name="cube" size={32} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.title}>{formatProductName(data.name, data.manufacturer)}</Text>
                    <Text style={styles.subtitle}>{[data.manufacturer, data.modelNumber].filter(Boolean).join(' ')}</Text>
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.body}>{data.description || 'No description available.'}</Text>
            </View>

            <View style={styles.row}>
                <View style={[styles.card, { flex: 1, marginRight: spacing.md }]}>
                    <Text style={styles.label}>Category</Text>
                    <Text style={styles.value}>{data.category?.name || 'N/A'}</Text>
                </View>
                <View style={[styles.card, { flex: 1 }]}>
                    <Text style={styles.label}>Company</Text>
                    <Text style={styles.value}>{data.company?.name || 'N/A'}</Text>
                </View>
            </View>

            {components.length > 0 && (
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Technical Components</Text>
                    {components.map((comp, idx) => (
                        <View key={idx} style={styles.componentRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.componentName}>{comp.name}</Text>
                                <Text style={styles.componentType}>{comp.type}</Text>
                            </View>
                            <Text style={styles.componentSpecs}>{comp.specifications}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.card}>
                <Text style={styles.sectionTitle}>Repair Guides & Resources</Text>
                {guides.length > 0 ? (
                    guides.map((guide) => (
                        <TouchableOpacity key={guide.id} style={styles.guideItem}>
                            <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                            <Text style={styles.guideName}>{guide.title}</Text>
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={styles.bodyTextMuted}>No manuals or guides yet available for this model.</Text>
                )}
            </View>

            <RecommendationList productId={data.id} title="Recommended Similar Models" />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg },
    content: { padding: spacing.lg },
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
    iconText: { fontSize: 32, fontWeight: '700', color: colors.primary },
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
    sectionTitle: { fontSize: typography.h4.fontSize, fontWeight: '600', color: colors.textStrong, marginBottom: spacing.sm },
    body: { fontSize: typography.body.fontSize, color: colors.text, lineHeight: 24 },
    bodyTextMuted: { fontSize: typography.body.fontSize, color: colors.textMuted, fontStyle: 'italic' },
    row: { flexDirection: 'row', marginBottom: spacing.lg },
    componentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    componentName: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong },
    componentType: { fontSize: typography.xs.fontSize, color: colors.textMuted, textTransform: 'uppercase' },
    componentSpecs: { fontSize: typography.sm.fontSize, color: colors.text, maxWidth: '50%', textAlign: 'right' },
    guideItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    guideName: {
        fontSize: typography.body.fontSize,
        color: colors.primary,
        marginLeft: spacing.sm,
        fontWeight: '600',
    },
    label: { fontSize: typography.xs.fontSize, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
    value: { fontSize: typography.bodyBold.fontSize, color: colors.textStrong, fontWeight: '600' },
    errorText: { fontSize: typography.body.fontSize, color: colors.error, textAlign: 'center' },
});

export default ProductDetailScreen;
