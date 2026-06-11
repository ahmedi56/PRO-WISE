import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform, Dimensions, TouchableOpacity } from 'react-native';
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
import { useSelector } from 'react-redux';

const { width } = Dimensions.get('window');

import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopStackNavigator from './ShopStackNavigator';
import { useTheme } from '../theme';

import { RootState } from '../store';
import { MainTabParamList } from './types';
import { ProWiseLogoSvg } from '../components/ProWiseLogoSvg';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'hardware-chip-outline',
    Shop: 'cube-outline',
    Scan: 'aperture-outline',
    TechnicianPortal: 'hammer-outline',
    Profile: 'shield-checkmark-outline',
};

const LABELS: Record<string, string> = {
    Home: 'Console',
    Shop: 'Registry',
    Scan: 'Scan',
    TechnicianPortal: 'Tech Portal',
    Profile: 'Operator',
};

interface TabIndicatorProps {
    index: number;
    color: string;
    tabWidth: number;
}

const TabIndicator: React.FC<TabIndicatorProps> = ({ index, color, tabWidth }) => {
    const translateX = useSharedValue(index * tabWidth);

    useEffect(() => {
        translateX.value = withSpring(index * tabWidth, {
            damping: 18,
            stiffness: 150,
            mass: 0.8,
        });
    }, [index, tabWidth]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
    }));

    return (
        <Animated.View style={[styles.indicatorWrapper, { width: tabWidth }, animatedStyle]}>
            <LinearGradient
                colors={[`${color}66`, `${color}1A`]}
                style={[styles.indicator, { width: tabWidth - 16 }]}
            />
        </Animated.View>
    );
};

const AnimatedTabIcon: React.FC<{ name: any; focused: boolean; color: string; size: number; activeColor: string; label: string }> = ({ name, focused, color, size, activeColor, label }) => {
    const scale = useSharedValue(1);
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 200 });
        translateY.value = withSpring(focused ? -2 : 0, { damping: 15, stiffness: 150 });
        opacity.value = withTiming(focused ? 1 : 0.6, { duration: 300 });
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
            <Ionicons name={name} size={size} color={focused ? activeColor : color} />
            <Text style={{ 
                fontSize: 9, 
                fontWeight: focused ? '700' : '500', 
                color: focused ? activeColor : color,
                marginTop: 2,
                textAlign: 'center'
            }}>
                {label}
            </Text>
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
    const tabsCount = state.routes.length;
    const tabWidth = (width - 32) / tabsCount;

    return (
        <View style={[styles.tabBarWrapper, { borderColor: `${colors.primary}33`, ...shadows.lg }]}>
            <BlurView tint={theme.isDark ? "dark" : "light"} intensity={95} style={StyleSheet.absoluteFill}>
                <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.surface}E6` }]} />
            </BlurView>
            
            <TabIndicator index={state.index} color={colors.primary} tabWidth={tabWidth} />

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
                    const labelText = LABELS[route.name] || route.name;
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
                                size={20} 
                                activeColor={colors.primary}
                                label={labelText}
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
    const { user } = useSelector((state: RootState) => state.auth);
    const isApprovedTech = (user?.isTechnician && user?.technicianStatus === 'approved') || 
        user?.role === 'technician' || 
        (typeof user?.role === 'object' && (user?.role as any)?.name === 'technician');

    return (
        <Tab.Navigator
            tabBar={(props: any) => <CustomTabBar {...props} theme={theme} />}
            screenOptions={({ route, navigation }: any) => ({
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
                ),
                headerRight: () => (
                    <TouchableOpacity 
                        style={{ marginRight: 16, padding: 8 }} 
                        onPress={() => navigation.navigate('Search')}
                    >
                        <Ionicons name="search-outline" size={24} color={colors.textStrong} />
                    </TouchableOpacity>
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
            {isApprovedTech && (
                <Tab.Screen 
                    name="TechnicianPortal" 
                    component={require('../screens/TechnicianPortalScreen').default} 
                    options={{ headerShown: false, title: 'Tech Portal' }} 
                />
            )}
            <Tab.Screen name="Profile" component={ProfileScreen as any} options={{ title: 'Operator' }} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    tabBarWrapper: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 30 : 20,
        left: 16,
        right: 16,
        height: 72,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
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
        width: '100%',
        paddingVertical: 4,
    },
    indicatorWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    indicator: {
        height: 52,
        borderRadius: 14,
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
