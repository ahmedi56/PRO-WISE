import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { colors, spacing, radius, typography, mixins } from '../theme';

const ProfileScreen = ({ navigation }) => {
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: () => dispatch(logout()) },
            ]
        );
    };

    if (!user) return null;

    const displayName = user.name || user.username || 'User';
    const initial = displayName[0]?.toUpperCase() || 'U';
    const roleName = (typeof user.role?.name === 'string'
        ? user.role.name
        : (typeof user.role === 'string' ? user.role : 'User'));

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <View style={styles.header}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                </View>
                <Text style={styles.name}>{displayName}</Text>
                {user.name && <Text style={styles.username}>@{user.username}</Text>}

                <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{roleName}</Text>
                </View>
            </View>

            <View style={styles.infoSection}>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{user.email}</Text>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{user.phone || 'Not set'}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => navigation.navigate('EditProfile')}
                >
                    <Text style={styles.buttonIcon}></Text>
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.button, styles.logoutButton]}
                    onPress={handleLogout}
                >
                    <Text style={styles.buttonIcon}></Text>
                    <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    content: { padding: spacing.lg },
    header: { alignItems: 'center', marginVertical: spacing.xxl },
    avatar: {
        ...mixins.avatar(90),
        marginBottom: spacing.md,
    },
    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: colors.primary,
    },
    name: { fontSize: typography.h2.fontSize, fontWeight: typography.h2.fontWeight, color: colors.textStrong, marginBottom: spacing.xs, textAlign: 'center' },
    username: { fontSize: typography.body.fontSize, color: colors.textMuted, marginBottom: spacing.md },
    roleBadge: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.full,
        marginTop: spacing.sm,
    },
    roleText: { color: colors.primary, fontWeight: '600', textTransform: 'capitalize', fontSize: typography.sm.fontSize },
    infoSection: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    infoRow: {
        marginBottom: spacing.md,
    },
    infoLabel: {
        fontSize: typography.xs.fontSize,
        color: colors.textMuted,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: spacing.xs,
    },
    infoValue: {
        fontSize: typography.body.fontSize,
        color: colors.textStrong,
    },
    actions: { gap: spacing.md },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        padding: spacing.base,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        gap: spacing.md,
    },
    buttonIcon: { fontSize: 18 },
    buttonText: { fontSize: typography.bodyBold.fontSize, fontWeight: typography.bodyBold.fontWeight, color: colors.textStrong },
    logoutButton: { borderColor: colors.errorLight, backgroundColor: colors.errorLight },
    logoutText: { color: colors.error },
});

export default ProfileScreen;
