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
import { registerUser, clearError, resetSuccess } from '../store/slices/authSlice';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackNavigationProp } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

interface RegisterScreenProps {
    navigation: RootStackNavigationProp<'Register'>;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch<AppDispatch>();
    const { loading, error, success } = useSelector((state: RootState) => state.auth);

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
            roleName: 'client' 
        }));
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['rgba(34, 211, 238, 0.04)', colors.bg]}
                style={StyleSheet.absoluteFill}
            />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" bounces={false}>
                <View style={styles.header}>
                    <View style={styles.logoBadge}>
                        <ProWiseLogoSvg width={48} height={48} />
                    </View>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Register your new account to continue</Text>
                </View>

                <View style={styles.form}>
                    <CustomInput
                        label="Full Name"
                        icon="person-outline"
                        placeholder="John Doe"
                        value={name}
                        onChangeText={setName}
                    />

                    <CustomInput
                        label="Username"
                        icon="at-outline"
                        placeholder="johndoe"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />

                    <CustomInput
                        label="Email Address"
                        icon="mail-outline"
                        placeholder="you@company.com"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
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
                        title="Create Account"
                        onPress={handleRegister}
                        loading={loading}
                        style={{ marginTop: spacing.md }}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
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
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
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
    loginLink: {
        ...typography.bodyBold,
        color: colors.primary,
    },
});

export default RegisterScreen;
