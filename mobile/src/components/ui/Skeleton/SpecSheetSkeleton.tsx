import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import SkeletonBase from './SkeletonBase';
import { spacing, colors } from '../../../theme';

const SpecSheetSkeleton = () => {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.row}>
                    <SkeletonBase width="40%" height={24} style={styles.cell} />
                    <SkeletonBase width="55%" height={24} style={styles.cell} />
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg },
    row: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: spacing.md,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.05)'
    },
    cell: { opacity: 0.8 }
});

export default SpecSheetSkeleton;
