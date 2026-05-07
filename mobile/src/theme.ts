import { Appearance, Platform } from 'react-native';

/**
 * PRO-WISE Mobile Theme — Neo-Industrial Indigo/Slate
 * Balanced for both Light and Dark modes to match Web "Vibes"
 */

const palettes = {
    dark: {
        primary: '#4F46E5',             // Indigo 600
        primaryHover: '#3323CC',
        primaryLight: 'rgba(79, 70, 229, 0.15)',
        primaryContainer: 'rgba(79, 70, 229, 0.15)',
        accent: '#6CD3F7',              // Sky/Cyan
        bg: '#13121B',                  // Deep Midnight
        surface: '#1F1F28',             // Deep Slate
        surfaceContainer: '#2A2933',
        surfaceContainerHigh: '#2A2933',
        surfaceContainerHighest: '#35343E',
        surfaceRaised: '#35343E',
        text: '#C7C4D8',                // Subdued Silver
        textStrong: '#E4E1EE',          // Off White
        textMuted: '#918FA1',           // Slate Grey
        textInverse: '#13121B',
        border: '#464555',
        glass: 'rgba(19, 18, 27, 0.8)',
        glassBorder: 'rgba(228, 225, 238, 0.1)',
        success: '#10B981',
        error: '#FFB4AB',
        warning: '#FFB695',
        secondary: '#6366F1',           // Indigo 500
    },
    light: {
        primary: '#4F46E5',             // Indigo 600
        primaryHover: '#3323CC',
        primaryLight: 'rgba(79, 70, 229, 0.08)',
        primaryContainer: 'rgba(79, 70, 229, 0.08)',
        accent: '#006780',              // Deep Teal
        bg: '#FCF8FF',                  // Violet White
        surface: '#FFFFFF',             // Absolute White
        surfaceContainer: '#F0ECF9',
        surfaceContainerHigh: '#F0ECF9',
        surfaceContainerHighest: '#F5F2FF',
        surfaceRaised: '#F5F2FF',
        text: '#464555',                // Charcoal
        textStrong: '#1B1B24',          // Dark Navy
        textMuted: '#777587',           // Cool Grey
        textInverse: '#FFFFFF',
        border: '#EAE6F4',              // Light Lavender
        glass: 'rgba(255, 255, 255, 0.85)',
        glassBorder: 'rgba(119, 117, 135, 0.15)',
        success: '#059669',
        error: '#BA1A1A',
        warning: '#7E3000',
        secondary: '#818CF8',           // Indigo 400
    }
};

const isDark = Appearance.getColorScheme() === 'dark';
export const colors = isDark ? palettes.dark : palettes.light;

export const spacing = {
    xs: 4, sm: 8, md: 16, base: 16, lg: 24, xl: 32, xxl: 48, huge: 64,
};

export const radius = {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, full: 9999,
};

export const typography = {
    h1: { fontSize: 32, fontWeight: '800' as const, color: colors.textStrong, letterSpacing: -1 },
    h2: { fontSize: 24, fontWeight: '700' as const, color: colors.textStrong, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' as const, color: colors.textStrong },
    h4: { fontSize: 18, fontWeight: '700' as const, color: colors.textStrong },
    body: { fontSize: 16, fontWeight: '400' as const, color: colors.text, lineHeight: 24 },
    bodyBold: { fontSize: 16, fontWeight: '600' as const, color: colors.textStrong },
    sm: { fontSize: 14, fontWeight: '400' as const, color: colors.text, lineHeight: 20 },
    smBold: { fontSize: 14, fontWeight: '600' as const, color: colors.textStrong },
    caption: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
    xs: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.4 : 0.1,
        shadowRadius: 16,
        elevation: 4,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: isDark ? 0.5 : 0.15,
        shadowRadius: 24,
        elevation: 8,
    },
};

export const getColors = (scheme: 'light' | 'dark' | null | undefined) => {
    return scheme === 'dark' ? palettes.dark : palettes.light;
};

import { useColorScheme } from 'react-native';

export const useTheme = () => {
    const scheme = useColorScheme();
    const isDark = scheme === 'dark';
    const themeColors = isDark ? palettes.dark : palettes.light;
    
    return {
        colors: themeColors,
        isDark,
        spacing,
        radius,
        typography: {
            ...typography,
            h1: { ...typography.h1, color: themeColors.textStrong },
            h2: { ...typography.h2, color: themeColors.textStrong },
            h3: { ...typography.h3, color: themeColors.textStrong },
            h4: { ...typography.h4, color: themeColors.textStrong },
            body: { ...typography.body, color: themeColors.text },
            bodyBold: { ...typography.bodyBold, color: themeColors.textStrong },
            sm: { ...typography.sm, color: themeColors.text },
            smBold: { ...typography.smBold, color: themeColors.textStrong },
            caption: { ...typography.caption, color: themeColors.textMuted },
        },
        shadows: {
            sm: { ...shadows.sm, shadowOpacity: isDark ? 0.3 : 0.05 },
            md: { ...shadows.md, shadowOpacity: isDark ? 0.4 : 0.1 },
            lg: { ...shadows.lg, shadowOpacity: isDark ? 0.5 : 0.15 },
        }
    };
};

export const mixins = {
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadows.sm,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    input: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.md,
        padding: spacing.base,
        color: colors.textStrong,
        borderWidth: 1,
        borderColor: colors.border,
    }
};

export default { colors, spacing, radius, typography, shadows, mixins };

