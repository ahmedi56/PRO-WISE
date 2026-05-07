import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, Platform, Dimensions, TouchableOpacity, useColorScheme } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons as BaseIonicons } from '@expo/vector-icons';
const Ionicons = BaseIonicons as any;
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withTiming,
} from 'react-native-reanimated';

const AnimatedView = Animated.View as any;
const { width } = Dimensions.get('window');

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopStackNavigator from './ShopStackNavigator';
import { useTheme } from '../theme';

import { MainTabParamList } from './types';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

const Tab = createBottomTabNavigator<MainTabParamList>();
const TabNavigator = Tab.Navigator as any;

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'hardware-chip-outline',
    Shop: 'cube-outline',
    Scan: 'aperture-outline',
    Profile: 'shield-checkmark-outline',
};

const TAB_WIDTH = (width - 40) / 4;

interface TabIndicatorProps {
    index: number;
    color: string;
}

const TabIndicator: React.FC<TabIndicatorProps> = ({ index, color }) => {
    const translateX = useSharedValue(index * TAB_WIDTH);

    useEffect(() => {
        translateX.value = withSpring(index * TAB_WIDTH, {
            damping: 18,
            stiffness: 150,
            mass: 0.8,
        });
    }, [index]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <Animated.View style={[styles.indicatorWrapper, animatedStyle]}>
            <LinearGradient
                colors={[`${color}66`, `${color}1A`]}
                style={styles.indicator}
            />
        </Animated.View>
    );
};

const AnimatedTabIcon: React.FC<{ name: any; focused: boolean; color: string; size: number; activeColor: string }> = ({ name, focused, color, size, activeColor }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.3 : 1, { damping: 12, stiffness: 200 });
        translateY.value = withSpring(focused ? -4 : 0, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(focused ? 1 : 0.5, { duration: 300 });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value },
            { translateY: translateY.value }
        ] as any,
        opacity: opacity.value,
    }));


    return (
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
            <Ionicons name={name} size={size + 2} color={focused ? activeColor : color} />
            {focused && (
                <View style={[styles.activeGlow, { backgroundColor: activeColor }]} />
            )}
        </Animated.View>
    );
};

const BrandedHeader: React.FC<{ title: string; colors: any; typography: any; spacing: any; radius: any }> = ({ title, colors, typography, spacing, radius }) => (
    <View style={styles.headerContainer}>
        <View style={[styles.headerLogoMount, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            <ProWiseLogoSvg width={20} height={20} />
        </View>
        <Text style={[styles.headerTitleText, { color: colors.textStrong }]}>{title.toUpperCase()}</Text>
        <View style={[styles.headerStatus, { backgroundColor: `${colors.success}1A` }]}>
            <View style={[styles.statusPulse, { backgroundColor: colors.success }]} />
            <Text style={[styles.statusText, { color: colors.success }]}>CORE ONLINE</Text>
        </View>
    </View>
);

const CustomTabBar = ({ state, descriptors, navigation, theme }: any) => {
    const { colors, shadows } = theme;
    return (
        <View style={[styles.tabBarWrapper, { borderColor: `${colors.primary}33`, ...shadows.lg }]}>
            <BlurView tint={theme.isDark ? "dark" : "light"} intensity={95} style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.surface}D9` }]} />
            </BlurView>
            
            <TabIndicator index={state.index} color={colors.primary} />

            <View style={styles.tabItemsContainer}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const iconName = ICONS[route.name] || 'square-outline';
                    const color = isFocused ? colors.primary : colors.textMuted;

                    return (
                        <TouchableOpacity
                            key={route.key}
                            onPress={onPress}
                            style={styles.tabItem}
                            activeOpacity={0.7}
                        >
                            <AnimatedTabIcon 
                                name={isFocused ? ((iconName as string).replace('-outline', '') as any) : iconName} 
                                focused={isFocused} 
                                color={color} 
                                size={24} 
                                activeColor={colors.primary}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};


const MainTabNavigator: React.FC = () => {
    const theme = useTheme();
    const { colors, typography, spacing, radius } = theme;

    return (
        <Tab.Navigator
            tabBar={(props: any) => <CustomTabBar {...props} theme={theme} />}
            screenOptions={({ route }: any) => ({
                headerStyle: {
                    backgroundColor: colors.bg,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    height: Platform.OS === 'ios' ? 110 : 90,
                },
                headerTitle: ({ children }: any) => <BrandedHeader title={children} colors={colors} typography={typography} spacing={spacing} radius={radius} />,
                headerTitleAlign: 'left',
                headerTintColor: colors.textStrong,
                headerBackground: () => (
                    <BlurView intensity={80} tint={theme.isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
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
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 34 : 24,
        left: 20,
        right: 20,
        height: 70,
        borderRadius: 35,
        overflow: 'hidden',
        borderWidth: 1.5,
        elevation: 20,
    },
    tabItemsContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
    },
    activeGlow: {
        position: 'absolute',
        width: 30,
        height: 30,
        borderRadius: 15,
        opacity: 0.15,
        zIndex: -1,
    },
    indicatorWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: TAB_WIDTH,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 16,
    },
    headerLogoMount: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginRight: 16,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: '600',
        letterSpacing: 2,
        flex: 1,
    },
    headerStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        gap: 6,
    },
    statusPulse: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 8,
        fontWeight: '900',
        letterSpacing: 1,
    },
});

export default MainTabNavigator;

