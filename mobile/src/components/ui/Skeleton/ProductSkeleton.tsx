import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBase from './SkeletonBase';
import { spacing, colors, radius } from '../../../theme';

const ProductSkeleton = () => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header / Hero Skeleton */}
            <SkeletonBase height={240} borderRadius={radius.xl} style={styles.hero} />
            
            {/* Title & Meta Skeleton */}
            <View style={styles.meta}>
                <SkeletonBase width="70%" height={32} style={styles.title} />
                <SkeletonBase width="40%" height={16} style={styles.subtitle} />
            </View>

            {/* Quick Actions Skeleton */}
            <View style={styles.actions}>
                <SkeletonBase width="30%" height={48} borderRadius={radius.md} />
                <SkeletonBase width="30%" height={48} borderRadius={radius.md} />
                <SkeletonBase width="30%" height={48} borderRadius={radius.md} />
            </View>

            {/* Description Skeleton */}
            <View style={styles.section}>
                <SkeletonBase width="30%" height={20} style={styles.sectionTitle} />
                <SkeletonBase width="100%" height={16} style={styles.line} />
                <SkeletonBase width="95%" height={16} style={styles.line} />
                <SkeletonBase width="90%" height={16} style={styles.line} />
            </View>

            {/* Grid Skeleton */}
            <View style={styles.section}>
                <SkeletonBase width="30%" height={20} style={styles.sectionTitle} />
                <View style={styles.grid}>
                    <SkeletonBase width="48%" height={120} borderRadius={radius.lg} />
                    <SkeletonBase width="48%" height={120} borderRadius={radius.lg} />
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg },
    hero: { marginBottom: spacing.xl },
    meta: { marginBottom: spacing.xl },
    title: { marginBottom: spacing.sm },
    subtitle: { marginBottom: spacing.md },
    actions: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl },
    section: { marginBottom: spacing.xl },
    sectionTitle: { marginBottom: spacing.md },
    line: { marginBottom: spacing.sm },
    grid: { flexDirection: 'row', justifyContent: 'space-between' },
});

export default ProductSkeleton;
