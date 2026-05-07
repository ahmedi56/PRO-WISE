import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { useTheme } from '../theme';

import { RootState } from '../store';
import { MainTabNavigationProp } from '../navigation/types';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';
import API_URL from '../constants/config';
import { apiFetch } from '../utils/api';
import { readJson } from '../utils/apiSettings';

interface Action {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    desc: string;
    screen: 'Home' | 'Shop' | 'Scan' | 'Profile' | null;
}

const QUICK_ACTIONS: Action[] = [
    { icon: 'layers-outline', title: 'Asset Registry', desc: 'Explore hardware catalog', screen: 'Shop' },
    { icon: 'qr-code-outline', title: 'Optical Scan', desc: 'Initialize hardware ID', screen: 'Scan' },
    { icon: 'shield-checkmark-outline', title: 'Security Auth', desc: 'System integrity check', screen: null },
];

interface HomeScreenProps {
    navigation: MainTabNavigationProp<'Home'>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const theme = useTheme();
    const { colors, typography, spacing, radius, shadows } = theme;
    const [homeData, setHomeData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchHomeData = async () => {
        try {
            const res = await apiFetch(`${API_URL}/homepage`, {}, undefined);
            const json = await readJson(res);
            if (res.ok) setHomeData(json);
        } catch (err) {
            console.error("Home data fetch error", err);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHomeData();
    }, [token]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchHomeData();
    };

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Morning Shift';
        if (h < 18) return 'Day Ops';
        return 'Late Watch';
    };

