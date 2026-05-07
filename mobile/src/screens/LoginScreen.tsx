import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, googleLogin, clearError } from '../store/slices/authSlice';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows } from '../theme';

import { RootState, AppDispatch } from '../store';
import { RootStackNavigationProp } from '../navigation/types';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

WebBrowser.maybeCompleteAuthSession();

interface LoginScreenProps {
    navigation: RootStackNavigationProp<'Login'>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

    const [request, response, promptAsync] = Google.useAuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
        webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
        iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
        scopes: ['profile', 'email'],
        redirectUri: process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI,
    });

    useEffect(() => {
        if (response?.type === 'success') {
            const { authentication } = response;
            // Use accessToken (preferred by backend)
            const token = authentication?.accessToken;
            if (token) {
                dispatch(googleLogin(token));
            }
        }
    }, [response]);

    useEffect(() => {
        if (error) {
            Alert.alert('Login Failed', error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert('Input Error', 'Please enter your credentials');
            return;
        }
        try {
            await dispatch(loginUser({ email: email.trim(), password })).unwrap();
        } catch (err: any) {
            // Error is handled by useEffect via state, but we can also handle here
            console.error('Login Error:', err);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.primaryContainer, colors.bg, colors.bg]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.flatten(StyleSheet.absoluteFill)}
            />
            
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView 
                    contentContainerStyle={styles.scrollContent} 
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
                                style={StyleSheet.absoluteFill}
                            />
                            <ProWiseLogoSvg width={80} height={100} />
                        </View>
                        <Text style={styles.title}>System Access</Text>
                        <Text style={styles.subtitle}>Initialize operator credentials</Text>
                    </View>

                    <View style={styles.formCard}>
                        <CustomInput
                            label="Operator ID"
                            icon="person-outline"
                            placeholder="operator@prowise.network"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />

                        <CustomInput
                            label="Security Key"
                            icon="lock-closed-outline"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <CustomButton
                            title="Authenticate"
                            onPress={handleLogin}
                            loading={loading}
                            style={{ marginTop: spacing.md }}
                        />

                        <View style={styles.divider}>
                            <View style={styles.line} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.line} />
                        </View>

                        <TouchableOpacity 
                            style={styles.googleButton} 
                            onPress={() => promptAsync({ showInRecents: true })}
                            disabled={!request || loading}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="logo-google" size={20} color={colors.textStrong} />
                            <Text style={styles.googleButtonText}>Google Gateway</Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>New Operator? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                <Text style={styles.registerLink}>Register Account</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xxl,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: radius.xxl,
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.glassBorder,
        marginBottom: spacing.lg,
        ...shadows.lg,
    },
    title: {
        ...typography.h1,
        color: colors.textStrong,
        marginBottom: 4,
    },
    subtitle: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        fontSize: 14,
    },
    formCard: {
        backgroundColor: colors.glass,
        borderRadius: radius.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.lg,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.xl,
    },
    line: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
        opacity: 0.5,
    },
    dividerText: {
        ...typography.caption,
        color: colors.textMuted,
        marginHorizontal: spacing.md,
    },
    googleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surfaceContainerHigh,
        borderRadius: radius.md,
        height: 56,
        gap: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    googleButtonText: {
        ...typography.bodyBold,
        color: colors.textStrong,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        ...typography.sm,
        color: colors.textMuted,
    },
    registerLink: {
        ...typography.smBold,
        color: colors.primary,
    },
});


export default LoginScreen;
