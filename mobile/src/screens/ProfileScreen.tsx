import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { logout } from '../store/slices/authSlice';
import { colors, spacing, radius, typography } from '../theme';
import { RootState, AppDispatch } from '../store';
import { MainTabNavigationProp } from '../navigation/types';
import CustomButton from '../components/CustomButton';

interface ProfileScreenProps {
    navigation: MainTabNavigationProp<'Profile'>;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((state: RootState) => state.auth);

    const handleLogout = () => {
        Alert.alert(
            'System Termination',
            'Are you sure you want to terminate the current session?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Terminate', style: 'destructive', onPress: () => dispatch(logout()) },
            ]
        );
    };

    if (!user) return null;

    const displayName = user.firstName || user.username || 'Operator';
    const initial = displayName[0]?.toUpperCase() || 'O';

    const role = user.role || (user as any).Role;
    const roleName = (typeof role === 'object' ? role?.name : role) || 'Standard Operator';

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Operator Header */}
            <View style={styles.header}>
                <View style={styles.avatarMount}>
                    <LinearGradient
                        colors={[colors.primary, 'transparent']}
                        style={styles.avatarGlow}
                    />
                    <View style={styles.avatarInner}>
                        <Text style={styles.avatarText}>{initial}</Text>
                    </View>
                </View>

                <View style={styles.identityWell}>
                    <Text style={styles.nameText}>{displayName}</Text>
                    <Text style={styles.usernameText}>ID: {user.username || 'operator-721'}</Text>

                    <View style={styles.clearanceBadge}>
                        <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                        <Text style={styles.clearanceText}>{roleName.toUpperCase()}</Text>
                    </View>
                </View>
            </View>

            {/* Account Metadata */}
            <View style={styles.sectionLabelContainer}>
                <Text style={styles.sectionLabel}>System Credentials</Text>
            </View>

            <View style={styles.metaCard}>
                <View style={styles.metaRow}>
                    <View style={styles.metaIconWell}>
                        <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                    </View>
                    <View style={styles.metaInfo}>
                        <Text style={styles.metaKey}>Email Protocol</Text>
                        <Text style={styles.metaVal}>{user.email}</Text>
                    </View>
                </View>

                <View style={[styles.metaRow, styles.metaRowBorder]}>
                    <View style={styles.metaIconWell}>
                        <Ionicons name="pulse-outline" size={18} color={colors.textMuted} />
                    </View>
                    <View style={styles.metaInfo}>
                        <Text style={styles.metaKey}>Clearance Status</Text>
                        <Text style={styles.metaVal}>{user.status || 'Verified Active'}</Text>
                    </View>
                </View>
            </View>

            {/* Command Interface */}
            <View style={styles.sectionLabelContainer}>
                <Text style={styles.sectionLabel}>Operator Commands</Text>
            </View>

            <View style={styles.actionStack}>
                <CustomButton
                    title="Edit Operator Profile"
                    variant="outline"
                    icon={<Ionicons name="construct-outline" size={20} color={colors.primary} />}
                    onPress={() => (navigation as any).navigate('EditProfile')}
                    style={styles.actionBtn}
                />

                <CustomButton
                    title="Security Settings"
                    variant="ghost"
                    icon={<Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} />}
                    onPress={() => { }}
                    style={styles.actionBtn}
                    textStyle={{ color: colors.textMuted }}
                />

                <CustomButton
                    title="Terminate Session"
                    variant="danger"
                    icon={<Ionicons name="power-outline" size={20} color="#ef4444" />}
                    onPress={handleLogout}
                    style={styles.logoutBtn}
                />
            </View>

            <View style={styles.footer}>
                <Text style={styles.versionText}>PRO-WISE v1.2.0 • CORE-NODE-B1</Text>
                <Text style={styles.copyrightText}>© 2026 INTELLIGENCE UNIT</Text>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg, paddingBottom: 110 },

    // Header
    header: { alignItems: 'center', marginTop: spacing.xxl, marginBottom: spacing.xl },
    avatarMount: {
        width: 110,
        height: 110,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarGlow: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.15,
        borderRadius: 55,
    },
    avatarInner: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(165, 200, 255, 0.2)',
        ...Platform.select({
            ios: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 15 },
            android: { elevation: 8 }
        }),
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '800',
        color: colors.primary,
        fontFamily: Platform.OS === 'ios' ? 'Inter-Bold' : 'sans-serif-bold',
    },
    identityWell: { alignItems: 'center' },
    nameText: {
        ...typography.h2,
        color: colors.textStrong,
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    usernameText: {
        ...typography.body,
        color: colors.textMuted,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        fontSize: 13,
        marginTop: 2,
    },
    clearanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(165, 200, 255, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: radius.md,
        marginTop: spacing.md,
        gap: 6,
    },
    clearanceText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.primary,
        letterSpacing: 1,
    },

    // Meta Card
    sectionLabelContainer: { paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
    sectionLabel: {
        ...typography.smBold,
        fontSize: 10,
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    metaCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.06)',
        paddingVertical: spacing.sm,
        marginBottom: spacing.xl,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    metaRowBorder: {
        borderTopWidth: 1,
        borderTopColor: 'rgba(255, 255, 255, 0.05)',
    },
    metaIconWell: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.04)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaInfo: { flex: 1 },
    metaKey: {
        ...typography.xs,
        color: colors.textMuted,
        fontWeight: '700',
        textTransform: 'uppercase',
        fontSize: 9,
        marginBottom: 2,
    },
    metaVal: {
        ...typography.body,
        color: colors.textStrong,
        fontWeight: '600',
    },

    // Actions
    actionStack: { gap: spacing.sm },
    actionBtn: { marginBottom: 2 },
    logoutBtn: { marginTop: spacing.md },

    // Footer
    footer: {
        marginTop: spacing.xxl,
        alignItems: 'center',
        opacity: 0.3,
    },
    versionText: {
        ...typography.xs,
        color: colors.textMuted,
        fontWeight: '700',
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyrightText: {
        ...typography.xs,
        fontSize: 8,
        color: colors.textMuted,
        marginTop: 4,
    },
});

export default ProfileScreen;
