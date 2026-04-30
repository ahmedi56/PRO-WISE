import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, RefreshControl } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { colors, spacing, radius, typography } from '../theme';
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

const getRoleName = (role: any): string => {
    if (!role) return '';
    if (typeof role === 'string') return role.toLowerCase();
    if (typeof role.name === 'string') return role.name.toLowerCase();
    return '';
};

interface HomeScreenProps {
    navigation: MainTabNavigationProp<'Home'>;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
    const { user, token } = useSelector((state: RootState) => state.auth);
    const [homeData, setHomeData] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

    const role = user?.role || (user as any)?.Role;
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];
    const roleName = getRoleName(role);
    
    const isAdmin = ['company_admin', 'administrator', 'super_admin'].includes(roleName);
    const hasProductsManage = permissions.includes('products.manage') && isAdmin;
    const hasUsersManage = permissions.includes('users.manage');

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
            style={styles.assetCard}
            onPress={() => navigation.navigate('ProductDetail' as any, { id: p.id, product: p })}
            activeOpacity={0.8}
        >
            <View style={styles.cardHeader}>
                <View style={[styles.cardIcon, type === 'suggested' && styles.cardIconWarning]}>
                    <Ionicons 
                        name={type === 'update' ? "cube-outline" : "sparkles-outline"} 
                        size={18} 
                        color={type === 'update' ? colors.primary : colors.warning} 
                    />
                </View>
                <Text style={styles.cardMeta}>{type === 'update' ? 'UPDATED' : 'MATCH'}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>{p.name}</Text>
            <Text style={styles.cardDesc} numberOfLines={2}>{p.description || 'Access technical specifications and guides.'}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.content} 
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            >
                {/* Hero Console Section */}
                <View style={styles.heroWrapper}>
                    <LinearGradient
                        colors={['rgba(165, 200, 255, 0.12)', 'transparent']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.heroInner}>
                        <View>
                            <Text style={styles.greetingText}>{greeting()}</Text>
                            <Text style={styles.usernameText}>{user?.username || 'Operator'}</Text>
                            <View style={styles.systemStatus}>
                                <View style={styles.statusDot} />
                                <Text style={styles.statusText}>System Online • Level 4 Clearance</Text>
                            </View>
                        </View>
                        <View style={styles.heroLogoMount}>
                            <ProWiseLogoSvg width={44} height={44} />
                        </View>
                    </View>
                </View>

                {/* Quick Action Matrix */}
                <Text style={styles.sectionLabel}>Operations Matrix</Text>
                <View style={styles.matrixGrid}>
                    {QUICK_ACTIONS.map((action, i) => (
                        <TouchableOpacity
                            key={i}
                            style={styles.matrixCard}
                            onPress={() => action.screen && navigation.navigate(action.screen as any)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.matrixIconWell}>
                                <Ionicons name={action.icon} size={22} color={colors.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.matrixTitle}>{action.title}</Text>
                                <Text style={styles.matrixDesc}>{action.desc}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Horizontal Asset Streams */}
                {homeData?.latestProducts?.length > 0 && (
                    <View style={styles.streamWrapper}>
                        <Text style={styles.sectionLabel}>Incoming Asset Updates</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streamContent}>
                            {homeData.latestProducts.map((p: any) => renderAssetCard(p, 'update'))}
                        </ScrollView>
                    </View>
                )}

                {homeData?.recommended?.length > 0 && (
                    <View style={styles.streamWrapper}>
                        <Text style={styles.sectionLabel}>Suggested Protocols</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.streamContent}>
                            {homeData.recommended.map((p: any) => renderAssetCard(p, 'suggested'))}
                        </ScrollView>
                    </View>
                )}

                {/* Administration Security Layer */}
                {(hasUsersManage || hasProductsManage) && (
                    <View style={styles.adminBox}>
                        <Text style={styles.sectionLabel}>Command Layer</Text>
                        <View style={styles.adminStack}>
                            {hasUsersManage && (
                                <TouchableOpacity
                                    style={styles.adminRow}
                                    onPress={() => navigation.navigate('Register' as any)}
                                >
                                    <View style={styles.adminIconCircle}>
                                        <Ionicons name="people-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.adminLabel}>Access Management</Text>
                                        <Text style={styles.adminSub}>Operator provisioning</Text>
                                    </View>
                                    <Ionicons name="shield-outline" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}

                            {hasProductsManage && (
                                <TouchableOpacity
                                    style={[styles.adminRow, hasUsersManage && styles.adminRowBorder]}
                                    onPress={() => navigation.navigate('ProductForm' as any)}
                                >
                                    <View style={styles.adminIconCircle}>
                                        <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.adminLabel}>Asset Registration</Text>
                                        <Text style={styles.adminSub}>Catalog synchronization</Text>
                                    </View>
                                    <Ionicons name="layers-outline" size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.xl, paddingBottom: 120 },
    
    // Hero Section
    heroWrapper: {
        marginBottom: spacing.xxl,
        borderRadius: radius.md,
        overflow: 'hidden',
        backgroundColor: colors.surfaceContainerLow,
        borderWidth: 1,
        borderColor: colors.border,
    },
    heroInner: {
        padding: spacing.xl,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    greetingText: {
        ...typography.smBold,
        color: colors.primary,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: spacing.xs,
    },
    usernameText: {
        ...typography.h2,
        color: colors.textStrong,
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    systemStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.success,
        marginRight: spacing.sm,
        shadowColor: colors.success,
        shadowRadius: 4,
        shadowOpacity: 0.5,
    },
    statusText: {
        ...typography.xs,
        color: colors.textMuted,
        fontWeight: '600',
    },
    heroLogoMount: {
        width: 64,
        height: 64,
        borderRadius: radius.md,
        backgroundColor: colors.surfaceContainer,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        ...Platform.select({
            ios: { shadowColor: colors.primaryContainer, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12 },
            android: { elevation: 6 }
        }),
    },

    // Sections
    sectionLabel: {
        ...typography.smBold,
        color: colors.textMuted,
        fontSize: 10,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginBottom: spacing.md,
    },

    // Matrix Grid
    matrixGrid: { gap: spacing.sm, marginBottom: spacing.xl },
    matrixCard: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.md,
        padding: spacing.base,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.base,
    },
    matrixIconWell: {
        width: 44,
        height: 44,
        borderRadius: radius.sm,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    matrixTitle: {
        ...typography.bodyBold,
        color: colors.textStrong,
        fontSize: 15,
        marginBottom: 2,
    },
    matrixDesc: {
        ...typography.xs,
        color: colors.textMuted,
    },

    // Horizontal Streams
    streamWrapper: { marginBottom: spacing.xxl },
    streamContent: { gap: spacing.base, paddingRight: spacing.xl },
    assetCard: {
        width: 200,
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.md,
        padding: spacing.base,
        borderWidth: 1,
        borderColor: colors.border,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    cardIcon: {
        width: 32,
        height: 32,
        borderRadius: radius.sm,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardIconWarning: {
        backgroundColor: colors.warningLight,
    },
    cardMeta: {
        ...typography.xs,
        fontSize: 8,
        fontWeight: '800',
        color: colors.textMuted,
        letterSpacing: 1,
    },
    cardTitle: {
        ...typography.bodyBold,
        color: colors.textStrong,
        fontSize: 14,
        marginBottom: spacing.xs,
    },
    cardDesc: {
        ...typography.xs,
        color: colors.textMuted,
        lineHeight: 16,
    },

    // Admin Layer
    adminBox: { marginTop: spacing.sm },
    adminStack: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
    },
    adminRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.base,
        gap: spacing.base,
    },
    adminRowBorder: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    adminIconCircle: {
        width: 40,
        height: 40,
        borderRadius: radius.sm,
        backgroundColor: colors.primaryLight,
        justifyContent: 'center',
        alignItems: 'center',
    },
    adminLabel: {
        ...typography.bodyBold,
        color: colors.textStrong,
        fontSize: 14,
    },
    adminSub: {
        ...typography.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
});

export default HomeScreen;
