/**
 * PRO-WISE Mobile Theme — Type-Safe Industrial Design Tokens
 */

export const colors = {
    primary: '#0F766E', // Teal 700
    primaryHover: '#0D6B63',
    primaryLight: 'rgba(15, 118, 110, 0.12)',
    primaryGlow: 'rgba(15, 118, 110, 0.25)',

    accent: '#F59E0B', // Amber 500
    accentHover: '#D97706',
    accentLight: 'rgba(245, 158, 11, 0.12)',

    bg: '#0B1220', // Neo-Industrial Dark
    surface: '#111B2E',
    surfaceRaised: '#162033',
    surfaceHover: '#1A2740',
    glass: 'rgba(17, 27, 46, 0.7)',
    glassBorder: 'rgba(255, 255, 255, 0.06)',

    text: '#E2E8F0', // Light slate
    textStrong: '#F8FAFC', // Almost white
    textMuted: '#64748B', // Muted dark slate
    textInverse: '#0B1220',

    border: '#1E293B',
    borderHover: '#334155',

    success: '#10B981',
    successLight: 'rgba(16, 185, 129, 0.12)',
    error: '#EF4444',
    errorLight: 'rgba(239, 68, 68, 0.10)',
    warning: '#F59E0B',
    warningLight: 'rgba(245, 158, 11, 0.12)',
    info: '#3B82F6',
    infoLight: 'rgba(59, 130, 246, 0.12)',
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    huge: 48,
};

export const radius = {
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const typography = {
    heading: {
        fontWeight: '700' as const,
        color: colors.textStrong,
    },
    h1: { fontSize: 32, fontWeight: '700' as const, color: colors.textStrong },
    h2: { fontSize: 24, fontWeight: '700' as const, color: colors.textStrong },
    h3: { fontSize: 20, fontWeight: '600' as const, color: colors.textStrong },
    h4: { fontSize: 18, fontWeight: '600' as const, color: colors.textStrong },
    body: { fontSize: 16, fontWeight: '400' as const, color: colors.text },
    bodyBold: { fontSize: 16, fontWeight: '600' as const, color: colors.textStrong },
    sm: { fontSize: 14, fontWeight: '400' as const, color: colors.text },
    smBold: { fontSize: 14, fontWeight: '600' as const, color: colors.textStrong },
    xs: { fontSize: 12, fontWeight: '500' as const, color: colors.textMuted },
    caption: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const, color: colors.textMuted },
};

export const shadows = {
    sm: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
    },
    lg: {
        shadowColor: '#64748B',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 8,
    },
    glow: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
};

export const mixins = {
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        padding: spacing.lg,
        ...shadows.sm,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.md,
        padding: spacing.base,
        color: colors.textStrong,
        fontSize: typography.body.fontSize,
    },
    buttonPrimary: {
        backgroundColor: colors.primary,
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        alignItems: 'center' as const,
        ...shadows.glow,
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        paddingVertical: spacing.base,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center' as const,
    },
    buttonText: {
        color: colors.textStrong,
        fontSize: typography.bodyBold.fontSize,
        fontWeight: typography.bodyBold.fontWeight,
    },
    screenContainer: {
        flex: 1,
        backgroundColor: colors.bg,
    },
    avatar: (size = 80) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.primaryLight,
        borderWidth: 1,
        borderColor: colors.primary,
        justifyContent: 'center' as const,
        alignItems: 'center' as const,
    }),
};

export default { colors, spacing, radius, typography, shadows, mixins };
