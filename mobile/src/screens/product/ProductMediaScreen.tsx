import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, Dimensions, TouchableOpacity } from 'react-native';
import { useProduct } from '../../context/ProductContext';
import ProductSkeleton from '../../components/ui/Skeleton/ProductSkeleton';
import { colors, spacing, radius, shadows } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 2;
const ITEM_SIZE = (width - (spacing.lg * 3)) / COLUMN_COUNT;

const ProductMediaScreen = () => {
    const { product, loading } = useProduct();

    if (loading) return <ProductSkeleton />;
    
    // Combine support videos and PDFs
    const media = [
        ...(product?.supportVideos || []).map(v => ({ ...v, type: 'video' })),
        ...(product?.supportPDFs || []).map(p => ({ ...p, type: 'pdf' }))
    ];

    if (!product || media.length === 0) {
        return (
            <View style={styles.center}>
                <View style={[styles.emptyWell, { opacity: 0.2 }]}>
                    <Ionicons name="images-outline" size={64} color={colors.textMuted} />
                </View>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>NO VISUAL ASSETS</Text>
                <Text style={styles.emptySubtext}>Technical media and documentation are not yet synchronized for this asset.</Text>
            </View>
        );
    }

    const handleOpenMedia = (item: any) => {
        const url = item.videoUrl || item.fileUrl || item.url;
        if (url) {
            WebBrowser.openBrowserAsync(url);
        }
    };

    const renderMediaItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={[styles.mediaCard, shadows.sm]} 
            activeOpacity={0.8}
            onPress={() => handleOpenMedia(item)}
        >
            <View style={styles.cardIconBox}>
                <Ionicons 
                    name={item.type === 'video' ? "play-circle" : "document-text"} 
                    size={32} 
                    color={item.type === 'video' ? colors.primary : colors.accent} 
                />
            </View>
            <View style={styles.cardInfo}>
                <Text style={[styles.mediaTitle, { color: colors.textStrong }]} numberOfLines={1}>{item.title || 'Untitled Asset'}</Text>
                <View style={styles.typeBadge}>
                    <Text style={styles.typeText}>{item.type?.toUpperCase()}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerIndicator} />
                <Text style={styles.headerTitle}>VISUAL ARCHIVE</Text>
                <View style={styles.countBadge}>
                    <Text style={styles.countText}>{media.length}</Text>
                </View>
            </View>

            <FlatList
                data={media}
                renderItem={renderMediaItem}
                keyExtractor={(item, index) => item.id || `media-${index}`}
                numColumns={COLUMN_COUNT}
                contentContainerStyle={styles.listContent}
                columnWrapperStyle={styles.columnWrapper}
                showsVerticalScrollIndicator={false}
            />
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
        marginBottom: spacing.xl
    },
    emptyText: { fontSize: 12, fontWeight: '900', letterSpacing: 2, marginBottom: spacing.sm },
    emptySubtext: { fontSize: 13, textAlign: 'center', opacity: 0.6 },
    header: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        padding: spacing.lg,
        paddingBottom: spacing.sm,
        gap: 12
    },
    headerIndicator: { width: 4, height: 16, backgroundColor: colors.primary, borderRadius: 2 },
    headerTitle: { 
        fontSize: 14, 
        fontWeight: '900', 
        color: colors.textStrong, 
        letterSpacing: 2 
    },
    countBadge: { 
        backgroundColor: 'rgba(79, 70, 229, 0.1)', 
        paddingHorizontal: 8, 
        paddingVertical: 2, 
        borderRadius: radius.xs,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.2)'
    },
    countText: { fontSize: 10, fontWeight: '900', color: colors.primary },
    listContent: { padding: spacing.lg },
    columnWrapper: { justifyContent: 'space-between', marginBottom: spacing.md },
    mediaCard: { 
        width: ITEM_SIZE, 
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.xl, 
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)'
    },
    cardIconBox: { 
        height: 100, 
        backgroundColor: 'rgba(0,0,0,0.2)', 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    cardInfo: { padding: spacing.md },
    mediaTitle: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    typeBadge: { 
        alignSelf: 'flex-start', 
        backgroundColor: 'rgba(255,255,255,0.05)', 
        paddingHorizontal: 6, 
        paddingVertical: 2, 
        borderRadius: 4 
    },
    typeText: { fontSize: 8, fontWeight: '900', color: colors.textMuted, letterSpacing: 1 }
});

export default ProductMediaScreen;
