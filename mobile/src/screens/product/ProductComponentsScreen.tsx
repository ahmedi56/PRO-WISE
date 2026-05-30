import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useProduct } from '../../context/ProductContext';
import { colors, spacing, radius, typography, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import HardwareSkeleton from '../../components/ui/Skeleton/ProductSkeleton';

const ProductComponentsScreen = () => {
    const { product, loading } = useProduct();

    if (loading) return <HardwareSkeleton />;
    if (!product) return null;

    const components = product.components || [];

    const renderComponentItem = ({ item }: { item: any }) => (
        <View style={[styles.componentCard, shadows.sm]}>
            <View style={styles.cardMain}>
                <View style={styles.iconWell}>
                    <Ionicons name="hardware-chip-outline" size={24} color={colors.primary} />
                </View>
                <View style={styles.info}>
                    <Text style={[styles.compName, { color: colors.textStrong }]}>{item.name}</Text>
                    <Text style={[styles.compMeta, { color: colors.textMuted }]}>
                        {item.manufacturer?.toUpperCase() || 'GENERIC'} • {item.type?.toUpperCase() || 'SYSTEM'}
                    </Text>
                </View>
            </View>
            
            {item.modelNumber && (
                <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>MODEL / SN</Text>
                    <Text style={styles.detailValue}>{item.modelNumber}</Text>
                </View>
            )}

            {item.specifications && (
                <View style={styles.specBox}>
                    <Text style={styles.specText}>{item.specifications}</Text>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLine} />
                <Text style={styles.headerTitle}>HARDWARE MANIFEST</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{components.length}</Text>
                </View>
            </View>

            <FlatList
                data={components}
                renderItem={renderComponentItem}
                keyExtractor={(item, index) => item.id || `comp-${index}`}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <View style={{ opacity: 0.2 }}>
                            <Ionicons name="cube-outline" size={64} color={colors.textMuted} />
                        </View>
                        <Text style={[styles.emptyText, { color: colors.textMuted }]}>NO COMPONENTS IDENTIFIED</Text>
                        <Text style={styles.emptySubtext}>This asset manifest does not contain secondary hardware nodes.</Text>
                    </View>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: spacing.lg, 
        paddingBottom: spacing.sm,
        gap: 12 
    },
    headerLine: { width: 4, height: 16, backgroundColor: colors.primary, borderRadius: 2 },
    headerTitle: { fontSize: 11, fontWeight: '900', color: colors.textMuted, letterSpacing: 2 },
    countBadge: { 
        backgroundColor: colors.surfaceContainerHighest, 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: colors.border
    },
    countText: { fontSize: 10, fontWeight: '900', color: colors.primary },
    list: { padding: spacing.lg },
    componentCard: { 
        backgroundColor: colors.surfaceContainer, 
        borderRadius: radius.xl, 
        padding: spacing.lg, 
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
    },
    cardMain: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: 16 },
    iconWell: { 
        width: 52, 
        height: 52, 
        borderRadius: radius.lg, 
        backgroundColor: 'rgba(79, 70, 229, 0.1)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    info: { flex: 1 },
    compName: { fontSize: 16, fontWeight: '800', marginBottom: 2 },
    compMeta: { fontSize: 10, fontWeight: '700', letterSpacing: 1 },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingTop: spacing.md, 
        borderTopWidth: 1, 
        borderTopColor: 'rgba(255, 255, 255, 0.05)' 
    },
    detailLabel: { fontSize: 9, fontWeight: '800', color: colors.textMuted },
    detailValue: { fontSize: 12, fontWeight: '700', color: colors.textStrong },
    specBox: { 
        marginTop: spacing.md, 
        backgroundColor: 'rgba(255, 255, 255, 0.03)', 
        padding: spacing.md, 
        borderRadius: radius.md 
    },
    specText: { fontSize: 12, color: colors.text, fontStyle: 'italic', opacity: 0.8 },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
    emptyText: { marginTop: spacing.lg, fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },
    emptySubtext: { marginTop: spacing.sm, fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 40 }
});

export default ProductComponentsScreen;
