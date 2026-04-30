import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme';

interface CustomInputProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    error?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, icon, error, secureTextEntry, ...props }) => {
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [focusAnim] = useState(new Animated.Value(0));

    const isSecure = secureTextEntry && !isPasswordVisible;

    const handleFocus = () => {
        setIsFocused(true);
        Animated.timing(focusAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: false
        }).start();
    };

    const handleBlur = () => {
        setIsFocused(false);
        Animated.timing(focusAnim, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false
        }).start();
    };

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? colors.error : colors.border, colors.primary]
    });

    const backgroundColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.surface, 'rgba(165, 200, 255, 0.05)']
    });

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[styles.label, isFocused && styles.labelFocused]}>
                    {label}
                </Text>
            )}
            <Animated.View 
                style={[
                    styles.inputContainer, 
                    { borderColor, backgroundColor },
                    isFocused && styles.inputContainerFocused,
                    error ? styles.inputContainerError : null
                ]}
            >
                {icon && (
                    <Ionicons 
                        name={icon} 
                        size={20} 
                        color={isFocused ? colors.primary : colors.textMuted} 
                        style={styles.icon} 
                    />
                )}
                <TextInput
                    style={styles.input}
                    placeholderTextColor={colors.textMuted}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    secureTextEntry={isSecure}
                    {...props}
                />
                {secureTextEntry && (
                    <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)} style={styles.eyeIcon}>
                        <Ionicons 
                            name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} 
                            size={20} 
                            color={isFocused ? colors.primary : colors.textMuted} 
                        />
                    </TouchableOpacity>
                )}
            </Animated.View>
            <AnimatePresence>
                {error && (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </AnimatePresence>
        </View>
    );
};

// Simple AnimatePresence-like wrapper for local usage if needed, 
// but for standard RN we'll just use conditional rendering or LayoutAnimation.
const AnimatePresence: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.lg,
    },
    label: {
        ...typography.smBold,
        color: colors.textMuted,
        marginBottom: spacing.xs,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        fontSize: 11,
    },
    labelFocused: {
        color: colors.primary,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        height: 56,
        borderWidth: 1.5,
    },
    inputContainerFocused: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 3,
    },
    inputContainerError: {
        borderColor: colors.error,
    },
    icon: {
        marginRight: spacing.sm,
    },
    input: {
        ...typography.body,
        flex: 1,
        color: colors.textStrong,
        height: '100%',
    },
    eyeIcon: {
        padding: spacing.xs,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 4,
    },
    errorText: {
        color: colors.error,
        fontSize: 12,
        fontWeight: '600',
    },
});

export default CustomInput;
