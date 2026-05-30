import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useProduct } from '../../context/ProductContext';
import ProductSkeleton from '../../components/ui/Skeleton/ProductSkeleton';
import { colors, spacing, radius, shadows, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - (spacing.lg * 2);

const ProductGuidesScreen = () => {
    const { product, loading } = useProduct();
    const [activeIndex, setActiveIndex] = useState(0);

    const allSteps = useMemo(() => {
        if (!product?.guides) return [];
        return product.guides.flatMap(guide => 
            (guide.steps || []).map(step => ({
                ...step,
                guideTitle: guide.title
            }))
        );
    }, [product?.guides]);

    if (loading) return <ProductSkeleton />;
    
    if (!product || allSteps.length === 0) {
        return (
            <View style={styles.center}>
                <View style={[styles.emptyWell, { opacity: 0.2 }]}>
                    <Ionicons name="document-text-outline" size={64} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>NO PROTOCOLS REGISTERED</Text>
                <Text style={styles.emptySubtext}>Standard operating procedures are currently being drafted for this asset.</Text>
            </View>
        );
    }

    const renderStepCard = ({ item, index }: { item: any, index: number }) => (
        <View style={[styles.card, shadows.lg]}>
            <View style={styles.cardHeader}>
                <View style={styles.headerTop}>
                    <View style={styles.stepBadge}>
                        <Text style={styles.stepText}>STEP {index + 1}</Text>
                    </View>
                    <View style={styles.guideBadge}>
                        <Text style={styles.guideBadgeText}>{item.guideTitle?.toUpperCase()}</Text>
                    </View>
                </View>
                <Text style={[styles.stepTitle, { color: colors.textStrong }]}>{item.title}</Text>
            </View>
            
            <View style={styles.cardBody}>
                {/* Steps in our DB might have 'media' array or 'mediaUrl' */}
                {item.media && item.media.length > 0 ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.media[0].url }} style={styles.guideImage} resizeMode="cover" />
                        <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.4)']}
                            style={styles.imageOverlay}
                        />
                    </View>
                ) : item.mediaUrl ? (
                    <View style={styles.imageContainer}>
                        <Image source={{ uri: item.mediaUrl }} style={styles.guideImage} resizeMode="cover" />
                    </View>
                ) : (
                    <View style={[styles.placeholderContainer, { opacity: 0.1 }]}>
                        <Ionicons name="construct-outline" size={48} color={colors.textMuted} />
                    </View>
                )}
                <ScrollView style={styles.textWell} showsVerticalScrollIndicator={false}>
                    <Text style={[styles.guideContent, { color: colors.text }]}>
                        {item.content || 'Awaiting technical description for this protocol step.'}
                    </Text>
                    <View style={{ height: 20 }} />
                </ScrollView>
            </View>

            <View style={styles.cardFooter}>
                <View style={styles.footerLine} />
                <Text style={[styles.footerText, { color: colors.textMuted }]}>
                    VERIFIED PROTOCOL • ASSET_{product.id.substring(0, 4)}
                </Text>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <View style={styles.headerIndicator} />
                    <Text style={styles.headerLabel}>TECHNICAL PROTOCOLS</Text>
                </View>
                <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>{activeIndex + 1} OF {allSteps.length}</Text>
                </View>
            </View>

            <FlatList
                data={allSteps}
                renderItem={renderStepCard}
                keyExtractor={(item, index) => item.id || `step-${index}`}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                snapToInterval={CARD_WIDTH + spacing.lg}
                decelerationRate="fast"
                contentContainerStyle={styles.listContent}
                onScroll={(e) => {
                    const index = Math.round(e.nativeEvent.contentOffset.x / (CARD_WIDTH + spacing.lg));
                    if (index !== activeIndex && index >= 0 && index < allSteps.length) setActiveIndex(index);
                }}
            />

            <View style={styles.footer}>
                <View style={styles.progressTrack}>
                    <View 
                        style={[
                            styles.progressBar, 
                            { width: `${((activeIndex + 1) / allSteps.length) * 100}%` }
                        ]} 
                    />
                </View>
                <View style={styles.navInfo}>
                    <Ionicons name="swap-horizontal" size={16} color={colors.primary} />
                    <Text style={styles.navText}>SWIPE TO NAVIGATE STEPS</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
    emptyWell: { 
        width: 120, 
        height: 120, 
        borderRadius: 60, 
        backgroundColor: colors.surfaceContainer, 
        justifyContent: 'center', 
        alignItems: 'center',
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)'
    },
    emptyText: { fontSize: 12, fontWeight: '900', letterSpacing: 2, color: colors.textMuted, marginBottom: spacing.sm },
    emptySubtext: { fontSize: 13, textAlign: 'center', lineHeight: 20, color: colors.textMuted, opacity: 0.6 },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: spacing.lg,
        paddingBottom: spacing.sm
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    headerIndicator: { width: 4, height: 16, backgroundColor: colors.primary, borderRadius: 2 },
    headerLabel: { fontSize: 14, fontWeight: '900', color: colors.textStrong, letterSpacing: 2 },
    counterBadge: { 
        backgroundColor: 'rgba(79, 70, 229, 0.1)', 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)'
    },
    counterText: { fontSize: 10, fontWeight: '900', color: colors.primary },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    card: { 
        width: CARD_WIDTH, 
        backgroundColor: colors.surfaceContainer, 
        borderRadius: radius.xxl,
        marginRight: spacing.lg,
        marginTop: spacing.md,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        height: '92%'
    },
    cardHeader: { padding: spacing.xl, paddingBottom: spacing.md },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    stepBadge: { 
        backgroundColor: colors.primary, 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: radius.xs 
    },
    stepText: { color: '#FFF', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    guideBadge: { 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        paddingHorizontal: 8, 
        paddingVertical: 4, 
        borderRadius: radius.xs 
    },
    guideBadgeText: { color: colors.textMuted, fontSize: 8, fontWeight: '800' },
    stepTitle: { fontSize: 20, fontWeight: '800', lineHeight: 28 },
    cardBody: { flex: 1 },
    imageContainer: { width: '100%', height: 180, position: 'relative' },
    guideImage: { width: '100%', height: '100%' },
    imageOverlay: { ...StyleSheet.absoluteFillObject },
    placeholderContainer: { 
        width: '100%', 
        height: 120, 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    textWell: { padding: spacing.xl },
    guideContent: { fontSize: 16, lineHeight: 26, opacity: 0.85 },
    cardFooter: { padding: spacing.xl, paddingTop: 0 },
    footerLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginBottom: spacing.md },
    footerText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, textAlign: 'center', opacity: 0.5 },
    footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl },
    progressTrack: { height: 2, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 1, marginBottom: spacing.md },
    progressBar: { height: '100%', backgroundColor: colors.primary, borderRadius: 1 },
    navInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: 0.5 },
    navText: { fontSize: 10, fontWeight: '800', color: colors.textMuted, letterSpacing: 1 }
});

export default ProductGuidesScreen;
