import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { useProduct } from '../../context/ProductContext';
import ProductSkeleton from '../../components/ui/Skeleton/ProductSkeleton';
import { colors, spacing, typography, radius, shadows, glass } from '../../theme';
import CustomButton from '../../components/CustomButton';
import { Ionicons } from '@expo/vector-icons';
import FeedbackSection from '../../components/FeedbackSection';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const ProductOverviewScreen = () => {
    const { product, loading, error } = useProduct();
    const { token } = useSelector((state: RootState) => state.auth);

    if (loading) return <ProductSkeleton />;
    if (error) return (
        <View style={styles.center}>
            <Ionicons name="alert-circle" size={48} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.textStrong }]}>{error}</Text>
        </View>
    );
    if (!product) return null;

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* ── Screen Identification ── */}
            <View style={styles.screenHeader}>
                <Text style={styles.screenTitle}>PRODUCT OVERVIEW</Text>
                <View style={styles.screenBadge}>
                    <Text style={styles.screenBadgeText}>L1_MANIFEST</Text>
                </View>
            </View>

            {/* ── Hero Section ── */}
            <View style={[styles.heroCard, shadows.premium]}>
                <Image 
                    source={{ uri: product.imageUrl || 'https://via.placeholder.com/800' }} 
                    style={styles.heroImage} 
                    resizeMode="cover"
                />
                <LinearGradient
                    colors={['transparent', 'rgba(19, 18, 27, 0.95)']}
                    style={styles.gradientOverlay}
                />
                <View style={styles.heroContent}>
                    <View style={styles.badgeRow}>
                        <View style={styles.statusBadge}>
                            <View style={[styles.statusDot, { backgroundColor: colors.success }]} />
                            <Text style={styles.statusText}>OPERATIONAL</Text>
                        </View>
                        <Text style={styles.categoryLabel}>{(typeof product.category === 'object' ? product.category?.name : null)?.toUpperCase() || 'ASSET'}</Text>
                    </View>
                    <Text style={styles.heroTitle}>{product.name}</Text>
                    <Text style={styles.heroManufacturer}>{product.company?.name || 'GENERIC MANIFEST'}</Text>
                </View>
            </View>

            {/* ── System Metrics ── */}
            <View style={styles.metricsGrid}>
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceContainer }]}>
                    <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                    <View>
                        <Text style={styles.metricLabel}>SYSTEM ID</Text>
                        <Text style={styles.metricValue}>{product.id.substring(0, 8).toUpperCase()}</Text>
                    </View>
                </View>
                <View style={[styles.metricCard, { backgroundColor: colors.surfaceContainer }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color={colors.accent} />
                    <View>
                        <Text style={styles.metricLabel}>TRUST SCORE</Text>
                        <Text style={[styles.metricValue, { color: colors.accent }]}>98.4%</Text>
                    </View>
                </View>
            </View>

            {/* ── Technical Abstract ── */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionIconWell}>
                        <Ionicons name="document-text-outline" size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>TECHNICAL MANIFEST</Text>
                </View>
                <View style={styles.contentWell}>
                    <Text style={styles.sectionContent}>
                        {product.content || 'No detailed technical content has been synchronized for this asset manifest yet.'}
                    </Text>
                </View>
                <View style={[styles.glassCard, { borderColor: colors.border, marginTop: spacing.md }]}>
                    <Text style={styles.description}>
                        {product.description || 'This asset is currently under systematic review. No detailed abstract is available at this interval.'}
                    </Text>
                </View>
            </View>

            {/* ── Feedback & Intel ── */}
            <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionIconWell}>
                        <Ionicons name="chatbubble-ellipses-outline" size={18} color={colors.primary} />
                    </View>
                    <Text style={styles.sectionTitle}>FIELD INTELLIGENCE</Text>
                </View>
                <FeedbackSection 
                    productId={product.id}
                    companyId={product.company?.id || product.company}
                    token={token}
                />
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

// Styles Definition

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
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    errorText: { marginTop: spacing.md, textAlign: 'center', ...typography.body },
    heroCard: { 
        height: 320, // Slightly taller
        borderRadius: radius.xxl, 
        overflow: 'hidden', 
        marginBottom: spacing.xl,
        backgroundColor: colors.surface,
        position: 'relative'
    },
    heroImage: { width: '100%', height: '100%' },
    gradientOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '70%', // More coverage
    },
    heroContent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: spacing.xl
    },
    badgeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: 12 },
    statusBadge: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'rgba(16, 185, 129, 0.15)', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)'
    },
    statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
    statusText: { fontSize: 9, fontWeight: '900', color: colors.success, letterSpacing: 1 },
    categoryLabel: { fontSize: 10, fontWeight: '900', color: colors.textMuted, letterSpacing: 1.5 },
    heroTitle: { 
        fontSize: 32, 
        fontWeight: '900', 
        color: '#FFFFFF', 
        letterSpacing: -0.5, 
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4
    },
    heroManufacturer: { 
        fontSize: 14, 
        fontWeight: '600', 
        color: colors.primary, 
        letterSpacing: 1, 
        opacity: 1,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2
    },
    metricsGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    metricCard: { 
        flex: 1, 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: spacing.md, 
        borderRadius: radius.lg, 
        gap: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)'
    },
    metricLabel: { fontSize: 10, fontWeight: '800', color: colors.textMuted, marginBottom: 2 },
    metricValue: { fontSize: 15, fontWeight: '900', color: colors.textStrong },
    section: { marginTop: spacing.xl, paddingHorizontal: spacing.lg },
    sectionHeaderRow: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        gap: spacing.sm, 
        marginBottom: spacing.md 
    },
    sectionIconWell: {
        width: 28,
        height: 28,
        borderRadius: 8,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: { fontSize: 11, fontWeight: '900', color: colors.primary, letterSpacing: 1.5 },
    contentWell: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        padding: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sectionContent: { fontSize: 14, lineHeight: 22, color: colors.text, opacity: 0.8 },
    glassCard: { 
        padding: spacing.lg, 
        borderRadius: radius.xl, 
        backgroundColor: colors.surfaceContainer,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    description: { fontSize: 16, lineHeight: 26, color: colors.text, opacity: 0.85 }
});

export default ProductOverviewScreen;
