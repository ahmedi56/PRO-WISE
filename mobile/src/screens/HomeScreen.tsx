import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootState } from '../store';
import { MainTabNavigationProp } from '../navigation/types';

interface Action {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    desc: string;
    screen: 'Home' | 'Shop' | 'Scan' | 'Profile' | null;
}

const QUICK_ACTIONS: Action[] = [
    { icon: 'pricetag-outline', title: 'Browse Products', desc: 'Explore our catalog', screen: 'Shop' },
    { icon: 'construct-outline', title: 'Repair Requests', desc: 'Track your repairs', screen: null },
    { icon: 'pulse-outline', title: 'Activity', desc: 'Your recent activity', screen: null },
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
    const { user } = useSelector((state: RootState) => state.auth);
    
    const role = user?.role || (user as any)?.Role;
    const permissions = (typeof role === 'object' ? role?.permissions : []) || [];
    const roleName = getRoleName(role);
    
    const hasProductsManage = permissions.includes('products.manage') && 
        (['company_admin', 'administrator', 'super_admin'].includes(roleName));
    const hasUsersManage = permissions.includes('users.manage');

    const greeting = () => {
        const h = new Date().getHours();
        if (h < 12) return 'Good Morning';
        if (h < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.hero}>
                <Text style={styles.greeting}>{greeting()}</Text>
                <Text style={styles.username}>{user?.username || 'User'}</Text>
                <Text style={styles.subtitle}>Your product management dashboard</Text>
            </View>

            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.cardsRow}>
                {QUICK_ACTIONS.map((action, i) => (
                    <TouchableOpacity
                        key={i}
                        style={styles.actionCard}
                        onPress={() => action.screen && navigation.navigate(action.screen as any)}
                        activeOpacity={action.screen ? 0.7 : 1}
                    >
                        <Ionicons name={action.icon} size={28} color={colors.primary} style={{ marginBottom: spacing.md }} />
                        <Text style={styles.actionTitle}>{action.title}</Text>
                        <Text style={styles.actionDesc}>{action.desc}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {(hasUsersManage || hasProductsManage) && (
                <View style={styles.adminSection}>
                    <Text style={styles.sectionTitle}>Admin</Text>
                    {hasUsersManage && (
                        <TouchableOpacity
                            style={styles.adminCard}
                            onPress={() => navigation.navigate('Register' as any)}
                        >
                            <Ionicons name="person-add-outline" size={24} color={colors.text} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.adminCardTitle}>Register New User</Text>
                                <Text style={styles.adminCardDesc}>Create accounts for team members</Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}

                    {hasProductsManage && (
                        <TouchableOpacity
                            style={[styles.adminCard, { marginTop: spacing.sm }]}
                            onPress={() => navigation.navigate('ProductForm' as any)}
                        >
                            <Ionicons name="add-circle-outline" size={24} color={colors.text} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.adminCardTitle}>Add New Product</Text>
                                <Text style={styles.adminCardDesc}>Create a new item in catalog</Text>
                            </View>
                            <Ionicons name="chevron-forward-outline" size={24} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: spacing.huge },
    hero: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xl,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    greeting: { fontSize: typography.sm.fontSize, color: colors.primary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
    username: { fontSize: typography.h1.fontSize, fontWeight: typography.h1.fontWeight, color: colors.textStrong, marginBottom: spacing.sm },
    subtitle: { fontSize: typography.body.fontSize, color: colors.textMuted },
    sectionTitle: { fontSize: typography.caption.fontSize, fontWeight: typography.caption.fontWeight, letterSpacing: typography.caption.letterSpacing, textTransform: 'uppercase', color: colors.textMuted, marginBottom: spacing.md },
    cardsRow: { gap: spacing.md, marginBottom: spacing.xxl },
    actionCard: {
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    actionTitle: { fontSize: typography.bodyBold.fontSize, fontWeight: typography.bodyBold.fontWeight, color: colors.textStrong, marginBottom: spacing.xs },
    actionDesc: { fontSize: typography.sm.fontSize, color: colors.textMuted },
    adminSection: { marginTop: spacing.sm },
    adminCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceRaised,
        borderRadius: radius.lg,
        padding: spacing.base,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    adminCardTitle: { fontSize: typography.bodyBold.fontSize, fontWeight: typography.bodyBold.fontWeight, color: colors.textStrong },
    adminCardDesc: { fontSize: typography.sm.fontSize, color: colors.textMuted, marginTop: 2 },
});

export default HomeScreen;
