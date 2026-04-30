import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withRepeat, 
    withSequence, 
    withTiming,
    interpolate,
} from 'react-native-reanimated';

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopStackNavigator from './ShopStackNavigator';
import { colors, radius, typography, spacing } from '../theme';
import { MainTabParamList } from './types';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TabNavigator = Tab.Navigator as any;

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'home-outline',
    Shop: 'layers-outline',
    Scan: 'qr-code-outline',
    Profile: 'person-outline',
};

interface AnimatedTabIconProps {
    name: keyof typeof Ionicons.glyphMap;
    focused: boolean;
    color: string;
    size: number;
}

const AnimatedTabIcon: React.FC<AnimatedTabIconProps> = ({ name, focused, color, size }) => {
    const scale = useSharedValue(1);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.15 : 1, {
            damping: 10,
            stiffness: 90,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={size + 2} color={color} />
            {focused && (
                <View style={[styles.tabIndicator, { backgroundColor: color }]} />
            )}
        </Animated.View>
    );
};

const AnimatedScanButton: React.FC<{ focused: boolean; size: number }> = ({ focused, size }) => {
    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);
    const ring1Scale = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withTiming(1.2, { duration: 2000 }),
            -1,
            true
        );
        ring1Scale.value = withRepeat(
            withTiming(1.6, { duration: 2000 }),
            -1,
            false
        );
    }, []);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 120 });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const ringStyle = useAnimatedStyle(() => ({
        transform: [{ scale: ring1Scale.value }],
        opacity: interpolate(ring1Scale.value, [1, 1.6], [0.6, 0]),
    }));

    return (
        <Animated.View style={[styles.scanButtonOuter, animatedStyle]}>
            <Animated.View style={[styles.scanRing, ringStyle]} />
            <View style={styles.scanButtonInner}>
                <Ionicons name="qr-code" size={size + 6} color="#0F131C" />
            </View>
        </Animated.View>
    );
};

const BrandedHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.headerContainer}>
        <View style={styles.headerLogo}>
            <ProWiseLogoSvg width={22} height={22} />
        </View>
        <Text style={styles.headerTitleText}>{title.toUpperCase()}</Text>
    </View>
);

const MainTabNavigator: React.FC = () => {
    return (
        <TabNavigator
            screenOptions={({ route }) => ({
                tabBarBackground: () => (
                    Platform.OS === 'ios' ? (
                        <BlurView 
                            tint="dark" 
                            intensity={80} 
                            style={StyleSheet.absoluteFill} 
                        />
                    ) : (
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 19, 28, 0.98)' }]} />
                    )
                ),
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 24,
                    left: 20,
                    right: 20,
                    height: 72,
                    borderRadius: radius.xl,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderWidth: 1,
                    borderColor: 'rgba(255, 255, 255, 0.12)',
                    paddingBottom: 0,
                    ...Platform.select({
                        ios: { 
                            shadowColor: colors.primary, 
                            shadowOffset: { width: 0, height: 10 }, 
                            shadowOpacity: 0.15, 
                            shadowRadius: 20 
                        },
                        android: { elevation: 12 }
                    }),
                    overflow: 'hidden',
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarShowLabel: false,
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = ICONS[route.name] || 'square-outline';
                    
                    if (route.name === 'Scan') {
                        return (
                            <View style={{ top: -12 }}>
                                <AnimatedScanButton focused={focused} size={size} />
                            </View>
                        );
                    }

                    return (
                        <AnimatedTabIcon 
                            name={focused ? (iconName.replace('-outline', '') as any) : iconName} 
                            focused={focused} 
                            color={color} 
                            size={size} 
                        />
                    );
                },
                headerStyle: {
                    backgroundColor: colors.bg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    height: Platform.OS === 'ios' ? 100 : 80,
                },
                headerTitle: ({ children }) => <BrandedHeader title={children} />,
                headerTitleAlign: 'left',
                headerTintColor: colors.textStrong,
                headerBackground: () => (
                    <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
                )
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen as any} options={{ title: 'Console' }} />
            <Tab.Screen 
                name="Shop" 
                component={ShopStackNavigator as any} 
                options={{ headerShown: false, title: 'Registry' }} 
            />
            <Tab.Screen 
                name="Scan" 
                component={require('../screens/QRScannerScreen').default} 
                options={{ title: 'Optical Scan' }} 
            />
            <Tab.Screen name="Profile" component={ProfileScreen as any} options={{ title: 'Operator' }} />
        </TabNavigator>
    );
};

const styles = StyleSheet.create({
    scanButtonOuter: {
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanRing: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    scanButtonInner: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: colors.bg,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    tabIndicator: {
        width: 12,
        height: 2,
        borderRadius: 1,
        alignSelf: 'center',
        marginTop: 4,
        position: 'absolute',
        bottom: -8,
        shadowColor: colors.primary,
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: spacing.sm,
    },
    headerLogo: {
        marginRight: spacing.sm,
        padding: 4,
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    headerTitleText: {
        fontSize: 16,
        color: colors.textStrong,
        fontWeight: '900',
        letterSpacing: 2,
    },
});

export default MainTabNavigator;
