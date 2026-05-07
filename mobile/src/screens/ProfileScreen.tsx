import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Platform } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { LinearGradient } from 'expo-linear-gradient';

import { logout } from '../store/slices/authSlice';
import { colors, spacing, radius, typography, shadows } from '../theme';

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

    const techStatus = user.technicianStatus || 'none';
    const isApprovedTech = user.isTechnician && techStatus === 'approved';

    const getTechStatusBadge = () => {
        if (techStatus === 'pending') {
            return (
                <View style={[styles.clearanceBadge, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                    <Ionicons name="time-outline" size={12} color="#f59e0b" />
                    <Text style={[styles.clearanceText, { color: '#f59e0b' }]}>TECH PENDING</Text>
                </View>
            );
        }
        if (isApprovedTech) {
            return (
                <View style={[styles.clearanceBadge, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)' }]}>
                    <Ionicons name="construct" size={12} color={colors.primary} />
                    <Text style={[styles.clearanceText, { color: colors.primary }]}>CERTIFIED TECH</Text>
                </View>
            );
        }
        if (techStatus === 'rejected') {
            return (
                <View style={[styles.clearanceBadge, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                    <Ionicons name="close-circle-outline" size={12} color={colors.error} />
                    <Text style={[styles.clearanceText, { color: colors.error }]}>TECH REJECTED</Text>
                </View>
            );
        }
        return null;
    };

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
                    <View style={styles.statusBadge}>
                        <View style={styles.statusDot} />
                    </View>
                </View>

                <View style={styles.identityWell}>
                    <Text style={styles.nameText}>{displayName}</Text>
                    <Text style={styles.usernameText}>ID: {user.username || 'operator-721'}</Text>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: spacing.md }}>
                        <View style={styles.clearanceBadge}>
                            <Ionicons name="shield-checkmark" size={12} color={colors.accent} />
                            <Text style={styles.clearanceText}>{roleName.toUpperCase()}</Text>
                        </View>
                        {getTechStatusBadge()}
                    </View>
                </View>
            </View>

            {/* Account Metadata */}
            <Text style={styles.sectionLabel}>System Credentials</Text>
            <View style={styles.metaCard}>
                <View style={styles.metaRow}>
                    <View style={styles.metaIconWell}>
                        <Ionicons name="mail" size={18} color={colors.primary} />
                    </View>
                    <View style={styles.metaInfo}>
                        <Text style={styles.metaKey}>Email Protocol</Text>
                        <Text style={styles.metaVal}>{user.email}</Text>
                    </View>
                </View>

                <View style={[styles.metaRow, styles.metaRowBorder]}>
                    <View style={styles.metaIconWell}>
                        <Ionicons name="pulse" size={18} color={colors.accent} />
                    </View>
                    <View style={styles.metaInfo}>
                        <Text style={styles.metaKey}>Clearance Status</Text>
                        <Text style={styles.metaVal}>{user.status || 'Verified Active'}</Text>
                    </View>
                </View>
            </View>

            {/* Command Interface */}
            <Text style={styles.sectionLabel}>Operator Commands</Text>
            <View style={styles.actionStack}>
                {isApprovedTech && (
                    <TouchableOpacity 
                        style={[styles.actionItem, { backgroundColor: 'rgba(139, 92, 246, 0.05)', borderColor: 'rgba(139, 92, 246, 0.2)' }]} 
                        onPress={() => (navigation as any).navigate('TechnicianPortal')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.actionIconWell, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                            <Ionicons name="terminal" size={20} color={colors.primary} />
                        </View>
                        <Text style={[styles.actionText, { color: colors.primary }]}>Technician Command Center</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                )}

                {techStatus === 'none' && (roleName.toLowerCase() === 'user' || roleName.toLowerCase() === 'client') && (
                    <TouchableOpacity 
                        style={styles.actionItem} 
                        onPress={() => (navigation as any).navigate('TechnicianApplication')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionIconWell}>
                            <Ionicons name="build-outline" size={20} color={colors.textStrong} />
                        </View>
                        <Text style={styles.actionText}>Become a Certified Tech</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                    </TouchableOpacity>
                )}

                {techStatus === 'rejected' && (
                    <TouchableOpacity 
                        style={[styles.actionItem, { borderColor: colors.error }]} 
                        onPress={() => (navigation as any).navigate('TechnicianApplication')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.actionIconWell}>
                            <Ionicons name="refresh-outline" size={20} color={colors.error} />
                        </View>
                        <Text style={[styles.actionText, { color: colors.error }]}>Resubmit Tech Application</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.error} />
                    </TouchableOpacity>
                )}

                <TouchableOpacity 
                    style={styles.actionItem} 
                    onPress={() => (navigation as any).navigate('EditProfile')}
                    activeOpacity={0.7}
                >
                    <View style={styles.actionIconWell}>
                        <Ionicons name="construct-outline" size={20} color={colors.textStrong} />
                    </View>
                    <Text style={styles.actionText}>Edit Operator Profile</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.actionItem} 
                    onPress={() => { }}
                    activeOpacity={0.7}
                >
                    <View style={styles.actionIconWell}>
                        <Ionicons name="lock-closed-outline" size={20} color={colors.textStrong} />
                    </View>
                    <Text style={styles.actionText}>Security Settings</Text>
                    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </TouchableOpacity>

                <CustomButton
                    title="Terminate Session"
                    variant="danger"
                    icon={<Ionicons name="power-outline" size={20} color={colors.error} />}
                    onPress={handleLogout}
                    style={styles.logoutBtn}
                />
            </View>

            <View style={styles.footer}>
                <Text style={styles.versionText}>PRO-WISE v2.0.0 • CORE-NODE-ALPHA</Text>
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
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    avatarGlow: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.2,
        borderRadius: 60,
    },
    avatarInner: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.surfaceContainerHigh,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.glassBorder,
        ...shadows.lg,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '800',
        color: colors.primary,
    },
    statusBadge: {
        position: 'absolute',
        bottom: 5,
        right: 15,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.surfaceContainerHighest,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.bg,
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.accent,
    },
    identityWell: { alignItems: 'center' },
    nameText: {
        ...typography.h2,
        color: colors.textStrong,
        marginBottom: 2,
    },
    usernameText: {
        ...typography.sm,
        color: colors.textMuted,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    clearanceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.full,
        marginTop: spacing.md,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.2)',
    },
    clearanceText: {
        ...typography.caption,
        color: colors.accent,
        fontSize: 9,
    },

    // Meta Card
    sectionLabel: {
        ...typography.caption,
        marginBottom: spacing.sm,
        paddingHorizontal: spacing.sm,
    },
    metaCard: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        paddingVertical: spacing.sm,
        marginBottom: spacing.xl,
        ...shadows.md,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.md,
        gap: spacing.md,
    },
    metaRowBorder: {
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    metaIconWell: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    metaInfo: { flex: 1 },
    metaKey: {
        ...typography.caption,
        fontSize: 9,
        marginBottom: 2,
    },
    metaVal: {
        ...typography.bodyBold,
        color: colors.textStrong,
        fontSize: 15,
    },

    // Actions
    actionStack: { gap: spacing.md },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    actionIconWell: {
        width: 40,
        height: 40,
        borderRadius: radius.md,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        ...typography.bodyBold,
        flex: 1,
        color: colors.textStrong,
        fontSize: 15,
    },
    logoutBtn: { marginTop: spacing.md },

    // Footer
    footer: {
        marginTop: spacing.huge,
        alignItems: 'center',
        opacity: 0.5,
    },
    versionText: {
        ...typography.xs,
        color: colors.textMuted,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    copyrightText: {
        ...typography.caption,
        fontSize: 8,
        marginTop: 4,
    },
});


export default ProfileScreen;
