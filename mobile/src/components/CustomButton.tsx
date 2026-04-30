import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, typography, spacing } from '../theme';

interface CustomButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    icon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    textStyle?: any;
}

const CustomButton: React.FC<CustomButtonProps> = ({ 
    title, 
    loading, 
    variant = 'primary', 
    size = 'medium',
    icon, 
    style, 
    disabled, 
    fullWidth = true,
    textStyle,
    ...props 
}) => {
    
    const isPrimary = variant === 'primary';
    const isGhost = variant === 'ghost';
    const isOutline = variant === 'outline';
    const isDanger = variant === 'danger';
    
    const renderContent = () => (
        <View style={styles.content}>
            {loading ? (
                <ActivityIndicator color={isOutline || isGhost ? colors.primary : '#ffffff'} />
            ) : (
                <>
                    {icon && <View style={styles.iconContainer}>{icon}</View>}
                    <Text 
                        style={[
                            styles.text, 
                            size === 'small' && styles.textSm,
                            size === 'large' && styles.textLg,
                            (isOutline || isGhost) && styles.textAccent,
                            isDanger && styles.textDanger,
                            disabled && styles.textDisabled,
                            textStyle
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </View>
    );

    const buttonStyles = [
        styles.base,
        size === 'small' && styles.btnSm,
        size === 'large' && styles.btnLg,
        !fullWidth && styles.btnInline,
        variant === 'secondary' && styles.btnSecondary,
        variant === 'outline' && styles.btnOutline,
        variant === 'ghost' && styles.btnGhost,
        variant === 'danger' && styles.btnDanger,
        disabled && styles.btnDisabled,
        style
    ];

    if (isPrimary && !disabled && !loading) {
        return (
            <TouchableOpacity
                style={[styles.primaryContainer, buttonStyles]}
                disabled={disabled || loading}
                activeOpacity={0.85}
                {...props}
            >
                <LinearGradient
                    colors={[colors.primary, colors.primaryContainer]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.glowOverlay} />
                {renderContent()}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={buttonStyles}
            disabled={disabled || loading}
            activeOpacity={0.7}
            {...props}
        >
            {renderContent()}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    base: {
        height: 54,
        borderRadius: radius.md,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    primaryContainer: {
        ...Platform.select({
            ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.35,
                shadowRadius: 12,
            },
            android: {
                elevation: 8,
            },
        }),
    },
    btnSm: {
        height: 40,
        paddingHorizontal: spacing.md,
        borderRadius: radius.sm,
    },
    btnLg: {
        height: 64,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.lg,
    },
    btnInline: {
        alignSelf: 'flex-start',
    },
    btnSecondary: {
        backgroundColor: colors.surfaceRaised,
    },
    btnOutline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: colors.primaryGlow,
    },
    btnGhost: {
        backgroundColor: 'transparent',
    },
    btnDanger: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    btnDisabled: {
        opacity: 0.4,
        backgroundColor: colors.surface,
    },
    glowOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: spacing.sm,
    },
    text: {
        ...typography.bodyBold,
        color: colors.textInverse,
        fontSize: 15,
        letterSpacing: -0.2,
    },
    textSm: {
        fontSize: 13,
    },
    textLg: {
        fontSize: 17,
    },
    textAccent: {
        color: colors.primary,
    },
    textDanger: {
        color: '#ef4444',
    },
    textDisabled: {
        color: colors.textMuted,
    },
});

export default CustomButton;