    const renderAssetCard = (p: any, type: 'update' | 'suggested') => (
        <TouchableOpacity 
            key={p.id} 
            style={[styles.assetCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ProductDetail' as any, { id: p.id, product: p })}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, { backgroundColor: type === 'update' ? colors.primaryLight : `${colors.warning}1A` }]}>
                    <Ionicons 
                        name={type === 'update' ? "cube-outline" : "sparkles-outline"} 
                        size={18} 
                        color={type === 'update' ? colors.primary : colors.warning} 
                    />
                </View>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{type === 'update' ? 'UPDATED' : 'MATCH'}</Text>
            </View>
            <Text style={[styles.cardTitle, { color: colors.textStrong }]} numberOfLines={1}>{p.name}</Text>
            <Text style={[styles.cardDesc, { color: colors.text }]} numberOfLines={2}>{p.description || 'Access technical specifications and guides.'}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.bg }]}>
            <ScrollView 
                contentContainerStyle={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Immersive Hero Section */}
                <View style={[styles.heroWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <LinearGradient
                        colors={[`${colors.primary}1A`, 'transparent']}
                        style={StyleSheet.flatten(StyleSheet.absoluteFill)}
                    />
                    <View style={styles.heroInner}>
                        <View style={{ flex: 1 }}>
                            <View style={styles.greetingRow}>
                                <View style={[styles.statusPulse, { backgroundColor: colors.success, shadowColor: colors.success }]} />
                                <Text style={[styles.greetingText, { color: colors.success }]}>{greeting()}</Text>
                            </View>
                            <Text style={[styles.usernameText, { color: colors.textStrong }]}>{user?.username || 'Operator'}</Text>
                            <Text style={[styles.clearanceText, { color: colors.textMuted }]}>System Clearance • Level 4</Text>
                        </View>
                        <TouchableOpacity style={[styles.heroLogoMount, { backgroundColor: colors.surfaceContainer, borderColor: colors.border, ...shadows.md }]} activeOpacity={0.8}>
                            <ProWiseLogoSvg width={48} height={48} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Bento Matrix Grid */}
                <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Tactical Matrix</Text>
                <View style={styles.bentoGrid}>
                    {/* Primary Large Card */}
                    <TouchableOpacity 
                        style={[styles.bentoCard, styles.bentoCardLarge, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('Shop' as any)}
                    >
                        <LinearGradient
                            colors={[`${colors.primary}1A`, 'transparent']}
                            style={StyleSheet.absoluteFill}
                        />
                        <View style={[styles.bentoIconWell, { backgroundColor: colors.primaryLight }]}>
                            <Ionicons name="layers" size={28} color={colors.primary} />
                        </View>
                        <Text style={[styles.bentoTitle, { color: colors.textStrong }]}>Asset Registry</Text>
                        <Text style={[styles.bentoDesc, { color: colors.textMuted }]}>Global hardware catalog</Text>
                        <View style={[styles.bentoBadge, { backgroundColor: `${colors.error}1A` }]}>
                            <Text style={[styles.bentoBadgeText, { color: colors.error }]}>LIVE</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.bentoColumn}>
                        {/* Secondary Small Card 1 */}
                        <TouchableOpacity 
                            style={[styles.bentoCardSmall, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                            activeOpacity={0.8}
                            onPress={() => navigation.navigate('Scan' as any)}
                        >
                            <View style={[styles.bentoIconWell, { backgroundColor: `${colors.accent}1A` }]}>
                                <Ionicons name="qr-code" size={20} color={colors.accent} />
                            </View>
                            <Text style={[styles.bentoTitleSmall, { color: colors.textStrong }]}>Optical Scan</Text>
                        </TouchableOpacity>

                        {/* Secondary Small Card 2 */}
                        <TouchableOpacity 
                            style={[styles.bentoCardSmall, { backgroundColor: colors.surface, borderColor: colors.border }]} 
                            activeOpacity={0.8}
                        >
                            <View style={[styles.bentoIconWell, { backgroundColor: `${colors.success}1A` }]}>
                                <Ionicons name="shield-checkmark" size={20} color={colors.success} />
                            </View>
                            <Text style={[styles.bentoTitleSmall, { color: colors.textStrong }]}>Security Auth</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Stream Sections */}
                {homeData?.latestProducts?.length > 0 && (
                    <View style={styles.streamWrapper}>
                        <View style={styles.streamHeader}>
                            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Latest Inbound Assets</Text>
                            <TouchableOpacity><Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text></TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streamContent}>
                            {homeData.latestProducts.map((p: any) => renderAssetCard(p, 'update'))}
                        </ScrollView>
                    </View>
                )}

                {homeData?.recommended?.length > 0 && (
                    <View style={styles.streamWrapper}>
                        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>Tactical Recommendations</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streamContent}>
                            {homeData.recommended.map((p: any) => renderAssetCard(p, 'suggested'))}
                        </ScrollView>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 120 },
    
    // Hero Section
    heroWrapper: {
        marginBottom: 32,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
    },
    heroInner: {
        padding: 32,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greetingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
    statusPulse: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
        shadowRadius: 6,
        shadowOpacity: 0.6,
    },
    greetingText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 2,
        textTransform: 'uppercase',
    },
    usernameText: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 2,
    },
    clearanceText: {
        fontSize: 12,
        fontWeight: '600',
    },
    heroLogoMount: {
        width: 72,
        height: 72,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },

    // Bento Grid
    sectionLabel: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    bentoGrid: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    bentoCard: {
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        overflow: 'hidden',
    },
    bentoCardLarge: {
        flex: 1.2,
        minHeight: 180,
        justifyContent: 'flex-end',
    },
    bentoColumn: {
        flex: 1,
        gap: 16,
    },
    bentoCardSmall: {
        flex: 1,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    bentoIconWell: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    bentoTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    bentoTitleSmall: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    bentoDesc: {
        fontSize: 12,
        fontWeight: '500',
    },
    bentoBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    bentoBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        letterSpacing: 1,
    },

    // Horizontal Streams
    streamWrapper: { marginBottom: 32 },
    streamHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    viewAllText: { fontSize: 12, fontWeight: '700' },
    streamContent: { gap: 16, paddingRight: 32 },
    assetCard: {
        width: 220,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardMeta: {
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 1.2,
        textTransform: 'uppercase',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 14,
        fontWeight: '400',
        lineHeight: 20,
    },
});

export default HomeScreen;

