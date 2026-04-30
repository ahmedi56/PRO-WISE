/**
 * PRO-WISE Mobile Theme — The Digital Architect (Stitch Midnight)
 * Type-Safe Design Tokens & Mixins with Tonal Stack
 */

export const colors = {
    // Primary Brand
    primary: '#adc6ff',
    primaryHover: '#d8e2ff',
    primaryLight: 'rgba(173, 198, 255, 0.12)',
    primaryGlow: 'rgba(77, 142, 255, 0.35)',
    primaryContainer: '#4d8eff',

    // Accent
    accent: '#b1c6f9',
    accentLight: 'rgba(177, 198, 249, 0.12)',

    // Surfaces - Tonal Hierarchy
    bg: '#0b1326', 
    surface: '#0b1326', 
    surfaceContainerLowest: '#060e20',
    surfaceContainerLow: '#131b2e',
    surfaceContainer: '#171f33',
    surfaceContainerHigh: '#222a3d',
    surfaceContainerHighest: '#2d3449',
    surfaceRaised: '#131b2e',
    surfaceBright: '#31394d',

    // Overlays
    glass: 'rgba(23, 31, 51, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.06)', 

    // Text
    text: '#c2c6d6', 
    textStrong: '#dae2fd', 
    textMuted: '#8c909f', 
    textInverse: '#0b1326',

    // Borders (Ghost System)
    border: 'rgba(66, 71, 84, 0.25)',
    borderHover: 'rgba(173, 198, 255, 0.25)',
    outline: '#8c909f',
    outlineVariant: '#424754',

    // Semantics
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.12)',
    error: '#ffb4ab',
    errorLight: 'rgba(255, 180, 171, 0.12)',
    warning: '#ffb786',
    warningLight: 'rgba(255, 183, 134, 0.12)',
    info: '#adc6ff', 
    infoLight: 'rgba(173, 198, 255, 0.12)',
};

// Strict 8px Grid
export const spacing = {
    xs: 4,     // space-1
    sm: 8,     // space-2
    md: 12,    // space-3
    base: 16,  // space-4
    lg: 20,    // space-5
    xl: 24,    // space-6
    xxl: 32,   // space-8
    huge: 48,  // space-12
};

export const radius = {
    sm: 6,
    md: 12,    // Primary Radius
    lg: 16,
    xl: 20,
    full: 9999,
};

export const typography = {
    heading: {
        fontFamily: 'Inter',
        fontWeight: '700' as const,
        color: colors.textStrong,
    },
    h1: { fontSize: 32, fontWeight: '800' as const, color: colors.textStrong, letterSpacing: -0.5 },
    h2: { fontSize: 24, fontWeight: '700' as const, color: colors.textStrong, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' as const, color: colors.textStrong },
    h4: { fontSize: 18, fontWeight: '600' as const, color: colors.textStrong },
    body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
    bodyBold: { fontSize: 16, fontWeight: '600' as const, color: colors.textStrong },
    sm: { fontSize: 14, fontWeight: '400' as const, color: colors.text },
    smBold: { fontSize: 14, fontWeight: '500' as const, color: colors.textStrong },
    xs: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
    caption: { fontSize: 11, fontWeight: '700' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: colors.textMuted },
};

export const shadows = {
    sm: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 2,
    },
    md: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 4,
    },
    neon: {
        shadowColor: colors.primaryGlow,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8, // React Native shadowOpacity handles differently than CSS box-shadow
        shadowRadius: 16,
        elevation: 10,
    },
};

export const mixins = {
    card: {
        backgroundColor: colors.surfaceContainer,
        borderRadius: radius.md,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    glassCard: {
        backgroundColor: colors.glass,
        borderRadius: radius.md,
        padding: spacing.xl,
        borderWidth: 1,
        borderColor: colors.glassBorder,
    },
    input: {
        backgroundColor: colors.surfaceContainerLow,
        borderRadius: radius.md,
        padding: spacing.base,
        color: colors.textStrong,
        fontSize: typography.body.fontSize,
        borderWidth: 1,
        borderColor: colors.border,
    },
    buttonPrimary: {
        backgroundColor: colors.primaryContainer, // Replaced gradient with container color for React Native simple compatibility
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        alignItems: 'center' as const,
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center' as const,
    },
    buttonText: {
        color: '#fff', // Pure white on primary buttons usually looks best
        fontSize: typography.smBold.fontSize,
        fontWeight: '600' as const,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    avatar: (size = 80) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryContainer,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    }),
};

export default { colors, spacing, radius, typography, shadows, mixins };
