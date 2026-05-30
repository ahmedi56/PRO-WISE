import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { RootStackNavigationProp } from '../navigation/types';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import CustomInput from '../components/CustomInput';
import CustomButton from '../components/CustomButton';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';
import API_URL from '../constants/config';

interface ForgotPasswordScreenProps {
    navigation: RootStackNavigationProp<'ForgotPassword'>;
}

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResetRequest = async () => {
        if (!email.trim()) {
            Alert.alert('Input Error', 'Please enter your account email');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/forgot-password`, { 
                email: email.trim().toLowerCase() 
            });
            setSent(true);
            Alert.alert('Success', response.data.message);
        } catch (err: any) {
            Alert.alert('Error', err.response?.data?.message || 'Something went wrong');
        } finally {
            setLoading(false);
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
                >
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={() => navigation.goBack()}
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.textStrong} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <View style={styles.logoContainer}>
                            <LinearGradient
                                colors={['rgba(255, 255, 255, 0.1)', 'transparent']}
                                style={StyleSheet.absoluteFill}
                            />
                            <ProWiseLogoSvg width={80} height={100} />
                        </View>
                        <Text style={styles.title}>Recovery</Text>
                        <Text style={styles.subtitle}>Enter your email to receive a secure reset link</Text>
                    </View>

                    <View style={styles.formCard}>
                        {!sent ? (
                            <>
                                <CustomInput
                                    label="Operator Email"
                                    icon="mail-outline"
                                    placeholder="operator@prowise.network"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />

                                <CustomButton
                                    title="Send Link"
                                    onPress={handleResetRequest}
                                    loading={loading}
                                    style={{ marginTop: spacing.md }}
                                />
                            </>
                        ) : (
                            <View style={styles.successContainer}>
                                <Ionicons name="checkmark-circle" size={64} color={colors.primary} />
                                <Text style={styles.successText}>
                                    Check your inbox for instructions to reset your security key.
                                </Text>
                                <CustomButton
                                    title="Back to Login"
                                    onPress={() => navigation.navigate('Login')}
                                    variant="outline"
                                    style={{ marginTop: spacing.lg, width: '100%' }}
                                />
                            </View>
                        )}
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
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        zIndex: 10,
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
    },
    subtitle: {
        ...typography.body,
        color: colors.textMuted,
        textAlign: 'center',
        marginTop: 4,
    },
    formCard: {
        backgroundColor: colors.glass,
        borderRadius: radius.xxl,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
        ...shadows.lg,
    },
    successContainer: {
        alignItems: 'center',
        padding: spacing.md,
    },
    successText: {
        ...typography.body,
        color: colors.textStrong,
        textAlign: 'center',
        marginTop: spacing.md,
    },
});

export default ForgotPasswordScreen;
