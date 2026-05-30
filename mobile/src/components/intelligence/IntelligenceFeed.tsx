import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Animated, { FadeInRight, Layout } from 'react-native-reanimated';
import { colors, spacing, radius, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

interface IntelligenceFeedProps {
    data: any[];
    onItemPress: (item: any) => void;
}

const IntelligenceFeed: React.FC<IntelligenceFeedProps> = ({ data, onItemPress }) => {
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Ionicons name="pulse" size={18} color={colors.primary} />
                <Text style={[styles.headerTitle, { color: colors.textStrong }]}>TACTICAL RECOMMENDATIONS</Text>
            </View>
            
            <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.scrollContent}
            >
                {data.map((item, index) => (
                    <Animated.View 
                        key={item.id}
                        entering={FadeInRight.delay(index * 100).duration(500)}
                        layout={Layout.springify()}
                    >
                        <TouchableOpacity 
                            style={[styles.card, shadows.premium]} 
                            onPress={() => onItemPress(item)}
                            activeOpacity={0.9}
                        >
                            <Image source={{ uri: item.imageUrl }} style={styles.image} />
                            <View style={styles.overlay}>
                                <Text style={styles.category}>{item.category?.name?.toUpperCase() || 'GENERIC'}</Text>
                                <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                                <View style={styles.intelRow}>
                                    <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                                    <Text style={styles.intelText}>SYSTEM VERIFIED</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginVertical: spacing.lg },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: spacing.lg, 
        marginBottom: spacing.md,
        gap: 8
    },
    headerTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
    scrollContent: { paddingLeft: spacing.lg, paddingRight: spacing.sm },
    card: { 
        width: 180, 
        height: 240, 
        borderRadius: radius.lg, 
        marginRight: spacing.md, 
        backgroundColor: colors.surface,
        overflow: 'hidden'
    },
    image: { width: '100%', height: '100%' },
    overlay: { 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        padding: spacing.md,
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    category: { color: colors.primary, fontSize: 8, fontWeight: '900', letterSpacing: 1, marginBottom: 4 },
    name: { color: '#FFF', fontSize: 14, fontWeight: '800', marginBottom: 6 },
    intelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    intelText: { color: 'rgba(255,255,255,0.7)', fontSize: 8, fontWeight: '700', letterSpacing: 0.5 }
});

export default IntelligenceFeed;
