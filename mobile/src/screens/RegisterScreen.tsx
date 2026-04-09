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
    ScrollView, 
    Image 
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError, resetSuccess } from '../store/slices/authSlice';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootState, AppDispatch } from '../store';
import { RootStackNavigationProp } from '../navigation/types';

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
            Alert.alert('Success', 'Account created! Please login.');
            dispatch(resetSuccess());
            navigation.navigate('Login');
        }
        return () => { dispatch(clearError()); };
    }, [success, navigation, dispatch]);

    useEffect(() => {
        if (error) Alert.alert('Registration Failed', error);
    }, [error]);

    const handleRegister = () => {
        if (!name || !username || !email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <Image
                        source={require('../../assets/pro-wise.png')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Get started in seconds</Text>
                </View>

                {/* Mobile registration is for client accounts only.
                    Company admin registration is available on the web app. */}

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Full Name</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="John Doe" 
                        placeholderTextColor={colors.textMuted}
                        value={name} 
                        onChangeText={setName} 
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Username</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="johndoe" 
                        placeholderTextColor={colors.textMuted}
                        value={username} 
                        onChangeText={setUsername} 
                        autoCapitalize="none" 
                    />
                </View>

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
                        placeholder="••••••••" 
                        placeholderTextColor={colors.textMuted}
                        value={password} 
                        onChangeText={setPassword} 
                        secureTextEntry 
                    />
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                    <TouchableOpacity style={styles.button} onPress={handleRegister}>
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.linkContainer}>
                    <Text style={styles.linkText}>Already have an account? Sign In</Text>
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    scroll: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    header: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: spacing.md,
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
    inputGroup: { marginBottom: spacing.lg },
    label: { 
        color: colors.text, 
        marginBottom: spacing.sm, 
        fontSize: typography.sm.fontSize, 
        fontWeight: '600' 
    },
    input: { 
        backgroundColor: colors.surfaceRaised, 
        borderWidth: 1, 
        borderColor: colors.border, 
        borderRadius: radius.md, 
        padding: spacing.base, 
        color: colors.textStrong, 
        fontSize: typography.body.fontSize 
    },
    button: { 
        backgroundColor: colors.primary, 
        padding: spacing.base, 
        borderRadius: radius.md, 
        alignItems: 'center', 
        marginTop: spacing.sm, 
        ...shadows.glow 
    },
    buttonText: { 
        color: '#fff', 
        fontSize: typography.bodyBold.fontSize, 
        fontWeight: typography.bodyBold.fontWeight 
    },
    linkContainer: { marginTop: spacing.lg, alignItems: 'center' },
    linkText: { color: colors.primary, fontSize: typography.body.fontSize },
});

export default RegisterScreen;
