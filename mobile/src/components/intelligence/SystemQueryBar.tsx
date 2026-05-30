import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SystemQueryBarProps {
    onPress?: () => void;
    placeholder?: string;
}

const SystemQueryBar: React.FC<SystemQueryBarProps> = ({ onPress, placeholder = "QUERY SYSTEM ARCHIVE..." }) => {
    return (
        <TouchableOpacity 
            style={styles.container} 
            activeOpacity={0.9} 
            onPress={onPress}
        >
            <LinearGradient
                colors={['rgba(79, 70, 229, 0.15)', 'rgba(79, 70, 229, 0.05)']}
                style={styles.inner}
            >
                <View style={styles.icon}>
                    <Ionicons name="search" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.text, { color: colors.textMuted }]}>{placeholder}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>INTEL</Text>
                </View>
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        marginVertical: spacing.md,
    },
    inner: {
        height: 56,
        borderRadius: radius.md,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(79, 70, 229, 0.3)',
    },
    icon: {
        marginRight: spacing.md,
    },
    text: {
        flex: 1,
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    badge: {
        backgroundColor: 'rgba(79, 70, 229, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        borderWidth: 0.5,
        borderColor: colors.primary,
    },
    badgeText: {
        color: colors.primary,
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    }
});

export default SystemQueryBar;
