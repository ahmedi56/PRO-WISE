import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackNavigationProp } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

interface LoginScreenProps {
    navigation: RootStackNavigationProp<'Login'>;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch<AppDispatch>();
    const { loading, error } = useSelector((state: RootState) => state.auth);

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
                colors={['rgba(59, 130, 246, 0.04)', colors.bg]}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <ProWiseLogoSvg width={48} height={48} />
                    </View>
                    <Text style={styles.title}>Welcome Back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                <View style={styles.form}>
                    <CustomInput
                        label="Email or callsig"
                        icon="mail-outline"
                        placeholder="operator@prowise.network"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <CustomInput
                        label="Password"
                        icon="lock-closed-outline"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <CustomButton
                        title="Sign In"
                        onPress={handleLogin}
                        loading={loading}
                        style={{ marginTop: spacing.md }}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Don't have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={styles.registerLink}>Sign Up</Text>
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
    logoBadge: {
        width: 80,
        height: 80,
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    title: {
        ...typography.h1,
        fontSize: 32,
        color: colors.textStrong,
        marginBottom: spacing.xs,
    },
    subtitle: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
    },
    form: {
        width: '100%',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        ...typography.body,
        color: colors.textMuted,
    },
    registerLink: {
        ...typography.bodyBold,
        color: colors.primary,
    },
});

export default LoginScreen;
