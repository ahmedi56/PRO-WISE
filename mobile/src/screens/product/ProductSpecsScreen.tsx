import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useProduct } from '../../context/ProductContext';
import SpecSheetSkeleton from '../../components/ui/Skeleton/SpecSheetSkeleton';
import { colors, spacing, radius, shadows, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

const ProductSpecsScreen = () => {
    const { product, loading } = useProduct();

    if (loading) return <SpecSheetSkeleton />;
    if (!product) return null;

    const specs = [
        { label: 'ASSET NAME', value: product.name },
        { label: 'MANUFACTURER', value: product.company?.name || 'GENERIC MANIFEST' },
        { label: 'CLASSIFICATION', value: (typeof product.category === 'object' ? product.category?.name : null) || 'UNSPECIFIED' },
        { label: 'MODEL NUMBER', value: product.modelNumber || 'N/A' },
        { label: 'SERIAL ID', value: product.id.toUpperCase() },
        { label: 'STATUS', value: 'ACTIVE / VERIFIED', color: colors.success },
        { label: 'REGISTRY', value: 'PRO-WISE GLOBAL', color: colors.primary },
    ];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.container}>
            {/* ── Screen Identification ── */}
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>TECHNICAL SPECIFICATIONS</Text>
                <View style={styles.screenBadge}>
                    <Text style={styles.screenBadgeText}>L2_DATA</Text>
                </View>
            </View>
            </View>

            <View style={styles.header}>
                <View style={styles.headerIndicator} />
                <Text style={styles.headerTitle}>TECHNICAL SPECIFICATIONS</Text>
            </View>

            <View style={[styles.sheet, shadows.sm]}>
                {specs.map((spec, index) => (
                    <View key={index} style={[
                        styles.row, 
                        index === specs.length - 1 && { borderBottomWidth: 0 }
                    ]}>
                        <View style={styles.labelGroup}>
                            <View style={[styles.dot, { backgroundColor: spec.color || colors.textMuted }]} />
                            <Text style={[styles.label, { color: colors.textMuted }]}>{spec.label}</Text>
                        </View>
                        <Text 
                            style={[
                                styles.value, 
                                { color: spec.color || colors.textStrong }
                            ]}
                        >
                            {spec.value}
                        </Text>
                    </View>
                ))}
            </View>

            <View style={styles.disclaimerWell}>
                <View style={styles.disclaimerIcon}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
                </View>
                <View style={styles.disclaimerTextGroup}>
                    <Text style={styles.disclaimerTitle}>SYNCHRONIZED DATA</Text>
                    <Text style={styles.disclaimerBody}>
                        This information is retrieved directly from the verified manufacturer manifest. 
                        Tampering or unauthorized modification is strictly logged.
                    </Text>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    screenHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.sm,
    },
    screenTitle: {
        fontSize: 14,
        fontWeight: '900',
        color: colors.textStrong,
        letterSpacing: 2,
    },
    screenBadge: {
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)',
    },
    screenBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        color: colors.primary,
    },
    content: { paddingBottom: spacing.xl },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        marginBottom: spacing.xl, 
        gap: 12 
    },
    headerIndicator: { width: 4, height: 16, backgroundColor: colors.primary, borderRadius: 2 },
    headerTitle: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 2 },
    sheet: { 
        backgroundColor: colors.surfaceContainer, 
        borderRadius: radius.xl,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
    },
    row: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.03)'
    },
    labelGroup: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
    dot: { width: 4, height: 4, borderRadius: 2, opacity: 0.5 },
    label: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
    value: { fontSize: 14, fontWeight: '800', flex: 2, textAlign: 'right' },
    disclaimerWell: { 
        flexDirection: 'row', 
        marginTop: spacing.xxl, 
        backgroundColor: 'rgba(79, 70, 229, 0.05)',
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.1)',
        gap: 16
    },
    disclaimerIcon: { 
        width: 40, 
        height: 40, 
        borderRadius: 20, 
        backgroundColor: 'rgba(79, 70, 229, 0.1)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    disclaimerTextGroup: { flex: 1 },
    disclaimerTitle: { fontSize: 10, fontWeight: '900', color: colors.primary, letterSpacing: 1, marginBottom: 4 },
    disclaimerBody: { fontSize: 12, lineHeight: 18, color: colors.text, opacity: 0.6 }
});

export default ProductSpecsScreen;
