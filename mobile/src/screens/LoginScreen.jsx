import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';
import { colors, spacing, radius, typography, shadows } from '../theme';

import API_URL from '../constants/config';

const LoginScreen = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const { loading, error } = useSelector((state) => state.auth);
    const [isOnline, setIsOnline] = useState(null);

    useEffect(() => {
        const checkConnection = async () => {
            try {
                const res = await fetch(`${API_URL}/health`);
                setIsOnline(res.ok);
            } catch (err) {
                console.warn('Backend Unreachable:', err.message);
                setIsOnline(false);
            }
        };
        checkConnection();
        const interval = setInterval(checkConnection, 10000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (error) {
            Alert.alert('Login Failed', error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleLogin = () => {
        dispatch(loginUser({ email: email.trim(), password }));
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Image
                    source={require('../../assets/pro-wise.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account</Text>

                <View style={[styles.statusBadge, isOnline === true ? styles.online : (isOnline === false ? styles.offline : styles.checking)]}>
                    <Text style={styles.statusText}>
                        {isOnline === true ? '● Online' : (isOnline === false ? '● Offline (Server Unreachable)' : '● Checking Connection...')}
                    </Text>
                </View>
            </View>

            <View style={styles.form}>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="email@example.com"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="********"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <View style={{ gap: spacing.md }}>
                        <TouchableOpacity style={styles.button} onPress={handleLogin}>
                            <Text style={styles.buttonText}>Sign In</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryButton}
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.secondaryButtonText}>Create Account</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxxl,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: typography.h1.fontSize,
        fontWeight: typography.h1.fontWeight,
        color: colors.textStrong,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: typography.body.fontSize,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: radius.sm,
        marginTop: spacing.sm,
    },
    statusText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    online: { color: colors.success },
    offline: { color: colors.error },
    checking: { color: colors.warning },
    form: {},
    inputGroup: {
        marginBottom: spacing.lg,
    },
    label: {
        color: colors.text,
        marginBottom: spacing.sm,
        fontSize: typography.sm.fontSize,
        fontWeight: '600',
    },
    input: {
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.base,
        color: colors.textStrong,
        fontSize: typography.body.fontSize,
    },
    button: {
        backgroundColor: colors.primary,
        padding: spacing.base,
        borderRadius: radius.md,
        alignItems: 'center',
        ...shadows.glow,
    },
    buttonText: {
        color: '#fff',
        fontSize: typography.bodyBold.fontSize,
        fontWeight: typography.bodyBold.fontWeight,
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        padding: spacing.base,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: colors.textMuted,
        fontSize: typography.bodyBold.fontSize,
        fontWeight: typography.bodyBold.fontWeight,
    },
});

export default LoginScreen;
