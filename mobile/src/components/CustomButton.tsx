import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, TouchableOpacityProps, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme';

interface CustomButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    icon?: React.ReactNode;
    size?: 'small' | 'medium' | 'large';
    fullWidth?: boolean;
    textStyle?: any;
    containerStyle?: any;
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
    containerStyle,
    ...props 
}) => {
    const theme = useTheme();
    const { colors, radius, typography, shadows } = theme;
    
    const isPrimary = variant === 'primary';
    const isGhost = variant === 'ghost';
    const isOutline = variant === 'outline';
    const isDanger = variant === 'danger';
    const isSecondary = variant === 'secondary';
    
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
                            { color: isPrimary ? '#FFFFFF' : colors.textStrong },
                            size === 'small' && { fontSize: 14 },
                            size === 'large' && { fontSize: 18 },
                            (isOutline || isGhost) && { color: colors.primary },
                            isDanger && { color: colors.error },
                            disabled && { color: colors.textMuted },
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
        { borderRadius: radius.md },
        size === 'small' && { height: 44, paddingHorizontal: 16 },
        size === 'large' && { height: 64, paddingHorizontal: 32 },
        !fullWidth && { alignSelf: 'flex-start' },
        isSecondary && { backgroundColor: colors.surfaceContainer, borderWidth: 1, borderColor: colors.border },
        isOutline && { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border },
        isGhost && { backgroundColor: 'transparent' },
        isDanger && { backgroundColor: `${colors.error}1A`, borderWidth: 1, borderColor: `${colors.error}33` },
        disabled && { opacity: 0.5, backgroundColor: colors.surfaceContainer },
        style
    ];

    if (isPrimary && !disabled && !loading) {
        return (
            <TouchableOpacity
                style={[buttonStyles, containerStyle]}
                disabled={disabled || loading}
                activeOpacity={0.85}
                {...props}
            >
                <LinearGradient
                    colors={[colors.primary, colors.primaryHover]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[StyleSheet.absoluteFill, { borderRadius: radius.md }]}
                />
                {renderContent()}
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity
            style={[buttonStyles, containerStyle]}
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
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
        flexDirection: 'row',
        overflow: 'hidden',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginRight: 12,
    },
    text: {
        fontWeight: '700',
        fontSize: 16,
        letterSpacing: -0.2,
    },
});

export default CustomButton;
