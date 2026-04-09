import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withRepeat, 
    withSequence, 
    withTiming,
} from 'react-native-reanimated';
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ShopStackNavigator from './ShopStackNavigator';
import { colors, shadows } from '../theme';
import { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
    Home: 'home-outline',
    Shop: 'grid-outline',
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
        scale.value = withSpring(focused ? 1.2 : 1, {
            damping: 12,
            stiffness: 100,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    return (
        <Animated.View style={animatedStyle}>
            <Ionicons name={name} size={size + 2} color={color} />
        </Animated.View>
    );
};

interface AnimatedScanButtonProps {
    focused: boolean;
    size: number;
}

const AnimatedScanButton: React.FC<AnimatedScanButtonProps> = ({ focused, size }) => {
    const scale = useSharedValue(1);
    const pulse = useSharedValue(1);

    useEffect(() => {
        pulse.value = withRepeat(
            withSequence(
                withTiming(1.1, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    useEffect(() => {
        scale.value = withSpring(focused ? 1.15 : 1, {
            damping: 15,
            stiffness: 150,
        });
    }, [focused]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: scale.value * (focused ? 1 : pulse.value) }
        ],
        shadowOpacity: focused ? 0.4 : 0.2,
    }));

    return (
        <Animated.View style={[
            styles.scanButtonContainer,
            { width: size + 24, height: size + 24, borderRadius: (size + 24) / 2 },
            animatedStyle
        ]}>
            <Ionicons name="qr-code-outline" size={size + 4} color="white" />
        </Animated.View>
    );
};

const MainTabNavigator: React.FC = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarStyle: {
                    backgroundColor: colors.glass,
                    borderTopColor: colors.glassBorder,
                    borderTopWidth: 1,
                    paddingBottom: 6,
                    paddingTop: 6,
                    height: 60,
                    position: 'absolute',
                    elevation: 0,
                },
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textMuted,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                tabBarIcon: ({ focused, color, size }) => {
                    const iconName = ICONS[route.name] || 'square-outline';
                    
                    if (route.name === 'Scan') {
                        return <AnimatedScanButton focused={focused} size={size} />;
                    }

                    return (
                        <AnimatedTabIcon 
                            name={iconName} 
                            focused={focused} 
                            color={color} 
                            size={size} 
                        />
                    );
                },
                headerStyle: {
                    backgroundColor: colors.bg,
                    borderBottomColor: colors.border,
                    borderBottomWidth: 1,
                    shadowOpacity: 0,
                    elevation: 0,
                },
                headerTitleStyle: {
                    fontWeight: '700',
                    color: colors.textStrong,
                },
                headerTintColor: colors.textStrong,
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen as any} />
            <Tab.Screen name="Shop" component={ShopStackNavigator as any} options={{ headerShown: false }} />
            <Tab.Screen 
                name="Scan" 
                component={require('../screens/QRScannerScreen').default} 
                options={{ 
                    title: 'Scan',
                    tabBarLabel: () => null 
                }} 
            />
            <Tab.Screen name="Profile" component={ProfileScreen as any} />
        </Tab.Navigator>
    );
};

const styles = StyleSheet.create({
    scanButtonContainer: {
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 5,
        ...shadows.glow,
    }
});

export default MainTabNavigator;
