import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, TouchableOpacity, Animated } from 'react-native';
const AnimatedView = Animated.View as any;
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { useTheme } from '../theme';

interface CustomInputProps extends TextInputProps {
    label?: string;
    icon?: keyof typeof Ionicons.glyphMap;
    error?: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ label, icon, error, secureTextEntry, style, ...props }) => {
    const theme = useTheme();
    const { colors, spacing, radius, typography } = theme;
    const [isFocused, setIsFocused] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const focusAnim = useRef(new Animated.Value(0)).current;

    const isSecure = secureTextEntry && !isPasswordVisible;

    useEffect(() => {
        Animated.timing(focusAnim, {
            toValue: isFocused ? 1 : 0,
            duration: 250,
            useNativeDriver: false
        }).start();
    }, [isFocused]);

    const borderColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [error ? colors.error : colors.border, colors.primary]
    });

    const backgroundColor = focusAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.surface, `${colors.primary}0D`]
    });

    return (
        <View style={styles.container}>
            {label && (
                <Text style={[
                    styles.label, 
                    { color: colors.textMuted },
                    isFocused && { color: colors.primary }
                ]}>
                    {label}
                </Text>
            )}
            <AnimatedView 
                style={[
                    styles.inputContainer, 
                    { borderColor, backgroundColor, borderRadius: radius.md },
                    isFocused && {
                        shadowColor: colors.primary,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 2,
                    }
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
                    style={[styles.input, { color: colors.textStrong, ...typography.body }]}
                    placeholderTextColor={colors.textMuted}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
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
            </AnimatedView>
            {error && (
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle-outline" size={12} color={colors.error} />
                    <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
        width: '100%',
    },
    label: {
        fontSize: 10,
        fontWeight: '700',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        height: 56,
        borderWidth: 1.5,
    },
    icon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        height: '100%',
        paddingVertical: 0,
    },
    eyeIcon: {
        padding: 8,
    },
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    errorText: {
        fontSize: 12,
        fontWeight: '600',
    },
});

export default CustomInput;
