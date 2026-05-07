import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    Alert, 
    ActivityIndicator, 
    KeyboardAvoidingView, 
    Platform, 
    ScrollView
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, googleLogin, clearError, resetSuccess } from '../store/slices/authSlice';
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

interface RegisterScreenProps {
    navigation: RootStackNavigationProp<'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const roleName = 'client';

    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector((state: RootState) => state.auth);

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
            const token = authentication?.accessToken;
            if (token) {
                dispatch(googleLogin(token));
            }
        }
    }, [response]);

    useEffect(() => {
        if (success) {
            Alert.alert('Registration Successful', 'Your account has been created. Please sign in to continue.');
            dispatch(resetSuccess());
            navigation.navigate('Login');
        }
        return () => { dispatch(clearError()); };
    }, [success, navigation, dispatch]);

    useEffect(() => {
        if (error) Alert.alert('Registration Failed', error);
    }, [error]);

    const handleRegister = () => {
        if (!name.trim() || !username.trim() || !email.trim() || !password) {
            Alert.alert('Incomplete Form', 'Please fill in all fields to create your account.');
            return;
        }
        dispatch(registerUser({ 
            name: name.trim(), 
            username: username.trim(), 
            email: email.trim(), 
            password, 
            roleName: roleName 
        }));
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[colors.secondary, colors.bg, colors.bg]}
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
                    keyboardShouldPersistTaps="handled"
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
                        <Text style={styles.title}>New Operator</Text>
                        <Text style={styles.subtitle}>Initialize your system profile</Text>
                    </View>

                    <View style={styles.formCard}>
                        <CustomInput
                            label="Full Identity"
                            icon="person-outline"
                            placeholder="John Doe"
                            value={name}
                            onChangeText={setName}
                        />

                        <CustomInput
                            label="Callsign"
                            icon="at-outline"
                            placeholder="johndoe"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />

                        <CustomInput
                            label="Communication Link"
                            icon="mail-outline"
                            placeholder="you@company.com"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />

                        <CustomInput
                            label="Security Protocol"
                            icon="lock-closed-outline"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <CustomButton
                            title="Register Account"
                            onPress={handleRegister}
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
                            <Text style={styles.footerText}>Already Registered? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Sign In</Text>
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
        width: 110,
        height: 110,
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
    loginLink: {
        ...typography.smBold,
        color: colors.primary,
    },
});


export default RegisterScreen;
